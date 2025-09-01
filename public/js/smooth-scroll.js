// Simplified Professional Smooth Scrolling
class SimpleSmoothScroll {
    constructor() {
        this.isEnabled = true;
        this.init();
    }
    
    init() {
        // Enable CSS smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
        
        this.setupScrollIndicators();
        this.setupBackToTop();
    }
    
    // Scroll progress and back to top
    setupScrollIndicators() {
        let progressBar = null;
        
        const updateProgress = () => {
            const scrolled = window.pageYOffset;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = Math.min(100, (scrolled / maxScroll) * 100);
            
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.id = 'scrollProgress';
                progressBar.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 0%;
                    height: 3px;
                    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
                    z-index: 9999;
                    transition: width 0.2s ease;
                `;
                document.body.appendChild(progressBar);
            }
            
            progressBar.style.width = `${progress}%`;
            progressBar.style.opacity = progress > 1 ? 0.8 : 0;
        };
        
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }
    
    setupBackToTop() {
        let backToTopBtn = null;
        
        const updateBackToTop = () => {
            const scrolled = window.pageYOffset;
            
            if (!backToTopBtn) {
                backToTopBtn = document.createElement('button');
                backToTopBtn.id = 'backToTop';
                backToTopBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l-8 8h5v8h6v-8h5l-8-8z"/>
                    </svg>
                `;
                backToTopBtn.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 50px;
                    height: 50px;
                    background: var(--primary-color);
                    border: none;
                    border-radius: 50%;
                    color: var(--bg-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: var(--shadow-lg);
                    transition: all 0.3s ease;
                    z-index: 9998;
                    opacity: 0;
                    transform: translateY(20px);
                    pointer-events: none;
                `;
                
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                document.body.appendChild(backToTopBtn);
            }
            
            if (scrolled > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.transform = 'translateY(0)';
                backToTopBtn.style.pointerEvents = 'auto';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.transform = 'translateY(20px)';
                backToTopBtn.style.pointerEvents = 'none';
            }
        };
        
        window.addEventListener('scroll', updateBackToTop, { passive: true });
        updateBackToTop();
    }
    
    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            const elementTop = element.offsetTop + offset;
            window.scrollTo({ top: elementTop, behavior: 'smooth' });
        }
    }
    
    // Toggle smooth scrolling
    toggle(enabled = !this.isEnabled) {
        this.isEnabled = enabled;
        document.documentElement.style.scrollBehavior = enabled ? 'smooth' : 'auto';
    }
}

// Initialize smooth scrolling
let simpleSmoothScroll;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Simple Smooth Scrolling...');
    simpleSmoothScroll = new SimpleSmoothScroll();
    window.simpleSmoothScroll = simpleSmoothScroll;
    
    // Setup toggle button
    setupSmoothScrollToggle();
});

// Setup smooth scroll toggle functionality
function setupSmoothScrollToggle() {
    const toggleButton = document.getElementById('smoothScrollToggle');
    if (!toggleButton) return;
    
    // Set initial state
    const isEnabled = localStorage.getItem('smoothScrollEnabled') !== 'false';
    toggleButton.classList.toggle('active', isEnabled);
    
    if (!isEnabled) {
        window.simpleSmoothScroll.toggle(false);
    }
    
    // Handle toggle click
    toggleButton.addEventListener('click', () => {
        const newState = !window.simpleSmoothScroll.isEnabled;
        window.simpleSmoothScroll.toggle(newState);
        toggleButton.classList.toggle('active', newState);
        
        // Save preference
        localStorage.setItem('smoothScrollEnabled', newState.toString());
        
        // Show feedback
        showToggleFeedback(newState);
    });
}

// Show visual feedback for toggle
function showToggleFeedback(enabled) {
    const feedback = document.createElement('div');
    feedback.className = 'scroll-toggle-feedback';
    feedback.textContent = enabled ? 'Smooth Scrolling Enabled' : 'Smooth Scrolling Disabled';
    feedback.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${enabled ? 'var(--success-color)' : 'var(--text-muted)'};
        color: var(--bg-primary);
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 300);
    }, 2000);
}