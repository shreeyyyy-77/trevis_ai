const API_BASE = "http://localhost:8000";

const inputEl = document.getElementById("headline-input");
const btnEl = document.getElementById("analyse-btn");
const errorEl = document.getElementById("error-msg");
const loaderEl = document.getElementById("loader");
const resultCardEl = document.getElementById("result-card");

const scoreValueEl = document.getElementById("score-value");
const scoreRingFill = document.querySelector(".score-ring circle.fill");
const verdictBadgeEl = document.getElementById("verdict-badge");
const summaryTextEl = document.getElementById("summary-text");
const reasoningTextEl = document.getElementById("reasoning-text");
const sourcesListEl = document.getElementById("sources-list");

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
}

function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
}

function showLoader(show) {
    if (show) {
        loaderEl.classList.remove("hidden");
        resultCardEl.classList.add("hidden");
    } else {
        loaderEl.classList.add("hidden");
    }
}

function disableButton(disable) {
    btnEl.disabled = disable;
    btnEl.textContent = disable ? "Analysing..." : "Analyse";
    inputEl.disabled = disable;
}

btnEl.addEventListener("click", async () => {
    const headline = inputEl.value.trim();

    // Validate
    if (!headline || headline.length < 10) {
        showError("Please enter a headline of at least 10 characters.");
        return;
    }

    clearError();
    showLoader(true);
    disableButton(true);

    try {
        const res = await fetch(`${API_BASE}/analyse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ headline })
        });

        if (!res.ok) {
            let errorMsg = `Server error: ${res.status}`;
            try {
                const errData = await res.json();
                errorMsg = errData.detail ? JSON.stringify(errData.detail) : errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }

        const data = await res.json();
        renderResult(data);

    } catch (err) {
        showError("Something went wrong. Please check the backend is running and try again. Details: " + err.message);
        console.error(err);
    } finally {
        showLoader(false);
        disableButton(false);
    }
});

function renderResult(data) {
    // 1. Map score to verdict class and colors
    let verdictClass = "verdict-unverified";
    let ringColor = "#888780"; // Unverified default

    if (data.score >= 75) {
        verdictClass = "verdict-true";
        ringColor = "#1D9E75";
    } else if (data.score >= 50) {
        verdictClass = "verdict-context";
        ringColor = "#EF9F27";
    } else if (data.score >= 25) {
        verdictClass = "verdict-misleading";
        ringColor = "#D85A30";
    } else if (data.score >= 0 && data.verdict !== "Unverified") {
        verdictClass = "verdict-false";
        ringColor = "#E24B4A";
    }

    // 2. Populate basic text
    scoreValueEl.textContent = data.score;
    verdictBadgeEl.textContent = data.verdict;
    verdictBadgeEl.className = `verdict-badge ${verdictClass}`;
    summaryTextEl.textContent = data.summary;
    reasoningTextEl.textContent = data.reasoning;

    // 3. Animate score ring: dashoffset = 283 - (score/100 × 283)
    const offset = 283 - (data.score / 100 * 283);
    
    // Reset ring first to ensure transition fires
    scoreRingFill.style.transition = 'none';
    scoreRingFill.style.strokeDashoffset = '283';
    scoreRingFill.style.stroke = ringColor;
    
    // Force reflow
    void scoreRingFill.offsetWidth;
    
    // Apply animation
    scoreRingFill.style.transition = 'stroke-dashoffset 1.2s ease-out, stroke 0.5s';
    scoreRingFill.style.strokeDashoffset = offset;

    // 4. Render sources
    sourcesListEl.innerHTML = "";
    if (data.sources && data.sources.length > 0) {
        data.sources.forEach(source => {
            const li = document.createElement("li");
            
            try {
                const urlObj = new URL(source.url);
                var domain = urlObj.hostname.replace('www.', '');
            } catch(e) {
                var domain = source.url;
            }

            const stanceClass = `stance-${source.stance}`;
            
            li.innerHTML = `
                <div style="flex: 1; padding-right: 12px; overflow: hidden;">
                    <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a>
                    <div class="source-domain">${domain}</div>
                </div>
                <div class="stance-indicator ${stanceClass}">${source.stance}</div>
            `;
            sourcesListEl.appendChild(li);
        });
    } else {
        sourcesListEl.innerHTML = "<li><div class='source-domain'>No verifiable sources found.</div></li>";
    }

    // Show the card
    resultCardEl.classList.remove("hidden");
}
