// static/export-batch-pdf.js
// ================= EXPORT BATCH RESULTS PDF (ES MODULE - TAILWIND VERSION) =================

export function initExportBatchPDF() {
    const btn = document.getElementById("export-batch-pdf");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        // Store original button content
        const originalContent = btn.innerHTML;
        
        // Show loading state with Tailwind classes
        btn.disabled = true;
        btn.classList.add("opacity-75", "cursor-wait");
        btn.innerHTML = `
            <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span>Preparing PDF...</span>
        `;

        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 300));

        // Add print-specific styles
        const printStyles = document.createElement("style");
        printStyles.id = "print-styles-batch";
        printStyles.textContent = `
            @media print {
                /* Hide non-essential elements */
                #three-canvas,
                nav,
                .mode-btn,
                #export-batch-pdf,
                #compare-btn,
                .clear-btn,
                .compare-checkbox,
                .compare-select,
                button:not(.no-hide),
                a[href]:not(.no-hide),
                #notification-container,
                input[type="checkbox"] {
                    display: none !important;
                }

                /* Reset background for printing */
                body {
                    background: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                /* Make content full width */
                .max-w-5xl,
                .max-w-4xl,
                .max-w-6xl {
                    max-width: 100% !important;
                    padding: 20px !important;
                }

                /* Reset relative positioning */
                .relative {
                    position: relative !important;
                }

                /* Style glassmorphism cards for print */
                .bg-white\\/10,
                .bg-white\\/5,
                [class*="backdrop-blur"] {
                    background: #f8fafc !important;
                    border: 1px solid #e2e8f0 !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    box-shadow: none !important;
                }

                /* Ensure text is readable */
                .text-white,
                .text-white\\/70,
                .text-white\\/60,
                .text-white\\/50,
                .text-white\\/40 {
                    color: #1e293b !important;
                }

                /* Style gradient text for print */
                .bg-gradient-to-r,
                .bg-gradient-to-br,
                .bg-clip-text {
                    -webkit-background-clip: unset !important;
                    background-clip: unset !important;
                    -webkit-text-fill-color: #1e293b !important;
                    color: #1e293b !important;
                }

                /* Status pills - PASS */
                .bg-emerald-500\\/20 {
                    background: #d1fae5 !important;
                    border-color: #10b981 !important;
                }
                .text-emerald-400,
                .text-emerald-300 {
                    color: #059669 !important;
                }
                .border-emerald-400 {
                    border-color: #10b981 !important;
                }

                /* Status pills - FAIL */
                .bg-red-500\\/20 {
                    background: #fee2e2 !important;
                    border-color: #ef4444 !important;
                }
                .text-red-400,
                .text-red-300 {
                    color: #dc2626 !important;
                }
                .border-red-400 {
                    border-color: #ef4444 !important;
                }

                /* Warning colors */
                .bg-yellow-500\\/20,
                .bg-amber-500\\/20 {
                    background: #fef3c7 !important;
                    border-color: #f59e0b !important;
                }
                .text-yellow-400,
                .text-amber-400 {
                    color: #d97706 !important;
                }

                /* Info colors */
                .bg-blue-500\\/20 {
                    background: #dbeafe !important;
                    border-color: #3b82f6 !important;
                }
                .text-blue-400,
                .text-blue-300 {
                    color: #2563eb !important;
                }
                .border-blue-400\\/40 {
                    border-color: #3b82f6 !important;
                }

                /* Purple colors */
                .bg-purple-500\\/20,
                .bg-purple-500\\/30 {
                    background: #ede9fe !important;
                    border-color: #8b5cf6 !important;
                }
                .text-purple-400 {
                    color: #7c3aed !important;
                }

                /* Pink colors */
                .bg-pink-500\\/20,
                .bg-pink-500\\/30 {
                    background: #fce7f3 !important;
                    border-color: #ec4899 !important;
                }
                .text-pink-400 {
                    color: #db2777 !important;
                }

                /* Result cards */
                .result-card,
                section.bg-white\\/10 {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    margin-bottom: 15px !important;
                    padding: 15px !important;
                }

                /* Grid layout for print */
                .grid {
                    display: grid !important;
                }

                .grid-cols-1 {
                    grid-template-columns: 1fr !important;
                }

                /* Rank badges */
                .rounded-full.bg-gradient-to-br {
                    background: #e2e8f0 !important;
                    color: #1e293b !important;
                }

                /* Score display */
                .text-3xl,
                .text-2xl {
                    color: #1e293b !important;
                }

                /* Header styling */
                header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e2e8f0;
                }

                /* Legend section */
                .bg-white\\/5.backdrop-blur-xl {
                    background: #f1f5f9 !important;
                    border: 1px solid #e2e8f0 !important;
                    margin-top: 20px;
                    padding: 15px !important;
                }

                /* Legend dots */
                .rounded-full.bg-emerald-400 {
                    background: #10b981 !important;
                }
                .rounded-full.bg-yellow-400 {
                    background: #f59e0b !important;
                }
                .rounded-full.bg-red-400 {
                    background: #ef4444 !important;
                }

                /* Animations removal */
                .result-card,
                [class*="animate-"] {
                    animation: none !important;
                    opacity: 1 !important;
                    transform: none !important;
                }

                /* Table-like display for results */
                .space-y-4 > * {
                    margin-bottom: 10px !important;
                }

                /* Add page title */
                body::before {
                    content: "Batch Screening Results Report";
                    display: block;
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #1e293b;
                }

                /* Add subtitle with date */
                header::after {
                    content: "Generated: " attr(data-print-date);
                    display: block;
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 10px;
                }

                /* Add footer */
                body::after {
                    content: "AI Resume Screener - Batch Analysis Report";
                    display: block;
                    text-align: center;
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }

                /* Page numbers (if supported) */
                @page {
                    margin: 1.5cm;
                    @bottom-center {
                        content: "Page " counter(page) " of " counter(pages);
                    }
                }

                /* First page header */
                @page :first {
                    margin-top: 2cm;
                }
            }
        `;
        document.head.appendChild(printStyles);

        // Add print date attribute to header
        const header = document.querySelector("header");
        if (header) {
            header.setAttribute("data-print-date", new Date().toLocaleString());
        }

        // Calculate summary stats for print header
        const results = document.querySelectorAll(".result-card, section.bg-white\\/10");
        const passCount = document.querySelectorAll(".text-emerald-400:not(.w-3)").length;
        const totalCount = results.length;

        // Add summary info
        const summaryDiv = document.createElement("div");
        summaryDiv.id = "print-summary";
        summaryDiv.className = "print-only";
        summaryDiv.style.cssText = `
            display: none;
            text-align: center;
            margin-bottom: 20px;
            padding: 15px;
            background: #f1f5f9;
            border-radius: 8px;
        `;
        summaryDiv.innerHTML = `
            <strong>Summary:</strong> ${totalCount} Candidates Analyzed | 
            ${passCount} Passed | ${totalCount - passCount} Failed
        `;

        // Add print-only styles for summary
        const summaryStyles = document.createElement("style");
        summaryStyles.id = "print-summary-styles";
        summaryStyles.textContent = `
            @media print {
                #print-summary {
                    display: block !important;
                }
            }
        `;
        document.head.appendChild(summaryStyles);

        if (header) {
            header.after(summaryDiv);
        }

        // Trigger print
        window.print();

        // Clean up after print dialog closes
        const cleanup = () => {
            // Remove print styles
            const styles = document.getElementById("print-styles-batch");
            if (styles) styles.remove();

            const summaryStylesEl = document.getElementById("print-summary-styles");
            if (summaryStylesEl) summaryStylesEl.remove();

            // Remove summary div
            const summary = document.getElementById("print-summary");
            if (summary) summary.remove();

            // Remove date attribute
            if (header) {
                header.removeAttribute("data-print-date");
            }

            // Restore button state
            btn.disabled = false;
            btn.classList.remove("opacity-75", "cursor-wait");
            btn.innerHTML = originalContent;
        };

        // Listen for after print event
        if (window.matchMedia) {
            const mediaQueryList = window.matchMedia("print");
            const handleChange = (mql) => {
                if (!mql.matches) {
                    cleanup();
                    mediaQueryList.removeEventListener("change", handleChange);
                }
            };
            mediaQueryList.addEventListener("change", handleChange);
        }

        // Fallback cleanup after delay
        setTimeout(cleanup, 2000);
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExportBatchPDF);
} else {
    initExportBatchPDF();
}

// Export as default
export default initExportBatchPDF;
