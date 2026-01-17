// static/export-compare-pdf.js
// ================= EXPORT COMPARE RESULTS PDF (ES MODULE) =================

export function initExportComparePDF() {
    const btn = document.getElementById("export-compare-pdf");
    if (!btn) return;

    btn.addEventListener("click", () => {
        window.print();
    });
}
