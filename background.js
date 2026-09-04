let activeTabId = null;
let activeDomain = null;
let startTime = null;


// Get domain from URL
function getDomain(url) {

    try {

        const parsedUrl = new URL(url);

        return parsedUrl.hostname;

    } catch {

        return null;
    }
}


// Save current session
async function saveCurrentSession() {

    if (!activeDomain || !startTime) {
        return;
    }

    const now = Date.now();

    const elapsedSeconds =
        Math.floor(
            (now - startTime) / 1000
        );

    if (elapsedSeconds <= 0) {
        return;
    }


    const data =
        await chrome.storage.local.get(
            "websiteTime"
        );

    const websiteTime =
        data.websiteTime || {};


    websiteTime[activeDomain] =
        (websiteTime[activeDomain] || 0)
        + elapsedSeconds;


    await chrome.storage.local.set({
        websiteTime
    });


    // Start a new timing period
    startTime = now;
}


// Start tracking a tab
async function startTracking(tab) {

    // Save previous website time
    await saveCurrentSession();


    activeTabId = tab.id;

    activeDomain =
        getDomain(tab.url);


    startTime = Date.now();


    console.log(
        "Tracking:",
        activeDomain
    );
}


// When user switches tabs
chrome.tabs.onActivated.addListener(
    async (activeInfo) => {

        try {

            const tab =
                await chrome.tabs.get(
                    activeInfo.tabId
                );

            await startTracking(tab);

        } catch (error) {

            console.error(
                "Tab activation error:",
                error
            );
        }
    }
);


// When URL changes
chrome.tabs.onUpdated.addListener(
    async (
        tabId,
        changeInfo,
        tab
    ) => {

        if (
            tabId === activeTabId &&
            changeInfo.url
        ) {

            await startTracking(tab);
        }
    }
);


// When a tab is closed
chrome.tabs.onRemoved.addListener(
    async (tabId) => {

        if (tabId === activeTabId) {

            await saveCurrentSession();

            activeTabId = null;
            activeDomain = null;
            startTime = null;
        }
    }
);


// When Chrome starts
chrome.runtime.onStartup.addListener(
    async () => {

        const tabs =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        if (tabs.length > 0) {

            await startTracking(
                tabs[0]
            );
        }
    }
);


// When extension is installed/reloaded
chrome.runtime.onInstalled.addListener(
    async () => {

        const tabs =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        if (tabs.length > 0) {

            await startTracking(
                tabs[0]
            );
        }
    }
);


// Save time periodically
setInterval(
    async () => {

        await saveCurrentSession();

    },
    5000
);