// static/compare.js
// ================= RESUME COMPARISON (ES MODULE) =================

export function initResumeComparison() {
    const compareForm = document.querySelector('form[action="/compare-resumes"]');
    if (!compareForm) return;

    compareForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(compareForm);

        try {
            const res = await fetch("/compare-resumes", {
                method: "POST",
                body: formData
            });

            // ---- SAFETY CHECK: JSON vs HTML ----
            const contentType = res.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Expected JSON but received:", text);
                throw new Error("Server returned HTML instead of JSON");
            }

            const data = await res.json();

            if (!data.resume_1 || !data.resume_2 || !data.winner) {
                throw new Error("Invalid comparison response format");
            }

            const container = document.getElementById("dynamic-results");
            if (!container) return;

            container.innerHTML = ""; // clear old results

            const resumes = [
                { label: "Resume 1", data: data.resume_1, key: "resume_1" },
                { label: "Resume 2", data: data.resume_2, key: "resume_2" }
            ];

            resumes.forEach((r) => {
                const finalPct = (r.data.final * 100);
                const matchPct = (r.data.match * 100);

                const status = finalPct >= 65 ? "PASS" : "FAIL";
                const risk = finalPct < 60 ? "HIGH" : "LOW";
                const isWinner = data.winner === r.key;

                container.innerHTML += `
                <section class="results glass-card result-landscape ${isWinner ? "winner" : ""}">
                    <div class="result-col status-col">
                        <div class="status-pill ${status === "PASS" ? "pass" : "fail"}">
                            ${status}
                        </div>
                        <div class="status-card">
                            <h3>${r.label} ${isWinner ? "🏆" : ""}</h3>
                            <p>ATS Confidence: 70%</p>
                        </div>
                    </div>

                    <div class="result-col metrics-col">
                        <div class="metric-card">
                            <span class="metric-label">JD Coverage</span>
                            <span class="metric-value blue">${r.data.coverage}%</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Hiring Risk</span>
                            <span class="metric-value ${risk === "HIGH" ? "danger" : "success"}">
                                ${risk}
                            </span>
                        </div>
                    </div>

                    <div class="result-col score-col">
                        <div class="final-score">
                            <span>Final Score</span>
                            <h2>${finalPct.toFixed(1)}%</h2>
                        </div>
                        <div class="mini-scores">
                            <div class="mini-card">
                                Job Match<br><strong>${matchPct.toFixed(1)}%</strong>
                            </div>
                        </div>
                    </div>
                </section>
                `;
            });

        } catch (err) {
            console.error("Resume comparison failed:", err);
        }
    });
}
