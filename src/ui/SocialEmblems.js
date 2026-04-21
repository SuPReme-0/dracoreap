import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Social Emblems Component v5.0 (OBSIDIAN RUNES)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Obsidian Core: Dynamically injects CSS to create heavy, frosted glass/stone backgrounds.
 * - Dual-Tone Magic: Hover flares use the Searing Crimson and Electric Cyan palette of the Cataclysm.
 * - Heavy Magnetic Recoil: Physics tuned to feel like dragging physical stones, not light DOM elements.
 * - Runic Ignition: Spell rings accelerate and ignite brightly when the cursor crosses the event horizon.
 */
export class SocialEmblems {
  constructor(container, options = {}) {
    this.container = container;
    this.config = {
      links: options.links || {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      },
      magneticStrength: options.magneticStrength ?? 0.5, // Increased for heavier pull
      ...options
    };
    
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.emblems = [];
    this.timelines = [];
    this.init();
  }

  init() {
    this._injectCataclysmStyles();
    this._render();
    this._setupPhysics();
  }

  _injectCataclysmStyles() {
    if (document.getElementById('obsidian-emblem-styles')) return;

    const style = document.createElement('style');
    style.id = 'obsidian-emblem-styles';
    style.innerHTML = `
      .obsidian-emblem {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 65px;
        height: 65px;
        text-decoration: none;
        outline: none;
        border-radius: 50%;
        transform-style: preserve-3d;
        z-index: 10;
      }
      
      .emblem-core {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(5, 10, 15, 0.6);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 170, 255, 0.2);
        box-shadow: 
          inset 0 0 15px rgba(0, 0, 0, 0.8), 
          0 10px 20px rgba(0, 0, 0, 0.5);
        transition: border-color 0.3s ease;
      }

      .obsidian-emblem:hover .emblem-core {
        border-color: rgba(255, 17, 51, 0.5); /* Searing Crimson border on hover */
      }

      .emblem-flare {
        position: absolute;
        inset: -20px;
        border-radius: 50%;
        background: radial-gradient(circle at center, rgba(0, 170, 255, 0.3) 0%, rgba(255, 17, 51, 0.1) 40%, transparent 70%);
        opacity: 0;
        transform: scale(0.5);
        pointer-events: none;
        mix-blend-mode: screen;
      }

      .rune-ring {
        position: absolute;
        inset: -12px;
        width: calc(100% + 24px);
        height: calc(100% + 24px);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  _render() {
    const icons = [
      { name: 'github', url: this.config.links.github, label: 'GitHub Profile', path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' },
      { name: 'linkedin', url: this.config.links.linkedin, label: 'LinkedIn Profile', path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2' },
      { name: 'twitter', url: this.config.links.twitter, label: 'Twitter Profile', path: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' }
    ].filter(l => l.url);

    this.container.innerHTML = `
      <ul class="social-emblem-list" aria-label="Social Links" style="display: flex; gap: 2.5rem; list-style: none; padding: 0; margin: 0; justify-content: center;">
        ${icons.map(icon => `
          <li>
            <a href="${icon.url}" target="_blank" rel="noopener noreferrer" class="obsidian-emblem" aria-label="${icon.label}">
              
              <div class="emblem-core"></div>
              
              <svg class="rune-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#00aaff" stroke-width="1.5" stroke-dasharray="4 8 12 8" stroke-linecap="round" opacity="0.4"></circle>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ff1133" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.2"></circle>
              </svg>
              
              <div class="emblem-flare"></div>

              <div class="icon-wrapper" style="position: relative; z-index: 10; display: flex; align-items: center; justify-content: center;">
                <svg class="icon-glitch glitch-cyan" viewBox="0 0 24 24" fill="none" stroke="#00aaff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; opacity: 0;"><path d="${icon.path}"></path></svg>
                <svg class="icon-glitch glitch-red" viewBox="0 0 24 24" fill="none" stroke="#ff1133" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; opacity: 0;"><path d="${icon.path}"></path></svg>
                <svg class="icon-main" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: relative; width: 24px; height: 24px; transition: stroke 0.3s ease;"><path d="${icon.path}"></path></svg>
              </div>
              
            </a>
          </li>
        `).join('')}
      </ul>
    `;
  }

  _setupPhysics() {
    this.emblems = Array.from(this.container.querySelectorAll('.obsidian-emblem'));

    this.emblems.forEach((emblem) => {
      const core = emblem.querySelector('.emblem-core');
      const runeRing = emblem.querySelector('.rune-ring');
      const flare = emblem.querySelector('.emblem-flare');
      const mainIcon = emblem.querySelector('.icon-main');
      const glitchCyan = emblem.querySelector('.glitch-cyan');
      const glitchRed = emblem.querySelector('.glitch-red');
      
      // Idle Magic: Slow continuous rotation of the spell circles
      if (!this.isReducedMotion) {
        const idleRot = gsap.to(runeRing, {
          rotation: 360,
          duration: 25, // Slower, heavier rotation
          repeat: -1,
          ease: "none"
        });
        this.timelines.push(idleRot);
      }

      // GSAP QuickSetters for high-performance magnetic tracking
      const xSet = gsap.quickTo(emblem, "x", { duration: 0.6, ease: "power3.out" });
      const ySet = gsap.quickTo(emblem, "y", { duration: 0.6, ease: "power3.out" });

      if (!this.isReducedMotion) {
        // --- HOVER ENTER: The Runic Ignition ---
        emblem.addEventListener('mouseenter', () => {
          // Accelerate ring spin and brighten it with the crimson/cyan colors
          gsap.to(runeRing, { opacity: 1, scale: 1.15, duration: 0.4, ease: "back.out(1.5)" });
          gsap.to(runeRing.children[0], { strokeDasharray: "15 5 30 5", stroke: '#00aaff', duration: 0.3 });
          gsap.to(runeRing.children[1], { opacity: 0.8, stroke: '#ff1133', duration: 0.3 });
          
          // Flare ignition
          gsap.to(flare, { opacity: 1, scale: 1.2, duration: 0.3, ease: "power2.out" });
          
          // Color shift main icon to Electric Cyan
          gsap.to(mainIcon, { stroke: '#00aaff', duration: 0.2 });

          // Cyberpunk RGB Split Glitch Timeline
          const glitchTl = gsap.timeline();
          glitchTl.to(glitchCyan, { opacity: 0.9, x: -5, y: 3, duration: 0.05, ease: "none" })
                  .to(glitchRed, { opacity: 0.9, x: 5, y: -3, duration: 0.05, ease: "none" }, "<")
                  .to([glitchCyan, glitchRed], { x: 0, y: 0, opacity: 0, duration: 0.15, ease: "power2.out" }, "+=0.05");
        });

        // --- MOUSE MOVE: Magnetic Physics ---
        emblem.addEventListener('mousemove', (e) => {
          const rect = emblem.getBoundingClientRect();
          const x = (e.clientX - rect.left - rect.width / 2) * this.config.magneticStrength;
          const y = (e.clientY - rect.top - rect.height / 2) * this.config.magneticStrength;
          
          xSet(x);
          ySet(y);
          
          // 3D Tilt the core, creating a heavy depth effect
          gsap.to(core, {
            rotationY: x * 1.2,
            rotationX: -y * 1.2,
            boxShadow: `${-x}px ${-y}px 25px rgba(0, 170, 255, 0.3), inset 0 0 15px rgba(255, 17, 51, 0.2)`,
            duration: 0.4
          });
          
          // Parallax push the icon out further than the core
          gsap.to(mainIcon, { x: x * 0.6, y: y * 0.6, duration: 0.4 });
        });

        // --- MOUSE LEAVE: Elastic Recoil & Cooldown ---
        emblem.addEventListener('mouseleave', () => {
          xSet(0);
          ySet(0);
          
          // Snap core back with heavy elasticity
          gsap.to(core, {
            rotationY: 0,
            rotationX: 0,
            boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.8), 0 10px 20px rgba(0, 0, 0, 0.5)',
            duration: 0.9,
            ease: "elastic.out(1, 0.3)" // Very heavy snap
          });
          
          // Snap icon back
          gsap.to(mainIcon, { x: 0, y: 0, stroke: '#ffffff', duration: 0.9, ease: "elastic.out(1, 0.3)" });

          // Cool down ring and flare
          gsap.to(runeRing, { opacity: 0.4, scale: 1.0, duration: 0.6 });
          gsap.to(runeRing.children[0], { strokeDasharray: "4 8 12 8", duration: 0.6 });
          gsap.to(runeRing.children[1], { opacity: 0.2, stroke: '#ff1133', duration: 0.6 });
          gsap.to(flare, { opacity: 0, scale: 0.5, duration: 0.6 });
        });
      }
    });
  }

  dispose() {
    gsap.killTweensOf(this.emblems);
    this.timelines.forEach(tl => tl.kill());
    this.container.innerHTML = '';
  }
}