import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Magitech Glass Card v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - GSAP ScrollTrigger Integration: Unifies the materialization reveal with the rest of the site.
 * - Zero-DOM Glare: Lighting is now handled purely by GPU-accelerated CSS pseudo-elements via CSS variables.
 * - Magitech Depth: Dark obsidian tinting that violently refracts background HDR elements (Fire/Lightning).
 * - Extreme Performance: GSAP quickTo mapped to 3D CSS transforms with zero layout thrashing.
 */
export class GlassCard {
  constructor(element, options = {}) {
    this.el = element;
    
    this.config = {
      tiltMaxDeg: options.tiltMaxDeg ?? 5, // Kept low for a heavy, premium hardware feel
      delay: options.delay ?? 0,
      ...options
    };

    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };
    
    // GSAP quickTo functions for extreme performance mouse tracking
    this.xSet = null;
    this.ySet = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    
    this.init();
  }

  init() {
    this.el.classList.add('magitech-glass-card');
    
    this._setupReveal();
    
    if (!this.isReducedMotion) {
      this._setupGSAP();
      this.el.addEventListener('mouseenter', this._onMouseEnter, { passive: true });
      this.el.addEventListener('mousemove', this._onMouseMove, { passive: true });
      this.el.addEventListener('mouseleave', this._onMouseLeave, { passive: true });
      window.addEventListener('resize', () => this.bounds = this.el.getBoundingClientRect(), { passive: true });
    }
  }

  _setupReveal() {
    if (this.isReducedMotion) {
      gsap.set(this.el, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }

    // Materializes from the storm fog
    gsap.fromTo(this.el, 
      { 
        opacity: 0, 
        y: 60, 
        scale: 0.96,
        filter: 'blur(16px)',
        rotationX: 5
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        rotationX: 0,
        duration: 1.4,
        delay: this.config.delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: this.el,
          start: "top 85%", // Reveal as it enters the lower view
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  _setupGSAP() {
    this.xSet = gsap.quickTo(this.el, "rotationY", { ease: "power3.out", duration: 0.6 });
    this.ySet = gsap.quickTo(this.el, "rotationX", { ease: "power3.out", duration: 0.6 });
  }

  _onMouseEnter() {
    this.bounds = this.el.getBoundingClientRect();
    // Activate the dynamic CSS lighting
    this.el.style.setProperty('--glare-opacity', '1');
  }

  _onMouseMove(e) {
    // 1. Calculate relative coordinates
    const mouseX = e.clientX - this.bounds.left;
    const mouseY = e.clientY - this.bounds.top;
    
    const xPct = (mouseX / this.bounds.width) - 0.5; // -0.5 to 0.5
    const yPct = (mouseY / this.bounds.height) - 0.5; // -0.5 to 0.5

    // 2. Apply 3D tilt
    this.xSet(xPct * this.config.tiltMaxDeg);
    this.ySet(-yPct * this.config.tiltMaxDeg); // Inverted for natural physical tilt

    // 3. Pipe exact pixel coordinates to CSS for the dynamic border & glare
    this.el.style.setProperty('--mouse-x', `${mouseX}px`);
    this.el.style.setProperty('--mouse-y', `${mouseY}px`);
  }

  _onMouseLeave() {
    // Snap 3D rotation back to flat
    this.xSet(0);
    this.ySet(0);
    
    // Smoothly disable the CSS lighting
    this.el.style.setProperty('--glare-opacity', '0');
    
    gsap.to(this.el, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)"
    });
  }

  dispose() {
    this.el.removeEventListener('mouseenter', this._onMouseEnter);
    this.el.removeEventListener('mousemove', this._onMouseMove);
    this.el.removeEventListener('mouseleave', this._onMouseLeave);
    
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === this.el) st.kill();
    });
    
    gsap.killTweensOf(this.el);
  }
}