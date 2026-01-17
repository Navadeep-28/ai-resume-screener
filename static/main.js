import { initModeSwitch } from "./mode-switch.js";
import { initExportBatchPDF } from "./export-batch-pdf.js";
import { initExportComparePDF } from "./export-compare-pdf.js";
import { initBatchScreening, initBatchCompare } from "./batch.js";

document.addEventListener("DOMContentLoaded", () => {
    initModeSwitch();
    initExportBatchPDF();
    initExportComparePDF();
    initBatchScreening();
    initBatchCompare();
});
