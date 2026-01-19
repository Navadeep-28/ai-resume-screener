// ================= IMPORT THREE.JS (SINGLE INSTANCE) =================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js";


// ================= DYNAMIC RESUME SCREENER =================

document.addEventListener("DOMContentLoaded", () => {
    init3DCanvas();
    initForm();
    initSpinnerDots();
    initJobTemplates();
    initModeSwitching();
    initBatchCompare();
    initPDFExport();
    initFileInputs();
    initFormValidation();
    initKeyboardShortcuts();
    initLoadingStates();
});

/* ================= JOB DESCRIPTION TEMPLATES ================= */
const JOB_TEMPLATES = {
    python_dev: `
Looking for a Python Developer with experience in Flask, Django,
REST APIs, SQL databases, and basic machine learning concepts.
Strong problem-solving skills required.
`,
    data_scientist: `
Seeking a Data Scientist skilled in Python, Pandas, NumPy,
Machine Learning, Statistics, and Data Visualization.
NLP experience is a plus.
`,
    ml_engineer: `
Machine Learning Engineer with hands-on experience in
model training, deployment, scikit-learn, TensorFlow or PyTorch,
and NLP pipelines.
`,
    frontend_dev: `
Frontend Developer with strong knowledge of HTML, CSS, JavaScript,
React, responsive design, and UI/UX principles.
`,
    backend_dev: `
Backend Developer experienced in APIs, databases, authentication,
Python or Java, and system design concepts.
`
};

/* ================= TEMPLATE INIT ================= */
function initJobTemplates() {
    const roleSelect = document.getElementById("job-role");
    const jdTextarea = document.getElementById("job-desc");
    if (!roleSelect || !jdTextarea) return;

    roleSelect.addEventListener("change", () => {
        const role = roleSelect.value;
        if (JOB_TEMPLATES[role]) {
            jdTextarea.value = JOB_TEMPLATES[role].trim();
        }
    });

    // Batch Screening Form
    const batchJobRole = document.getElementById("batch-job-role");
    const batchJobDesc = document.getElementById("batch-job-desc");

    if (batchJobRole && batchJobDesc) {
        batchJobRole.addEventListener("change", () => {
            const role = batchJobRole.value;
            if (JOB_TEMPLATES[role]) {
                batchJobDesc.value = JOB_TEMPLATES[role].trim();
            }
        });
    }

    // Compare Resumes Form
    const compareJobRole = document.getElementById("compare-job-role");
    const compareJobDesc = document.getElementById("compare-job-desc");

    if (compareJobRole && compareJobDesc) {
        compareJobRole.addEventListener("change", () => {
            const role = compareJobRole.value;
            if (JOB_TEMPLATES[role]) {
                compareJobDesc.value = JOB_TEMPLATES[role].trim();
            }
        });
    }
}

