import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Magitech Parchment Card v6.0 (RUNIC CIPHER EDITION)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Runic Cipher Engine: Headers scramble through Ancient Futhark runes before resolving to English.
 * - Magitech Typography: CSS injected to blend ancient serif styling with cyber-terminal glows.
 * - Cataclysmic Entry: Cards "burn" into reality with high-exposure HDR filters and 3D rotation.
 * - Heavy Obsidian Physics: Float and tilt mechanics retuned to feel like heavy stone/leather.
 */
export class ParchmentCard {
  constructor(element, options = {}) {
    this.el = element;
    this.config = {
      delay: options.delay ?? 0,
      direction: options.direction ?? 'up', // 'up', 'left', 'right', 'z'
      tiltStrength: options.tiltStrength ?? 8, 
      ...options
    };
    
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.floatTween = null;
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };
    
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseEnter = this._handleMouseEnter.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);
    
    this.init();
  }

  init() {
    this._injectCataclysmStyles();
    this._sculptRunicDOM();

    this._setupReveal();
    
    if (!this.isReducedMotion) {
      this._setupFloatAnimation();
      this._setupInteractivePhysics();
    }
  }

  /**
   * Injects the necessary CSS for the glowing runes, magma hover tracking,
   * and the ancient typography styling.
   */
  _injectCataclysmStyles() {
    if (document.getElementById('cataclysm-card-styles')) return;

    const style = document.createElement('style');
    style.id = 'cataclysm-card-styles';
    style.innerHTML = `
      .obsidian-spellbook {
        position: relative;
        background: rgba(5, 10, 15, 0.75);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 170, 255, 0.15);
        border-radius: 4px;
        box-shadow: 
          inset 0 0 30px rgba(0, 0, 0, 0.8), 
          inset 0 0 10px rgba(255, 17, 51, 0.1),
          0 15px 35px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        transform-style: preserve-3d;
      }
      
      /* The Magma / Plasma Hover Spotlight */
      .obsidian-spellbook::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(
          800px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), 
          rgba(0, 170, 255, 0.15), 
          rgba(255, 17, 51, 0.05) 40%, 
          transparent 80%
        );
        z-index: 0;
        pointer-events: none;
        transition: opacity 0.4s ease;
        opacity: 0;
      }
      .obsidian-spellbook:hover::before { opacity: 1; }

      /* Corner Runes */
      .runic-corner {
        position: absolute;
        width: 12px;
        height: 12px;
        border: 1px solid rgba(0, 170, 255, 0.5);
        z-index: 1;
        pointer-events: none;
      }
      .runic-tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
      .runic-tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
      .runic-bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
      .runic-br { bottom: 6px; right: 6px; border-left: none; border-top: none; }
      
      .spellbook-content { position: relative; z-index: 2; }
      
      /* Ancient Magitech Typography */
      .runic-header {
        font-family: 'Times New Roman', serif; /* Ancient serif fallback */
        text-transform: uppercase;
        letter-spacing: 3px;
        color: var(--color-cyan, #00ffff);
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  _sculptRunicDOM() {
    this.el.classList.add('obsidian-spellbook');

    // Find headers and tag them for the Runic Cipher
    const headers = this.el.querySelectorAll('h1, h2, h3');
    headers.forEach(h => h.classList.add('runic-header'));

    const existingHTML = this.el.innerHTML;
    this.el.innerHTML = `
      <div class="runic-corner runic-tl"></div>
      <div class="runic-corner runic-tr"></div>
      <div class="runic-corner runic-bl"></div>
      <div class="runic-corner runic-br"></div>
      <div class="spellbook-content">${existingHTML}</div>
    `;
  }

  /**
   * The Runic Cipher Engine: 
   * Rapidly cycles text through Ancient Elder Futhark runes before resolving.
   */
  _triggerRunicCipher() {
    if (this.isReducedMotion) return;

    const titles = this.el.querySelectorAll('.runic-header');
    const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ⍙⎍⍜∰⋏⍾'; // Elder Futhark + Alien Glyphs
    
    titles.forEach(title => {
      // Safety: Only scramble text-only elements to avoid breaking inner HTML spans
      if (title.children.length > 0) return;
      
      const originalText = title.dataset.original || title.innerText;
      title.dataset.original = originalText;
      let iteration = 0;
      
      clearInterval(title.cipherInterval);
      
      title.cipherInterval = setInterval(() => {
        title.innerText = originalText.split('').map((letter, index) => {
          if (letter === ' ') return ' ';
          if (index < iteration) {
            return originalText[index]; // Resolve to correct English letter
          }
          // Display random ancient rune
          return runes[Math.floor(Math.random() * runes.length)];
        }).join('');
        
        iteration += 1 / 3; // Slower iteration for a more pronounced decoding effect
        
        if (iteration >= originalText.length) {
          clearInterval(title.cipherInterval);
          title.innerText = originalText;
        }
      }, 35);
    });
  }

  _setupReveal() {
    if (this.isReducedMotion) {
      gsap.set(this.el, { opacity: 1, y: 0, x: 0, z: 0, filter: 'brightness(1) blur(0px)' });
      return;
    }

    let startX = 0, startY = 0, startZ = 0;
    
    if (this.config.direction === 'up') startY = 100;
    if (this.config.direction === 'left') startX = -100;
    if (this.config.direction === 'right') startX = 100;
    if (this.config.direction === 'z') startZ = -200; 

    gsap.fromTo(this.el, 
      { 
        opacity: 0, 
        y: startY, 
        x: startX,
        z: startZ,
        scale: 0.8,
        rotationX: 15, 
        filter: 'brightness(3) blur(20px) contrast(2)', 
        boxShadow: '0 0 50px rgba(0, 170, 255, 0.8)'
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        filter: 'brightness(1) blur(0px) contrast(1)', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
        duration: 1.6,
        delay: this.config.delay,
        ease: "expo.out", 
        scrollTrigger: {
          trigger: this.el,
          start: "top 85%",
          toggleActions: "play none none reverse",
          onEnter: () => this._triggerRunicCipher() // Trigger the Magitech decode on reveal
        }
      }
    );
  }

  _setupFloatAnimation() {
    const timeOffset = Math.random() * 100; 
    
    this.floatTween = gsap.to(this.el, {
      y: "-=12",
      rotationZ: (Math.random() > 0.5 ? "+=" : "-=") + "0.5",
      rotationX: "+=1.5",
      duration: 4.5 + Math.random() * 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: timeOffset % 2
    });
  }

  _setupInteractivePhysics() {
    this.xSet = gsap.quickTo(this.el, "rotationY", { duration: 0.8, ease: "power3.out" });
    this.ySet = gsap.quickTo(this.el, "rotationX", { duration: 0.8, ease: "power3.out" });

    this.el.addEventListener('mouseenter', this._handleMouseEnter);
    this.el.addEventListener('mousemove', this._handleMouseMove);
    this.el.addEventListener('mouseleave', this._handleMouseLeave);
  }

  _handleMouseEnter() {
    if (this.floatTween) this.floatTween.pause();
    this.bounds = this.el.getBoundingClientRect();
    
    gsap.to(this.el, { 
      scale: 1.03, 
      z: 50, 
      boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 170, 255, 0.2)',
      duration: 0.5, 
      ease: "back.out(1.5)" 
    });
  }

  _handleMouseMove(e) {
    const mouseX = e.clientX - this.bounds.left;
    const mouseY = e.clientY - this.bounds.top;
    
    const xPct = (mouseX / this.bounds.width) - 0.5; 
    const yPct = (mouseY / this.bounds.height) - 0.5; 
    
    this.xSet(xPct * this.config.tiltStrength);
    this.ySet(-yPct * this.config.tiltStrength); 

    this.el.style.setProperty('--mouse-x', `${mouseX}px`);
    this.el.style.setProperty('--mouse-y', `${mouseY}px`);
  }

  _handleMouseLeave() {
    this.xSet(0);
    this.ySet(0);
    
    gsap.to(this.el, { 
      scale: 1, 
      z: 0,
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
      duration: 0.8, 
      ease: "elastic.out(1, 0.6)",
      onComplete: () => {
        if (this.floatTween) this.floatTween.play(); 
      }
    });

    this.el.style.setProperty('--mouse-x', `-1000px`);
    this.el.style.setProperty('--mouse-y', `-1000px`);
  }

  dispose() {
    if (this.floatTween) this.floatTween.kill();
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === this.el) st.kill();
    });

    // Clear any active cipher intervals
    const headers = this.el.querySelectorAll('.runic-header');
    headers.forEach(h => {
      if (h.cipherInterval) clearInterval(h.cipherInterval);
    });

    if (!this.isReducedMotion) {
      this.el.removeEventListener('mouseenter', this._handleMouseEnter);
      this.el.removeEventListener('mousemove', this._handleMouseMove);
      this.el.removeEventListener('mouseleave', this._handleMouseLeave);
    }
  }
}