import { initBatchScreening } from "./batch.js";
import { initResumeComparison } from "./compare.js";
import { initModeSwitch } from "./mode-switch.js";

document.addEventListener("DOMContentLoaded", () => {
    initBatchScreening();
    initResumeComparison();
    initModeSwitch();
});
