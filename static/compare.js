// static/compare.js
// ================= RESUME COMPARISON (ES MODULE - TAILWIND VERSION) =================

export function initResumeComparison() {
    const compareForm = document.querySelector('form[action="/compare-resumes"]');
    if (!compareForm) return;

    compareForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(compareForm);
        const submitBtn = compareForm.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                </svg>
                Comparing Resumes...
            `;
        }

        try {
            const res = await fetch("/compare-resumes", {
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

            if (!data.resume_1 || !data.resume_2 || !data.winner) {
                throw new Error("Invalid comparison response format");
            }

            // ---- RENDER RESULTS (TAILWIND UI) ----
            const winner = data.winner;
            const resume1Wins = winner === "resume_1";
            const resume2Wins = winner === "resume_2";

            const html = `
                <div id="compare_results" class="mt-8 space-y-6 animate-fade-in">
                    
                    <!-- Winner Announcement -->
                    <div class="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-yellow-400/40 rounded-3xl p-8 text-center shadow-lg shadow-yellow-500/10">
                        <div class="flex items-center justify-center gap-4">
                            <span class="text-4xl animate-bounce">🏆</span>
                            <div>
                                <p class="text-yellow-400/80 text-sm font-medium mb-1">Better Resume</p>
                                <h2 class="text-2xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                    ${winner.replace("_", " ").toUpperCase()}
                                </h2>
                            </div>
                            <span class="text-4xl animate-bounce">🏆</span>
                        </div>
                    </div>

                    <!-- Comparison Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- Resume 1 Card -->
                        <div class="${resume1Wins ? 'ring-2 ring-yellow-400/50' : ''} bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg shadow-black/10 transition duration-300 hover:bg-white/[0.12]">
                            
                            <!-- Header -->
                            <div class="flex items-center justify-between mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${resume1Wins ? 'from-yellow-500/30 to-amber-500/30 border-yellow-400/40' : 'from-slate-500/30 to-gray-500/30 border-slate-400/40'} border">
                                        <span class="text-2xl">${resume1Wins ? '👑' : '📄'}</span>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg text-white">Resume 1</h3>
                                        <span class="text-xs text-white/50">Candidate A</span>
                                    </div>
                                </div>
                                <div class="px-4 py-2 rounded-full text-sm font-bold ${resume1Wins ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400' : 'bg-red-500/20 border-2 border-red-400 text-red-400'}">
                                    ${resume1Wins ? 'WINNER' : 'LOSES'}
                                </div>
                            </div>

                            <!-- Final Score -->
                            <div class="bg-gradient-to-br ${resume1Wins ? 'from-yellow-500/20 to-amber-500/20 border-yellow-400/20' : 'from-slate-500/20 to-gray-500/20 border-slate-400/20'} rounded-2xl p-6 text-center mb-6 border">
                                <span class="text-sm text-white/60 block mb-2">Final Score</span>
                                <h2 class="text-4xl font-extrabold ${resume1Wins ? 'bg-gradient-to-r from-yellow-400 to-amber-400' : 'bg-gradient-to-r from-slate-400 to-gray-400'} bg-clip-text text-transparent">
                                    ${(data.resume_1.final * 100).toFixed(1)}%
                                </h2>
                            </div>

                            <!-- Metrics -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-white/5 rounded-xl p-4 text-center">
                                    <span class="text-xs text-white/60 block mb-1">Job Match</span>
                                    <span class="text-xl font-bold text-purple-400">${(data.resume_1.match * 100).toFixed(1)}%</span>
                                </div>
                                <div class="bg-white/5 rounded-xl p-4 text-center">
                                    <span class="text-xs text-white/60 block mb-1">JD Coverage</span>
                                    <span class="text-xl font-bold text-blue-400">${data.resume_1.coverage}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Resume 2 Card -->
                        <div class="${resume2Wins ? 'ring-2 ring-yellow-400/50' : ''} bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg shadow-black/10 transition duration-300 hover:bg-white/[0.12]">
                            
                            <!-- Header -->
                            <div class="flex items-center justify-between mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${resume2Wins ? 'from-yellow-500/30 to-amber-500/30 border-yellow-400/40' : 'from-slate-500/30 to-gray-500/30 border-slate-400/40'} border">
                                        <span class="text-2xl">${resume2Wins ? '👑' : '📄'}</span>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg text-white">Resume 2</h3>
                                        <span class="text-xs text-white/50">Candidate B</span>
                                    </div>
                                </div>
                                <div class="px-4 py-2 rounded-full text-sm font-bold ${resume2Wins ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400' : 'bg-red-500/20 border-2 border-red-400 text-red-400'}">
                                    ${resume2Wins ? 'WINNER' : 'LOSES'}
                                </div>
                            </div>

                            <!-- Final Score -->
                            <div class="bg-gradient-to-br ${resume2Wins ? 'from-yellow-500/20 to-amber-500/20 border-yellow-400/20' : 'from-slate-500/20 to-gray-500/20 border-slate-400/20'} rounded-2xl p-6 text-center mb-6 border">
                                <span class="text-sm text-white/60 block mb-2">Final Score</span>
                                <h2 class="text-4xl font-extrabold ${resume2Wins ? 'bg-gradient-to-r from-yellow-400 to-amber-400' : 'bg-gradient-to-r from-slate-400 to-gray-400'} bg-clip-text text-transparent">
                                    ${(data.resume_2.final * 100).toFixed(1)}%
                                </h2>
                            </div>

                            <!-- Metrics -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-white/5 rounded-xl p-4 text-center">
                                    <span class="text-xs text-white/60 block mb-1">Job Match</span>
                                    <span class="text-xl font-bold text-purple-400">${(data.resume_2.match * 100).toFixed(1)}%</span>
                                </div>
                                <div class="bg-white/5 rounded-xl p-4 text-center">
                                    <span class="text-xs text-white/60 block mb-1">JD Coverage</span>
                                    <span class="text-xl font-bold text-blue-400">${data.resume_2.coverage}%</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Comparison Summary -->
                    <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h4 class="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Comparison Summary
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div class="bg-white/5 rounded-xl p-4">
                                <span class="text-white/50 block mb-2">Score Difference</span>
                                <span class="text-2xl font-bold text-white">
                                    ${Math.abs((data.resume_1.final - data.resume_2.final) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div class="bg-white/5 rounded-xl p-4">
                                <span class="text-white/50 block mb-2">Coverage Difference</span>
                                <span class="text-2xl font-bold text-blue-400">
                                    ${Math.abs(data.resume_1.coverage - data.resume_2.coverage)}%
                                </span>
                            </div>
                            <div class="bg-white/5 rounded-xl p-4">
                                <span class="text-white/50 block mb-2">Decision Confidence</span>
                                <span class="text-2xl font-bold ${Math.abs((data.resume_1.final - data.resume_2.final) * 100) > 15 ? 'text-emerald-400' : Math.abs((data.resume_1.final - data.resume_2.final) * 100) > 5 ? 'text-yellow-400' : 'text-orange-400'}">
                                    ${Math.abs((data.resume_1.final - data.resume_2.final) * 100) > 15 ? 'HIGH' : Math.abs((data.resume_1.final - data.resume_2.final) * 100) > 5 ? 'MEDIUM' : 'CLOSE CALL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap justify-center gap-4 mt-6">
                        <button 
                            type="button"
                            onclick="window.print()"
                            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center gap-2"
                        >
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            Export PDF
                        </button>
                        <button 
                            type="button"
                            onclick="document.getElementById('compare_results').remove()"
                            class="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-semibold transition duration-200 flex items-center gap-2"
                        >
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                            Compare Again
                        </button>
                    </div>

                </div>
            `;

            const existing = document.getElementById("compare_results");
            if (existing) existing.remove();

            compareForm.parentElement.insertAdjacentHTML("beforeend", html);

            // Scroll to results
            document.getElementById("compare_results")?.scrollIntoView({ 
                behavior: "smooth", 
                block: "start" 
            });

            // Show success notification
            showNotification("Comparison completed successfully!", "success");

        } catch (err) {
            console.error("Resume comparison failed:", err);
            showNotification("Resume comparison failed. Please try again.", "error");
        } finally {
            // Restore button state
            if (submitBtn && submitBtn.dataset.originalContent) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalContent;
            }
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

// Add fade-in animation style
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeIn {
        0% {
            opacity: 0;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
    }
`;
document.head.appendChild(style);

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResumeComparison);
} else {
    initResumeComparison();
}

// Export as default
export default initResumeComparison;
