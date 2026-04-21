import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Magical Glyph Revealer v5.0 (PLASMA FLASH)
 * Engineered for the Obsidian Tempest UI layer.
 * * Upgrades:
 * - Eradicated DOM Lag: Removed `filter: blur()`. Uses pure opacity and scale for 60fps rendering.
 * - Dynamic Staggering: Uses `stagger: { amount: x }` so long sentences don't take an eternity to type out.
 * - Plasma Cooldown: Letters flash brilliant cyan with a tight text-shadow, then snap to their resting state.
 * - Ethereal Ease: Replaced the cartoonish 'bounce' with a sharp, aggressive 'expo.out' cinematic snap.
 */
export class TypewriterEffect {
  constructor(container, options = {}) {
    this.container = container;
    this.config = {
      text: options.text || '',
      totalDuration: options.duration ?? 1.2, // Total time for the ENTIRE string to reveal
      autoStart: options.autoStart ?? true,
      glowColor: options.glowColor ?? 'var(--color-cyan, #00ffff)',
      ...options
    };

    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.chars = []; 
    this.timeline = null;
    
    this.init();
  }

  init() {
    this._setupDOM();
    this._buildTimeline();
    
    if (this.config.autoStart && !this.isReducedMotion) {
      this.play();
    }
  }

  _setupDOM() {
    this.container.innerHTML = '';
    
    // 1. A11y: Visually hidden full text for screen readers
    const srText = document.createElement('span');
    srText.className = 'sr-only'; 
    srText.innerHTML = this.config.text;
    this.container.appendChild(srText);

    // 2. The Visual Container (hidden from screen readers)
    this.visibleContainer = document.createElement('span');
    this.visibleContainer.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.visibleContainer);

    // Normalize line breaks
    const rawText = this.config.text.replace(/<br\s*\/?>/gi, '\n');

    // 3. Wrap every single character in a span
    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      
      if (char === '\n') {
        this.visibleContainer.appendChild(document.createElement('br'));
      } else {
        const span = document.createElement('span');
        // Hardware accelerated CSS properties ONLY
        span.style.display = 'inline-block'; 
        span.style.opacity = '0'; 
        span.style.willChange = 'opacity, transform, color, text-shadow'; 
        
        span.innerHTML = char === ' ' ? '&nbsp;' : char;
        
        this.visibleContainer.appendChild(span);
        this.chars.push(span);
      }
    }

    if (this.isReducedMotion) {
      this.chars.forEach(span => { span.style.opacity = '1'; });
    }
  }

  _buildTimeline() {
    if (this.isReducedMotion || this.chars.length === 0) return;

    this.timeline = gsap.timeline({ paused: true });

    // The Plasma Flash Animation
    // Letters scale down from 1.5x, flashing bright cyan, then cooling to normal
    this.timeline.fromTo(this.chars, 
      { 
        opacity: 0, 
        scale: 1.5,
        x: -5, // Slight horizontal drift
        color: '#ffffff', // Burn white-hot initially
        textShadow: `0px 0px 20px ${this.config.glowColor}, 0px 0px 10px ${this.config.glowColor}`
      },
      {
        opacity: 1,
        scale: 1,
        x: 0,
        color: 'inherit', // Cool down to normal text color
        textShadow: '0px 0px 0px transparent', // Glow snaps off
        duration: 0.6,
        stagger: {
          amount: this.config.totalDuration, // Distributes the stagger evenly across the total duration
          from: "start"
        },
        ease: "expo.out" // Aggressive, sharp snap into place
      }
    );
  }

  play() {
    if (this.isReducedMotion || !this.timeline) return;
    this.timeline.play();
  }

  complete() {
    if (this.isReducedMotion || !this.timeline) return;
    this.timeline.progress(1.0);
  }

  setProgress(progress) {
    if (this.isReducedMotion || !this.timeline) return;
    // Scrub the timeline directly based on scroll
    this.timeline.progress(progress);
  }

  dispose() {
    if (this.timeline) this.timeline.kill();
    this.container.innerHTML = '';
    this.chars = [];
  }
}