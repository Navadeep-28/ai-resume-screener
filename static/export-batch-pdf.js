// static/export-batch-pdf.js
// ================= EXPORT BATCH RESULTS PDF (ES MODULE) =================

export function initExportBatchPDF() {
    const btn = document.getElementById("export-batch-pdf");
    if (!btn) return;

    btn.addEventListener("click", () => {
        window.print();
    });
}