/* ================= MODE SWITCHING ================= */
function initModeSwitching() {
    const modeButtons = document.querySelectorAll('.mode-btn, [data-mode]:not(.mode-section)');
    const modeSections = document.querySelectorAll('.mode-section');

    if (modeButtons.length === 0) return;

    modeButtons.forEach(btn => {
        if (btn.classList.contains('mode-section')) return;
        
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            if (!mode) return;

            // Update button styles - Tailwind classes
            modeButtons.forEach(b => {
                if (b.classList.contains('mode-section')) return;
                b.classList.remove('bg-blue-500/30', 'border-blue-400/40');
                b.classList.add('bg-white/10', 'border-white/10');
            });
            btn.classList.remove('bg-white/10', 'border-white/10');
            btn.classList.add('bg-blue-500/30', 'border-blue-400/40');

            // Show/hide sections with animation
            modeSections.forEach(section => {
                if (section.dataset.mode === mode) {
                    section.style.display = 'block';
                    section.style.opacity = '0';
                    section.style.transform = 'translateY(20px)';
                    requestAnimationFrame(() => {
                        section.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    });
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

/* ================= BATCH COMPARE CHECKBOX LOGIC ================= */
function initBatchCompare() {
    const checkboxes = document.querySelectorAll('.compare-checkbox');
    const compareBtn = document.getElementById('compare-btn');

    if (!compareBtn || checkboxes.length === 0) return;

    function updateCompareButton() {
        const checkedCount = document.querySelectorAll('.compare-checkbox:checked').length;
        compareBtn.disabled = checkedCount < 2;

        if (checkedCount >= 2) {
            compareBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            compareBtn.classList.add('hover:scale-[1.02]');
        } else {
            compareBtn.classList.add('opacity-50', 'cursor-not-allowed');
            compareBtn.classList.remove('hover:scale-[1.02]');
        }

        // Update button text
        if (checkedCount > 0) {
            compareBtn.innerHTML = `
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                Compare Selected (${checkedCount})
            `;
        } else {
            compareBtn.innerHTML = `
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                Compare Selected
            `;
        }
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCompareButton);
    });

    updateCompareButton();
}

/* ================= PDF EXPORT ================= */
function initPDFExport() {
    const exportBatchBtn = document.getElementById('export-batch-pdf');
    if (exportBatchBtn) {
        exportBatchBtn.addEventListener('click', () => {
            exportToPDF('batch-screening-results');
        });
    }

    const exportCompareBtn = document.getElementById('export-compare-pdf');
    if (exportCompareBtn) {
        exportCompareBtn.addEventListener('click', () => {
            exportToPDF('resume-comparison');
        });
    }
}

async function exportToPDF(filename) {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        Generating PDF...
    `;

    try {
        const response = await fetch('/export-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: filename,
                content: document.body.innerHTML
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            showNotification('PDF exported successfully!', 'success');
        } else {
            window.print();
        }
    } catch (error) {
        console.error('PDF export failed:', error);
        window.print();
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/* ================= FILE INPUT ENHANCEMENT ================= */
function initFileInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"]');

    fileInputs.forEach(input => {
        const wrapper = input.closest('.mb-6') || input.closest('.form-group') || input.parentElement;

        input.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                let fileNames = Array.from(files).map(f => f.name).join(', ');
                if (fileNames.length > 50) {
                    fileNames = fileNames.substring(0, 47) + '...';
                }

                let fileInfo = wrapper.querySelector('.file-info');
                if (!fileInfo) {
                    fileInfo = document.createElement('div');
                    fileInfo.className = 'file-info mt-2 text-sm text-emerald-400 flex items-center gap-2';
                    wrapper.appendChild(fileInfo);
                }

                fileInfo.innerHTML = `
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    ${files.length} file${files.length > 1 ? 's' : ''} selected: ${fileNames}
                `;
            }
        });

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            wrapper.addEventListener(eventName, () => {
                wrapper.classList.add('border-blue-500', 'bg-blue-500/10');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, () => {
                wrapper.classList.remove('border-blue-500', 'bg-blue-500/10');
            });
        });

        wrapper.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            input.files = files;
            input.dispatchEvent(new Event('change'));
        });
    });
}

/* ================= FORM VALIDATION ================= */
function initFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-red-500', 'bg-red-500/10');

                    field.addEventListener('input', () => {
                        field.classList.remove('border-red-500', 'bg-red-500/10');
                    }, { once: true });
                }
            });

            if (!isValid) {
                e.preventDefault();
                showNotification('Please fill in all required fields', 'error');
            }
        });
    });
}

/* ================= KEYBOARD SHORTCUTS ================= */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeForm = document.querySelector('form:not([style*="display: none"])');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }

        if (e.key === 'Escape') {
            document.activeElement.blur();
        }
    });
}

/* ================= LOADING STATES ================= */
function initLoadingStates() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', () => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalContent = submitBtn.innerHTML;
                submitBtn.dataset.originalContent = originalContent;

                submitBtn.innerHTML = `
                    <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                    </svg>
                    Processing...
                `;
            }
        });
    });
}

/* ================= NOTIFICATIONS ================= */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') ||
        createNotificationContainer();

    const notification = document.createElement('div');
    
    let bgClass = 'bg-blue-500/20 border-blue-400/40 text-blue-300';
    if (type === 'error') bgClass = 'bg-red-500/20 border-red-400/40 text-red-300';
    if (type === 'success') bgClass = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';

    notification.className = `
        px-6 py-4 rounded-2xl backdrop-blur-xl border shadow-lg
        flex items-center gap-3 transform translate-x-full
        transition-transform duration-300 ${bgClass}
    `;

    const icons = {
        error: `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        success: `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,
        info: `<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
        </svg>`
    };

    notification.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
        <button class="ml-2 hover:opacity-70 transition" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    container.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.remove('translate-x-full');
    });

    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-24 right-6 z-[100] flex flex-col gap-3';
    document.body.appendChild(container);
    return container;
}

/* ================= 3D BACKGROUND ================= */
function init3DCanvas() {
    const canvas = document.getElementById("three-canvas");
    if (!canvas || !window.WebGLRenderingContext) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // ===== PARTICLES =====
    const particles = new THREE.BufferGeometry();
    const count = window.innerWidth < 768 ? 600 : 1500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < positions.length; i += 3) {
        // Spread particles in a sphere
        const radius = Math.random() * 15 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);

        // Color gradient: blue -> purple -> pink
        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
            colors[i] = 0.4;     // R
            colors[i + 1] = 0.6; // G
            colors[i + 2] = 1.0; // B
        } else if (colorChoice < 0.66) {
            colors[i] = 0.6;
            colors[i + 1] = 0.4;
            colors[i + 2] = 1.0;
        } else {
            colors[i] = 1.0;
            colors[i + 1] = 0.4;
            colors[i + 2] = 0.8;
        }
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particles, material);
    scene.add(particleSystem);

    // ===== FLOATING SHAPES =====
    const shapes = [];
    const shapeTypes = [
        new THREE.IcosahedronGeometry(0.8, 0),
        new THREE.OctahedronGeometry(0.8, 0),
        new THREE.TetrahedronGeometry(0.8, 0),
        new THREE.TorusGeometry(0.5, 0.2, 8, 16)
    ];

    const shapeColors = [0x6366f1, 0x8b5cf6, 0xec4899, 0x06b6d4, 0x10b981];

    for (let i = 0; i < 12; i++) {
        const geometry = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        const shapeMaterial = new THREE.MeshBasicMaterial({
            color: shapeColors[Math.floor(Math.random() * shapeColors.length)],
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });

        const mesh = new THREE.Mesh(geometry, shapeMaterial);

        mesh.position.x = (Math.random() - 0.5) * 25;
        mesh.position.y = (Math.random() - 0.5) * 25;
        mesh.position.z = (Math.random() - 0.5) * 15;

        const scale = Math.random() * 1.5 + 0.5;
        mesh.scale.set(scale, scale, scale);

        mesh.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.015,
                y: (Math.random() - 0.5) * 0.015,
                z: (Math.random() - 0.5) * 0.015
            },
            floatSpeed: Math.random() * 0.4 + 0.3,
            floatOffset: Math.random() * Math.PI * 2,
            originalY: mesh.position.y
        };

        shapes.push(mesh);
        scene.add(mesh);
    }

    // ===== CONNECTION LINES =====
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.08
    });

    for (let i = 0; i < 15; i++) {
        const points = [];
        const startPoint = new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 15
        );
        points.push(startPoint);

        for (let j = 0; j < 2; j++) {
            points.push(new THREE.Vector3(
                startPoint.x + (Math.random() - 0.5) * 15,
                startPoint.y + (Math.random() - 0.5) * 15,
                startPoint.z + (Math.random() - 0.5) * 10
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, linesMaterial);
        scene.add(line);
    }

    camera.position.z = 8;

    // ===== MOUSE TRACKING =====
    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    document.addEventListener('mousemove', (e) => {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ===== ANIMATION LOOP =====
    const clock = new THREE.Clock();

    function animate() {
        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse following
        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        // Rotate particles
        particleSystem.rotation.x = elapsedTime * 0.03 + mouse.y * 0.2;
        particleSystem.rotation.y = elapsedTime * 0.05 + mouse.x * 0.2;

        // Animate shapes
        shapes.forEach((shape) => {
            shape.rotation.x += shape.userData.rotationSpeed.x;
            shape.rotation.y += shape.userData.rotationSpeed.y;
            shape.rotation.z += shape.userData.rotationSpeed.z;
            shape.position.y = shape.userData.originalY +
                Math.sin(elapsedTime * shape.userData.floatSpeed + shape.userData.floatOffset) * 1.5;
        });

        // Subtle camera movement
        camera.position.x = Math.sin(elapsedTime * 0.1) * 1.5 + mouse.x * 2;
        camera.position.y = Math.cos(elapsedTime * 0.1) * 1.5 + mouse.y * 2;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/* ================= FORM SUBMISSION ================= */
function initForm() {
    const form = document.getElementById("upload-form");
    const spinner = document.getElementById("spinner");
    const container = document.querySelector(".container") || document.querySelector(".max-w-4xl");

    if (!form || !container) return;

    const mode = form.getAttribute("data-mode") || "single";

    // 🔒 Batch & Compare handled elsewhere
    if (mode !== "single") return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (spinner) spinner.style.display = "block";
        form.style.opacity = "0.6";

        try {
            const response = await fetch("/", {
                method: "POST",
                body: new FormData(form)
            });

            if (!response.ok) throw new Error("Server error");

            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");

            const newResults = doc.querySelector(".results") || doc.querySelector("section.bg-white\\/10");
            const newError = doc.querySelector(".error") || doc.querySelector(".bg-red-500\\/20");

            container.querySelectorAll(".results, .error, section.bg-white\\/10").forEach(el => el.remove());

            if (newError) container.appendChild(newError);
            if (newResults) {
                container.appendChild(newResults);
                setTimeout(() => {
                    renderSkillsChart();
                    applyHeatmap();
                }, 100);
            }

        } catch (err) {
            console.error(err);
            showNotification('Network or server error. Please try again.', 'error');
        } finally {
            if (spinner) spinner.style.display = "none";
            form.style.opacity = "1";
        }
    });
}

/* ================= SKILLS CHART ================= */
function renderSkillsChart() {
    if (!window.Plotly) return;

    const chartContainer = document.getElementById("skills-chart");
    if (!chartContainer) return;

    const skills = [];
    document.querySelectorAll(".skills-list li, .bg-white\\/5 li").forEach(li => {
        const match = li.textContent.match(/(.+?) \((\d+)%\)/);
        if (match) skills.push({ name: match[1].trim(), score: Number(match[2]) / 100 });
    });

    if (!skills.length) return;

    Plotly.newPlot("skills-chart", [{
        values: skills.slice(0, 6).map(s => s.score),
        labels: skills.slice(0, 6).map(s => s.name),
        type: "pie",
        hole: 0.4,
        marker: {
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b']
        },
        textfont: {
            color: '#ffffff'
        }
    }], {
        title: {
            text: "💎 Top Skills Match",
            font: { color: '#ffffff', size: 16 }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: '#ffffff' },
        showlegend: true,
        legend: {
            font: { color: '#ffffff' }
        }
    }, { responsive: true });
}

/* ================= WORD HEATMAP ================= */
function applyHeatmap() {
    const preview = document.getElementById("resume-preview");
    if (!preview || !preview.dataset.heatmap) return;

    const heatWords = JSON.parse(preview.dataset.heatmap);
    let html = preview.innerText;

    heatWords.forEach(word => {
        html = html.replace(
            new RegExp(`\\b(${word})\\b`, "gi"),
            `<span class="px-1 py-0.5 rounded bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300">$1</span>`
        );
    });

    preview.innerHTML = html;
}

/* ================= SPINNER DOTS ================= */
function initSpinnerDots() {
    const dots = document.querySelector(".dots");
    if (!dots) return;

    let step = 0;
    setInterval(() => {
        step = (step + 1) % 4;
        dots.textContent = ".".repeat(step);
    }, 300);
}

// ================= EXPORT FOR MODULE USAGE =================
export {
    showNotification,
    initModeSwitching,
    init3DCanvas
};
