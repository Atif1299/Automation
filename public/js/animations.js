class App {
    constructor() {
        this.cardData = [
            {
                title: "Premium Quality Lists",
                details: "Access our meticulously curated LinkedIn prospect lists with 95%+ accuracy. Each profile is verified and enriched with comprehensive data including job titles, company information, and contact preferences. Our advanced filtering ensures you connect with decision-makers who are genuinely interested in your solutions, dramatically improving your conversion rates and ROI."
            },
            {
                title: "AI-Powered Automation",
                details: "Leverage cutting-edge artificial intelligence to automate your LinkedIn outreach while maintaining authentic, personalized communication. Our smart algorithms analyze prospect behavior, optimize message timing, and adapt conversation flows for maximum engagement. Experience the perfect balance of efficiency and personalization that converts 3x better than traditional approaches."
            },
            {
                title: "Rich Data Insights",
                details: "Unlock comprehensive contact profiles with verified emails, direct phone numbers, social media handles, and detailed company insights. Our proprietary data enrichment technology aggregates information from 200+ sources, ensuring 90%+ accuracy. Get real-time updates on job changes, company news, and engagement signals to time your outreach perfectly."
            },
            {
                title: "Transparent Pricing",
                details: "Enjoy crystal-clear pricing with no hidden fees, setup costs, or long-term contracts. Our flexible plans scale with your business needs, from startups to enterprises. Every package includes dedicated support, detailed analytics, and performance guarantees. Experience maximum ROI with pricing that grows with your success, not against it."
            }
        ];
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupSmoothScrolling();
        this.setupCardClickHandlers();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature, .quote').forEach(el => {
            observer.observe(el);
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupCardClickHandlers() {
        const cardButtons = document.querySelectorAll('.card-btn');
        cardButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(index);
            });
        });
    }

    openModal(cardIndex) {
        const cardData = this.cardData[cardIndex];
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${cardData.title}</h3>
                <p>${cardData.details}</p>
                <button class="close-btn">Close</button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.closeModal(modal);
        });

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
