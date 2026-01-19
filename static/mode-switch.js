// static/mode-switch.js
// ================= MODE SWITCH (FIXED ES MODULE - TAILWIND VERSION) =================

export function initModeSwitch() {
    const buttons = document.querySelectorAll(".mode-btn");
    const sections = document.querySelectorAll(".mode-section");

    if (buttons.length === 0 || sections.length === 0) return;

    function switchMode(mode) {
        // Toggle sections with animation
        sections.forEach(section => {
            if (section.dataset.mode === mode) {
                // Show section with fade-in animation
                section.style.display = "block";
                section.style.opacity = "0";
                section.style.transform = "translateY(20px)";
                
                // Trigger reflow for animation
                requestAnimationFrame(() => {
                    section.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                    section.style.opacity = "1";
                    section.style.transform = "translateY(0)";
                });
            } else {
                // Hide section
                section.style.display = "none";
                section.style.opacity = "0";
                section.style.transform = "translateY(20px)";
            }
        });

        // Toggle active button with Tailwind classes
        buttons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                // Active state - blue/purple gradient style
                btn.classList.remove(
                    "bg-white/10",
                    "border-white/10",
                    "hover:bg-white/20"
                );
                btn.classList.add(
                    "bg-blue-500/30",
                    "border-blue-400/40",
                    "shadow-lg",
                    "shadow-blue-500/20"
                );
            } else {
                // Inactive state - glass style
                btn.classList.remove(
                    "bg-blue-500/30",
                    "border-blue-400/40",
                    "shadow-lg",
                    "shadow-blue-500/20"
                );
                btn.classList.add(
                    "bg-white/10",
                    "border-white/10",
                    "hover:bg-white/20"
                );
            }
        });

        // Store active mode in sessionStorage for persistence
        try {
            sessionStorage.setItem("activeMode", mode);
        } catch (e) {
            // Ignore if sessionStorage is not available
        }
    }

    // Get saved mode or default to "single"
    let defaultMode = "single";
    try {
        const savedMode = sessionStorage.getItem("activeMode");
        if (savedMode && [...sections].some(s => s.dataset.mode === savedMode)) {
            defaultMode = savedMode;
        }
    } catch (e) {
        // Ignore if sessionStorage is not available
    }

    // Initialize with default mode
    switchMode(defaultMode);

    // Button click handlers
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const mode = btn.dataset.mode;
            if (mode) {
                switchMode(mode);
                
                // Add ripple effect on click
                createRipple(btn);
            }
        });

        // Add keyboard accessibility
        btn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                btn.click();
            }
        });

        // Ensure buttons are focusable
        if (!btn.hasAttribute("tabindex")) {
            btn.setAttribute("tabindex", "0");
        }
    });

    // Keyboard navigation between buttons
    document.addEventListener("keydown", (e) => {
        const focusedBtn = document.activeElement;
        if (!focusedBtn?.classList.contains("mode-btn")) return;

        const btnArray = [...buttons];
        const currentIndex = btnArray.indexOf(focusedBtn);

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % btnArray.length;
            btnArray[nextIndex].focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + btnArray.length) % btnArray.length;
            btnArray[prevIndex].focus();
        }
    });
}

/**
 * Create ripple effect on button click
 */
function createRipple(button) {
    // Remove existing ripple
    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) {
        existingRipple.remove();
    }

    // Create ripple element
    const ripple = document.createElement("span");
    ripple.className = "ripple absolute inset-0 rounded-full bg-white/30 scale-0 opacity-100";
    ripple.style.animation = "ripple 0.6s ease-out forwards";
    
    // Ensure button has relative positioning
    if (!button.style.position || button.style.position === "static") {
        button.style.position = "relative";
    }
    button.style.overflow = "hidden";
    
    button.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Initialize mode indicators (optional visual feedback)
 */
export function initModeIndicators() {
    const sections = document.querySelectorAll(".mode-section");
    
    sections.forEach(section => {
        const mode = section.dataset.mode;
        if (!mode) return;

        // Add mode indicator badge (optional)
        const indicator = document.createElement("div");
        indicator.className = `
            absolute -top-3 -right-3 
            px-3 py-1 
            text-xs font-medium 
            rounded-full 
            bg-gradient-to-r 
            ${mode === 'single' ? 'from-blue-500 to-purple-500' : ''}
            ${mode === 'batch' ? 'from-purple-500 to-pink-500' : ''}
            ${mode === 'compare' ? 'from-emerald-500 to-teal-500' : ''}
            text-white 
            shadow-lg
            opacity-0
            transition-opacity duration-300
        `;
        indicator.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        
        // Only add if section is relatively positioned
        const sectionStyle = window.getComputedStyle(section);
        if (sectionStyle.position === "static") {
            section.style.position = "relative";
        }
        
        // Show indicator briefly when section becomes active
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "style") {
                    const isVisible = section.style.display !== "none";
                    if (isVisible) {
                        indicator.style.opacity = "1";
                        setTimeout(() => {
                            indicator.style.opacity = "0";
                        }, 2000);
                    }
                }
            });
        });

        observer.observe(section, { attributes: true });
    });
}

/**
 * Get current active mode
 */
export function getActiveMode() {
    const activeSection = document.querySelector('.mode-section[style*="display: block"]');
    return activeSection?.dataset.mode || "single";
}

/**
 * Programmatically switch to a specific mode
 */
export function setActiveMode(mode) {
    const button = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
    if (button) {
        button.click();
        return true;
    }
    return false;
}

// Add ripple animation to document styles
const style = document.createElement("style");
style.textContent = `
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .mode-btn {
        position: relative;
        overflow: hidden;
    }
    
    .mode-section {
        will-change: opacity, transform;
    }
`;
document.head.appendChild(style);

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModeSwitch);
} else {
    initModeSwitch();
}

// Export for module usage
export default initModeSwitch;
