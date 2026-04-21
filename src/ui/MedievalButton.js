import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Magitech Seal Button v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Magitech Fusion: Retains the tactile wax seal but surrounds it with a cyberpunk data-ring.
 * - Holographic Scanline: GSAP sweep animation maps a laser scan across the wax on hover.
 * - RGB Glitch Click: Severe color-channel splitting on interaction impact.
 * - High-Performance Physics: QuickTo magnetic tracking mapped to 3D CSS transforms.
 */
export class MedievalButton {
  constructor(element, options = {}) {
    this.el = element; // Expects an existing <a> or <button> element
    this.config = {
      magneticStrength: options.magneticStrength ?? 0.4,
      iconPath: options.iconPath || 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z', // Default Phone/Contact icon
      ...options
    };
    
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };
    this.timelines = [];
    
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this.init();
  }

  init() {
    this._buildDOM();
    this._calculateBounds();
    this._bindEvents();
    
    window.addEventListener('resize', () => this._calculateBounds(), { passive: true });
  }

  _buildDOM() {
    const text = this.el.textContent.trim() || 'Initialize Protocol';
    this.el.textContent = ''; 
    this.el.classList.add('magitech-seal-btn');
    
    // Inject the Cyber-Wax Seal DOM structure
    this.el.innerHTML = `
      <div class="seal-wax-container">
        
        <svg class="tech-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-cyan, #00ffff)" stroke-width="1.5" stroke-dasharray="4 12 16 8" stroke-linecap="round" opacity="0.4"></circle>
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-gold, #ffaa00)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.2"></circle>
        </svg>

        <div class="seal-wax-outer"></div>
        <div class="seal-wax-inner">
          
          <div class="icon-glitch-stack">
            <svg class="seal-icon glitch-cyan" viewBox="0 0 24 24" fill="none" stroke="#00ffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${this.config.iconPath}"></path></svg>
            <svg class="seal-icon glitch-red" viewBox="0 0 24 24" fill="none" stroke="#ff0033" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${this.config.iconPath}"></path></svg>
            <svg class="seal-icon icon-main" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${this.config.iconPath}"></path></svg>
          </div>

          <div class="holo-scanline"></div>
        </div>
        
        <div class="seal-ripple"></div>
      </div>
      <span class="seal-text">${text}</span>
    `;

    this.waxContainer = this.el.querySelector('.seal-wax-container');
    this.techRing = this.el.querySelector('.tech-ring');
    this.scanline = this.el.querySelector('.holo-scanline');
    this.ripple = this.el.querySelector('.seal-ripple');
    
    this.iconMain = this.el.querySelector('.icon-main');
    this.glitchCyan = this.el.querySelector('.glitch-cyan');
    this.glitchRed = this.el.querySelector('.glitch-red');

    // Setup GSAP QuickSetters for high-performance magnetic hover
    this.xSet = gsap.quickTo(this.waxContainer, "x", { duration: 0.4, ease: "power3.out" });
    this.ySet = gsap.quickTo(this.waxContainer, "y", { duration: 0.4, ease: "power3.out" });

    // Idle rotation for the data ring
    if (!this.isReducedMotion) {
      const idleRot = gsap.to(this.techRing, {
        rotation: 360,
        duration: 25,
        repeat: -1,
        ease: "none"
      });
      this.timelines.push(idleRot);
    }
  }

  _calculateBounds() {
    this.bounds = this.el.getBoundingClientRect();
  }

  _bindEvents() {
    if (!this.isReducedMotion) {
      this.el.addEventListener('mousemove', this._onMouseMove, { passive: true });
      this.el.addEventListener('mouseenter', this._onMouseEnter, { passive: true });
      this.el.addEventListener('mouseleave', this._onMouseLeave, { passive: true });
    }
    
    this.el.addEventListener('click', this._onClick);
    this.el.addEventListener('keydown', this._onKeyDown);
  }

  _onMouseEnter() {
    this._calculateBounds();
    
    // Spin up the tech ring
    gsap.to(this.techRing, { opacity: 1, scale: 1.1, duration: 0.5, ease: "back.out(1.5)" });
    
    // Trigger Holographic Scan
    gsap.fromTo(this.scanline, 
      { y: '-100%', opacity: 0 },
      { y: '200%', opacity: 0.6, duration: 0.8, ease: "power1.inOut" }
    );
  }

  _onMouseMove(e) {
    const x = e.clientX - this.bounds.left - this.bounds.width / 2;
    const y = e.clientY - this.bounds.top - this.bounds.height / 2;
    
    this.xSet(x * this.config.magneticStrength);
    this.ySet(y * this.config.magneticStrength);
    
    // 3D Tilt on the wax seal
    gsap.to(this.waxContainer, {
      rotationX: -y * 0.8,
      rotationY: x * 0.8,
      boxShadow: `${-x * 0.5}px ${-y * 0.5}px 15px rgba(0, 255, 255, 0.3)`,
      duration: 0.4,
      ease: "power2.out"
    });
  }

  _onMouseLeave() {
    this.xSet(0);
    this.ySet(0);
    
    gsap.to(this.waxContainer, {
      rotationX: 0,
      rotationY: 0,
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
      duration: 0.7,
      ease: "elastic.out(1, 0.4)"
    });

    gsap.to(this.techRing, { opacity: 0.4, scale: 1.0, duration: 0.5 });
  }

  _onClick(e) {
    if (this.isReducedMotion) return;

    // 1. Cyber-Glitch the Icon
    const glitchTl = gsap.timeline();
    glitchTl.to(this.glitchCyan, { opacity: 0.8, x: -4, y: 3, duration: 0.05, ease: "none" })
            .to(this.glitchRed, { opacity: 0.8, x: 4, y: -3, duration: 0.05, ease: "none" }, "<")
            .to([this.glitchCyan, this.glitchRed], { x: 0, y: 0, opacity: 0, duration: 0.15, ease: "power2.out" }, "+=0.05");

    // 2. Tactile click depression
    gsap.timeline()
      .to(this.waxContainer, { scale: 0.85, duration: 0.05, ease: "power2.in" })
      .to(this.waxContainer, { scale: 1, duration: 0.5, ease: "back.out(2.0)" });

    // 3. GSAP Ripple Data-Burst
    const rect = this.waxContainer.getBoundingClientRect();
    const clickX = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const clickY = e.clientY ? e.clientY - rect.top : rect.height / 2;

    gsap.fromTo(this.ripple, 
      { x: clickX, y: clickY, scale: 0, opacity: 1, border: '2px solid #00ffff' },
      { scale: 3.0, opacity: 0, duration: 0.6, ease: "power2.out", clearProps: "all" }
    );
  }

  _onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.el.click(); 
    }
  }

  dispose() {
    this.el.removeEventListener('mousemove', this._onMouseMove);
    this.el.removeEventListener('mouseenter', this._onMouseEnter);
    this.el.removeEventListener('mouseleave', this._onMouseLeave);
    this.el.removeEventListener('click', this._onClick);
    this.el.removeEventListener('keydown', this._onKeyDown);
    
    gsap.killTweensOf([this.waxContainer, this.ripple, this.scanline, this.techRing, this.glitchCyan, this.glitchRed]);
    this.timelines.forEach(tl => tl.kill());
  }
}