// ================= BATCH RESUME SCREENING =================
document.addEventListener("DOMContentLoaded", () => {
    const batchForm = document.querySelector('form[action="/batch-screen"]');
    if (!batchForm) return;

    batchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(batchForm);

        const res = await fetch("/batch-screen", {
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

        const resultBox = document.createElement("div");
        resultBox.className = "glass-card";
        resultBox.innerHTML = output;

        batchForm.parentElement.appendChild(resultBox);
    });
});
