// Landing Page Interactive Features - Particles & Terminal Animation

// ===== LANDING PAGE PARTICLE ANIMATION BACKGROUND =====
class LandingParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particlesCanvas');
        if (!this.canvas) {
            console.log('Particles canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 212, 255, ${particle.opacity})`;
            this.ctx.fill();
        });
        
        // Draw connections
        this.drawConnections();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const opacity = (100 - distance) / 100 * 0.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                    this.ctx.stroke();
                }
            }
        }
    }
}

// ===== TERMINAL ANIMATION =====
class TerminalAnimation {
    constructor() {
        this.terminalOutput = document.getElementById('terminalOutput');
        if (!this.terminalOutput) {
            console.log('Terminal output not found');
            return;
        }
        
        this.messages = [
            { type: 'system', text: 'AI Agent System Initialized...' },
            { type: 'success', text: 'Connected to LinkedIn automation service' },
            { type: 'process', text: 'Scanning prospect database...' },
            { type: 'success', text: 'Found 1,247 potential prospects' },
            { type: 'process', text: 'Generating personalized messages...' },
            { type: 'success', text: 'AI generated 1,247 unique outreach messages' },
            { type: 'process', text: 'Scheduling automated campaigns...' },
            { type: 'success', text: 'Campaign scheduled: 50 messages/day' },
            { type: 'info', text: 'Estimated completion: 25 days' },
            { type: 'success', text: 'Automation pipeline active ✓' }
        ];
        
        this.currentMessageIndex = 0;
        this.init();
    }
    
    init() {
        setTimeout(() => this.typeNextMessage(), 1000);
    }
    
    typeMessage(message, callback) {
        const line = document.createElement('div');
        line.className = `terminal-line ${message.type}`;
        
        const prompt = document.createElement('span');
        prompt.className = 'terminal-prompt';
        prompt.textContent = this.getPromptByType(message.type);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'terminal-text';
        
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        cursor.textContent = '█';
        
        line.appendChild(prompt);
        line.appendChild(textSpan);
        line.appendChild(cursor);
        this.terminalOutput.appendChild(line);
        
        let charIndex = 0;
        const text = message.text;
        
        const typeChar = () => {
            if (charIndex < text.length) {
                textSpan.textContent += text.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, 50 + Math.random() * 50);
            } else {
                cursor.remove();
                setTimeout(callback, 1500);
            }
        };
        
        typeChar();
    }
    
    getPromptByType(type) {
        const prompts = {
            system: '[SYSTEM] ',
            success: '[SUCCESS] ',
            process: '[PROCESS] ',
            info: '[INFO] ',
            error: '[ERROR] '
        };
        return prompts[type] || '[SYSTEM] ';
    }
    
    typeNextMessage() {
        if (this.currentMessageIndex >= this.messages.length) {
            setTimeout(() => {
                this.terminalOutput.innerHTML = '';
                this.currentMessageIndex = 0;
                this.typeNextMessage();
            }, 3000);
            return;
        }
        
        this.typeMessage(this.messages[this.currentMessageIndex], () => {
            this.currentMessageIndex++;
            this.typeNextMessage();
        });
    }
}

// ===== INITIALIZE ALL LANDING PAGE FEATURES =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Landing page script loaded');
    
    // Initialize particle system if canvas exists
    const particlesCanvas = document.getElementById('particlesCanvas');
    if (particlesCanvas) {
        console.log('Initializing LandingParticleSystem');
        new LandingParticleSystem();
    } else {
        console.log('Particles canvas NOT found');
    }
    
    // Initialize terminal animation if terminal exists
    const terminalOutput = document.getElementById('terminalOutput');
    if (terminalOutput) {
        console.log('Initializing TerminalAnimation');
        new TerminalAnimation();
    } else {
        console.log('Terminal output NOT found');
    }
});
