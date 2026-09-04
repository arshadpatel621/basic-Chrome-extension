async function loadTracker() {
    const data = await chrome.storage.local.get("websiteTime");
    const websiteTime = data.websiteTime || {};

    const websites = Object.entries(websiteTime)
        .sort((a, b) => b[1] - a[1]);

    const totalSeconds = websites.reduce(
        (total, [, seconds]) => total + seconds,
        0
    );

    // Total time
    document.getElementById("totalTime").textContent =
        formatTime(totalSeconds);

    // Website count
    document.getElementById("siteCount").textContent =
        `${websites.length} sites`;

    const list = document.getElementById("websiteList");

    list.innerHTML = "";

    if (websites.length === 0) {

        list.innerHTML = `
            <div style="
                padding:20px;
                text-align:center;
                color:#69758b;
                font-size:12px;
            ">
                No tracking data yet
            </div>
        `;

    } else {

        const maxTime = websites[0][1];

        websites.slice(0, 6).forEach(([domain, seconds], index) => {

            const percentage = Math.max(
                5,
                (seconds / maxTime) * 100
            );

            const row = document.createElement("div");

            row.className = "website";

            row.innerHTML = `
                <div class="rank">
                    ${index + 1}
                </div>

                <div class="website-icon">
                    🌐
                </div>

                <div class="website-details">

                    <div class="website-name">
                        ${domain}
                    </div>

                    <div class="mini-progress">
                        <div
                            class="mini-progress-bar"
                            style="width:${percentage}%">
                        </div>
                    </div>

                </div>

                <div class="website-duration">
                    ${formatTime(seconds)}
                </div>
            `;

            list.appendChild(row);
        });
    }

    // IMPORTANT:
    // Always run this, even when there is no history.
    await showCurrentWebsite();
}


async function showCurrentWebsite() {

    try {

        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tabs.length) {
            return;
        }

        const tab = tabs[0];

        if (!tab.url) {
            return;
        }

        const url = new URL(tab.url);

        const domain = url.hostname;

        if (!domain) {
            return;
        }

        // Show domain
        document.getElementById("currentSite").textContent =
            domain;

        // Get stored time
        const data = await chrome.storage.local.get("websiteTime");

        const websiteTime = data.websiteTime || {};

        const seconds = websiteTime[domain] || 0;

        document.getElementById("currentTime").textContent =
            formatTime(seconds);

        // Calculate progress
        const total = Object.values(websiteTime)
            .reduce((a, b) => a + b, 0);

        const percentage =
            total > 0
                ? (seconds / total) * 100
                : 0;

        document.getElementById("currentProgress").style.width =
            `${Math.min(percentage, 100)}%`;

    } catch (error) {

        console.error(
            "Current website error:",
            error
        );

        document.getElementById("currentSite").textContent =
            "Not trackable";
    }
}


function formatTime(seconds) {

    seconds = Math.floor(seconds);

    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
        (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
}


// Reset button
document
    .getElementById("resetBtn")
    .addEventListener("click", async () => {

        await chrome.storage.local.set({
            websiteTime: {}
        });

        await loadTracker();
    });


// Initial load
loadTracker();


// Refresh popup every second
setInterval(() => {
    loadTracker();
}, 1000);