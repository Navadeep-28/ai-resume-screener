// static/batch.js
// ================= BATCH RESUME SCREENING (ES MODULE) =================

export function initBatchScreening() {
    const batchForm = document.querySelector('form[action="/batch_screen"]');
    if (!batchForm) return;

    batchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(batchForm);

        try {
            const res = await fetch("/batch_screen", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            let output = `<h3>📊 Ranked Resumes</h3><ol>`;
            data.ranked_results.forEach(r => {
                output += `
                    <li>
                        <strong>${r.filename}</strong><br>
                        Final Score: ${(r.final * 100).toFixed(1)}%<br>
                        JD Coverage: ${r.coverage}%
                    </li>
                `;
            });
            output += `</ol>`;

            let resultBox = document.getElementById("batch_results");
            if (!resultBox) {
                resultBox = document.createElement("div");
                resultBox.id = "batch_results";
                resultBox.className = "glass-card";
                batchForm.parentElement.appendChild(resultBox);
            }

            resultBox.innerHTML = output;

        } catch (err) {
            console.error("Batch screening failed:", err);
        }
    });
}
