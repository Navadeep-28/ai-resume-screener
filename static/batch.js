// static/batch.js
// ================= BATCH RESUME SCREENING (ES MODULE - TAILWIND VERSION) =================

export function initBatchScreening() {
    const batchForm = document.querySelector('form[action="/batch-screen"]');
    if (!batchForm) return;

    batchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(batchForm);
        const submitBtn = batchForm.querySelector('button[type="submit"]');

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                </svg>
                <span>Processing Resumes...</span>
            `;
        }

        try {
            const res = await fetch("/batch-screen", {
                method: "POST",
                body: formData
            });

            const contentType = res.headers.get("content-type") || "";

            // ✅ FALLBACK: Server returned HTML → render it
            if (!contentType.includes("application/json")) {
                const html = await res.text();
                document.open();
                document.write(html);
                document.close();
                return;
            }

            const data = await res.json();

            if (!data.ranked_results || !Array.isArray(data.ranked_results)) {
                throw new Error("Invalid batch response format");
            }

            // ---- RENDER RESULTS (TAILWIND UI) ----
            const container = document.getElementById("dynamic-results");
            if (!container) return;

            container.innerHTML = "";

            // Add header
            container.innerHTML = `
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl border border-white/20 shadow-lg shadow-purple-500/20">
                        <svg class="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Batch Screening Results
                    </h2>
                    <p class="text-white/60">${data.ranked_results.length} candidates analyzed and ranked</p>
                </div>
                <div id="results-list" class="space-y-4"></div>
            `;

            const resultsList = document.getElementById("results-list");

            data.ranked_results.forEach((r, index) => {
                const status = r.final >= 65 ? "PASS" : "FAIL";
                const risk = r.final < 60 ? "HIGH" : r.final < 75 ? "MEDIUM" : "LOW";
                const riskColor = risk === "HIGH" ? "text-red-400" : risk === "MEDIUM" ? "text-yellow-400" : "text-emerald-400";
                const statusClasses = status === "PASS" 
                    ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400" 
                    : "bg-red-500/20 border-2 border-red-400 text-red-400";

                const card = document.createElement("section");
                card.className = "result-card bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg shadow-black/10 hover:bg-white/[0.12] transition duration-300";
                card.style.animationDelay = `${index * 0.1}s`;

                card.innerHTML = `
                    <div class="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr_1fr] gap-6 items-center">

                        <!-- CHECKBOX -->
                        <div class="flex items-center justify-center lg:justify-start">
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    class="compare-checkbox appearance-none w-6 h-6 border-2 border-white/30 rounded-lg bg-white/10 cursor-pointer transition-all duration-200 checked:bg-gradient-to-br checked:from-indigo-500 checked:to-purple-500 checked:border-indigo-500 hover:border-blue-400 hover:bg-blue-500/20 relative"
                                    name="compare_ids"
                                    value="${index}"
                                >
                                <span class="text-xs text-white/50 group-hover:text-white/70 transition hidden lg:inline">
                                    Compare
                                </span>
                            </label>
                        </div>

                        <!-- LEFT: Status -->
                        <div class="flex flex-col items-center lg:items-start text-center lg:text-left">
                            <div class="px-6 py-2 rounded-full text-sm font-bold mb-3 ${statusClasses}">
                                ${status}
                            </div>

                            <div class="bg-white/5 rounded-xl p-4 w-full">
                                <h3 class="font-semibold mb-2 flex items-center gap-2 justify-center lg:justify-start">
                                    <span class="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-sm font-bold">
                                        ${index + 1}
                                    </span>
                                    <span class="truncate max-w-[150px]" title="${r.filename}">
                                        ${r.filename}
                                    </span>
                                </h3>
                                <span class="inline-block px-3 py-1 rounded-full text-xs bg-blue-500/20 border border-blue-400/40 text-blue-300">
                                    ATS Confidence: ${r.final}%
                                </span>
                            </div>
                        </div>

                        <!-- CENTER: Metrics -->
                        <div class="flex flex-row lg:flex-col gap-3">
                            <div class="bg-white/5 rounded-xl p-4 text-center flex-1">
                                <span class="text-xs text-white/60 block mb-1">JD Coverage</span>
                                <span class="text-2xl font-bold text-blue-400">${r.coverage}%</span>
                            </div>

                            <div class="bg-white/5 rounded-xl p-4 text-center flex-1">
                                <span class="text-xs text-white/60 block mb-1">Hiring Risk</span>
                                <span class="text-2xl font-bold ${riskColor}">
                                    ${risk}
                                </span>
                            </div>
                        </div>

                        <!-- RIGHT: Scores -->
                        <div class="flex flex-col items-center">
                            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-5 w-full text-center mb-3 border border-white/10">
                                <span class="text-xs text-white/60 block mb-1">Final Score</span>
                                <h2 class="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    ${r.final.toFixed(1)}%
                                </h2>
                            </div>

                            <div class="flex gap-2 w-full">
                                <div class="bg-white/5 rounded-lg p-2 flex-1 text-center">
                                    <span class="text-[10px] text-white/60 block">Quality</span>
                                    <strong class="text-sm">${r.quality}%</strong>
                                </div>
                                <div class="bg-white/5 rounded-lg p-2 flex-1 text-center">
                                    <span class="text-[10px] text-white/60 block">Match</span>
                                    <strong class="text-sm">${r.match}%</strong>
                                </div>
                            </div>
                        </div>

                    </div>
                `;

                resultsList.appendChild(card);
            });

            // Add action buttons
            container.innerHTML += `
                <div class="flex flex-wrap justify-center gap-4 mt-10">
                    <button
                        type="button"
                        id="export-batch-pdf-dynamic"
                        class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Export Batch Results PDF
                    </button>

                    <button
                        type="button"
                        id="compare-btn-dynamic"
                        class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        disabled
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        Compare Selected
                    </button>

                    <a href="/" 
                       class="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-semibold transition duration-200 flex items-center gap-2">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                        New Batch Screening
                    </a>
                </div>

                <!-- Legend -->
                <div class="mt-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h4 class="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Score Legend
                    </h4>
                    <div class="flex flex-wrap gap-4 text-sm">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                            <span class="text-white/60">65%+ = PASS (Low Risk)</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
                            <span class="text-white/60">60-74% = PASS (Medium Risk)</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-red-400"></span>
                            <span class="text-white/60">&lt;65% = FAIL (High Risk)</span>
                        </div>
                    </div>
                </div>
            `;

            // Initialize dynamic compare functionality
            initDynamicBatchCompare();

            // Initialize dynamic PDF export
            const exportBtn = document.getElementById("export-batch-pdf-dynamic");
            if (exportBtn) {
                exportBtn.addEventListener("click", () => window.print());
            }

            // Scroll to results
            container.scrollIntoView({ behavior: "smooth", block: "start" });

            // Show success notification
            showNotification(`Successfully analyzed ${data.ranked_results.length} resumes!`, "success");

        } catch (err) {
            console.error("Batch screening failed:", err);
            showNotification("Batch screening failed. Please try again.", "error");
        } finally {
            // Restore button state
            if (submitBtn && submitBtn.dataset.originalContent) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalContent;
            }
        }
    });
}

/* ======================================================
   ✅ FIXED: Batch Compare Checkbox Logic (ES MODULE SAFE)
====================================================== */

export function initBatchCompare() {
    const form = document.getElementById("batch-compare-form");
    if (!form) return;

    const compareBtn = document.getElementById("compare-btn");
    const checkboxes = form.querySelectorAll(".compare-checkbox");

    if (compareBtn) {
        compareBtn.disabled = true;
    }

    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const selected = [...checkboxes].filter(c => c.checked);

            // Max 2 selections
            if (selected.length > 2) {
                cb.checked = false;
                showNotification("You can only compare 2 resumes at a time", "info");
                return;
            }

            // Enable only when exactly 2 selected
            if (compareBtn) {
                compareBtn.disabled = selected.length !== 2;

                // Update button appearance
                if (selected.length === 2) {
                    compareBtn.classList.remove("opacity-50", "cursor-not-allowed");
                    compareBtn.classList.add("hover:scale-[1.02]");
                } else {
                    compareBtn.classList.add("opacity-50", "cursor-not-allowed");
                    compareBtn.classList.remove("hover:scale-[1.02]");
                }

                // Update button text
                compareBtn.innerHTML = `
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    Compare Selected${selected.length > 0 ? ` (${selected.length})` : ''}
                `;
            }
        });
    });
}

/**
 * Initialize compare functionality for dynamically rendered results
 */
function initDynamicBatchCompare() {
    const compareBtn = document.getElementById("compare-btn-dynamic");
    const checkboxes = document.querySelectorAll("#dynamic-results .compare-checkbox");

    if (!compareBtn || checkboxes.length === 0) return;

    compareBtn.disabled = true;

    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const selected = [...checkboxes].filter(c => c.checked);

            // Max 2 selections
            if (selected.length > 2) {
                cb.checked = false;
                showNotification("You can only compare 2 resumes at a time", "info");
                return;
            }

            // Enable only when exactly 2 selected
            compareBtn.disabled = selected.length !== 2;

            // Update button appearance
            if (selected.length === 2) {
                compareBtn.classList.remove("opacity-50", "cursor-not-allowed");
                compareBtn.classList.add("hover:scale-[1.02]");
            } else {
                compareBtn.classList.add("opacity-50", "cursor-not-allowed");
                compareBtn.classList.remove("hover:scale-[1.02]");
            }

            // Update button text
            compareBtn.innerHTML = `
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                Compare Selected${selected.length > 0 ? ` (${selected.length})` : ''}
            `;
        });
    });

    // Handle compare button click
    compareBtn.addEventListener("click", () => {
        const selected = [...checkboxes].filter(c => c.checked);
        if (selected.length === 2) {
            // Get the indices of selected resumes
            const indices = selected.map(cb => cb.value);
            showNotification(`Comparing resumes: ${indices.join(" vs ")}`, "info");
            // Here you would typically redirect or open a compare modal
        }
    });
}

/**
 * Show notification toast
 */
function showNotification(message, type = "info") {
    const container = document.getElementById("notification-container") || createNotificationContainer();

    let bgClass = "bg-blue-500/20 border-blue-400/40 text-blue-300";
    if (type === "error") bgClass = "bg-red-500/20 border-red-400/40 text-red-300";
    if (type === "success") bgClass = "bg-emerald-500/20 border-emerald-400/40 text-emerald-300";

    const notification = document.createElement("div");
    notification.className = `
        px-6 py-4 rounded-2xl backdrop-blur-xl border shadow-lg
        flex items-center gap-3 transform translate-x-full
        transition-transform duration-300 ${bgClass}
    `;

    const icons = {
        error: `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        success: `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,
        info: `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
        </svg>`
    };

    notification.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
        <button class="ml-2 hover:opacity-70 transition" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    container.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.remove("translate-x-full");
    });

    setTimeout(() => {
        notification.classList.add("translate-x-full");
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Create notification container
 */
function createNotificationContainer() {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.className = "fixed top-24 right-6 z-[100] flex flex-col gap-3";
    document.body.appendChild(container);
    return container;
}

// Add animations and checkbox styles
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeInUp {
        0% {
            opacity: 0;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .result-card {
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
    }
    
    .compare-checkbox:checked::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 14px;
        font-weight: bold;
    }
    
    .compare-checkbox {
        position: relative;
    }
`;
document.head.appendChild(style);

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initBatchScreening();
        initBatchCompare();
    });
} else {
    initBatchScreening();
    initBatchCompare();
}

// Export as default
export default { initBatchScreening, initBatchCompare };
