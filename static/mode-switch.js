// static/mode-switch.js
// ================= MODE SWITCH (SAFE ES MODULE) =================

export function initModeSwitch() {
    const buttons = document.querySelectorAll(".mode-btn");
    const form = document.querySelector("form");
    if (!form || buttons.length === 0) return;

    const singleInput = form.querySelector('input[name="resume"]');
    const batchBlock = form.querySelector(".mode-batch");
    const compareBlock = form.querySelector(".mode-compare");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const mode = btn.dataset.mode;

            // ---- SAFE RESET ----
            if (batchBlock) batchBlock.style.display = "none";
            if (compareBlock) compareBlock.style.display = "none";
            if (singleInput) singleInput.style.display = "block";

            // Default action (single screening)
            form.action = "/";

            // ---- MODE SWITCH ----
            if (mode === "batch") {
                if (singleInput) singleInput.style.display = "none";
                if (batchBlock) batchBlock.style.display = "block";
                form.action = "/batch-screen";
            }

            if (mode === "compare") {
                if (singleInput) singleInput.style.display = "none";
                if (compareBlock) compareBlock.style.display = "block";
                form.action = "/compare-resumes";
            }
        });
    });
}
