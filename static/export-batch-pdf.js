// static/export-batch-pdf.js
// ============== EXPORT BATCH RESULTS AS PDF (ES MODULE) ==============

export function initBatchPDFExport() {
    const btn = document.getElementById("export-batch-pdf");
    if (!btn) return;

    btn.addEventListener("click", () => {
        // Server generates and returns the PDF
        window.location.href = "/export-batch-pdf";
    });
}
