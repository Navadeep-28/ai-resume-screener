// static/export-compare-pdf.js
// ============== EXPORT COMPARE RESULTS AS PDF (ES MODULE) ==============

export function initComparePDFExport() {
    const btn = document.getElementById("export-compare-pdf");
    if (!btn) return;

    btn.addEventListener("click", () => {
        // Server generates and returns the PDF
        window.location.href = "/export-compare-pdf";
    });
}
