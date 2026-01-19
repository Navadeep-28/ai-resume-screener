// static/export-compare-pdf.js
// ================= EXPORT COMPARE RESULTS PDF (ES MODULE - TAILWIND VERSION) =================

export function initExportComparePDF() {
    const btn = document.getElementById("export-compare-pdf");
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
        printStyles.id = "print-styles";
        printStyles.textContent = `
            @media print {
                /* Hide non-essential elements */
                #three-canvas,
                nav,
                .mode-btn,
                #export-compare-pdf,
                .clear-btn,
                button,
                a[href],
                #notification-container {
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

                /* Style glassmorphism cards for print */
                .bg-white\\/10,
                .bg-white\\/5,
                [class*="backdrop-blur"] {
                    background: #f8fafc !important;
                    border: 1px solid #e2e8f0 !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }

                /* Ensure text is readable */
                .text-white,
                .text-white\\/70,
                .text-white\\/60,
                .text-white\\/50 {
                    color: #1e293b !important;
                }

                /* Style gradient text for print */
                .bg-gradient-to-r,
                .bg-clip-text {
                    -webkit-background-clip: unset !important;
                    background-clip: unset !important;
                    -webkit-text-fill-color: #1e293b !important;
                    color: #1e293b !important;
                }

                /* Status pills */
                .bg-emerald-500\\/20 {
                    background: #d1fae5 !important;
                    border-color: #10b981 !important;
                }
                .text-emerald-400 {
                    color: #059669 !important;
                }
                .bg-red-500\\/20 {
                    background: #fee2e2 !important;
                    border-color: #ef4444 !important;
                }
                .text-red-400 {
                    color: #dc2626 !important;
                }
                .bg-yellow-500\\/20,
                .bg-amber-500\\/20 {
                    background: #fef3c7 !important;
                    border-color: #f59e0b !important;
                }
                .text-yellow-400,
                .text-amber-400 {
                    color: #d97706 !important;
                }
                .bg-blue-500\\/20 {
                    background: #dbeafe !important;
                    border-color: #3b82f6 !important;
                }
                .text-blue-400 {
                    color: #2563eb !important;
                }
                .text-purple-400 {
                    color: #7c3aed !important;
                }

                /* Winner card glow removal */
                .winner-card::before {
                    display: none !important;
                }

                /* Page break handling */
                section {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                /* Header styling */
                header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e2e8f0;
                }

                /* Grid layout for print */
                .grid {
                    display: grid !important;
                }

                /* Trophy icons */
                .trophy-icon {
                    animation: none !important;
                }

                /* Add page title */
                body::before {
                    content: "Resume Comparison Report";
                    display: block;
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #1e293b;
                }

                /* Add timestamp */
                body::after {
                    content: "Generated on: " attr(data-print-date);
                    display: block;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }
            }
        `;
        document.head.appendChild(printStyles);

        // Add print date attribute
        document.body.setAttribute("data-print-date", new Date().toLocaleString());

        // Trigger print
        window.print();

        // Clean up after print dialog closes
        const cleanup = () => {
            // Remove print styles
            const styles = document.getElementById("print-styles");
            if (styles) styles.remove();

            // Remove date attribute
            document.body.removeAttribute("data-print-date");

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
    document.addEventListener("DOMContentLoaded", initExportComparePDF);
} else {
    initExportComparePDF();
}

// Export as default
export default initExportComparePDF;
