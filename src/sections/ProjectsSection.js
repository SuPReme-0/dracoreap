import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StormPortalFrame } from '../ui/StormPortalFrame.js';
import { TypewriterEffect } from '../ui/TypewriterEffect.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Projects Section Controller v7.0 (THE SOVEREIGN HOARD)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Scorched Slab Architecture: Replaced volatile FracturedCard with a stable, CSS-driven Magma/Obsidian slab layout.
 * - Hitbox Integrity: Removed 3D mouse-tracking tilt to ensure the `StormPortalFrame` iframe remains perfectly clickable.
 * - Elemental Aura: Added a blurred `#ff3300` to `#00ffff` gradient underglow that activates on hover.
 * - Volcanic Typography: Project descriptions are burned into the DOM using TypewriterEffect on scroll entry.
 */
export class ProjectsSection {
  constructor(container, data, appSystems) {
    this.container = container;
    this.projectsData = data || [];
    
    this.lightning = appSystems?.lightning || null;
    
    this.components = {
      portals: [],
      typewriters: []
    };
    
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.scrollTriggers = [];
    this.hoverListeners = [];
    
    console.log('[ProjectsSection] Unlocking The Sovereign Hoard...');
  }

  init() {
    this._injectHoardStyles();
    this._buildDOM();
    this._mountComponents();
    this._setupAnimations();
    this._bindInteractiveVFX();
  }

  _injectHoardStyles() {
    if (document.getElementById('projects-hoard-styles')) return;

    const style = document.createElement('style');
    style.id = 'projects-hoard-styles';
    style.innerHTML = `
      .hoard-header {
        text-align: center; 
        margin-bottom: 6rem; 
        pointer-events: auto;
      }
      
      .hoard-title {
        font-family: var(--font-display, serif);
        font-size: clamp(2.5rem, 6vw, 4.5rem);
        color: #ffffff; 
        letter-spacing: 6px;
        text-shadow: 0 0 40px rgba(0, 255, 255, 0.4), 0 0 10px rgba(0, 170, 255, 0.2);
        margin: 0;
      }

      .hoard-subtitle {
        color: #00ffff; 
        font-family: var(--font-mono, monospace); 
        text-transform: uppercase; 
        letter-spacing: 4px; 
        margin-top: 1rem;
        font-size: 0.9rem;
      }

      /* --- SCORCHED OBSIDIAN SLAB --- */
      .scorched-project-slab {
        position: relative;
        background: linear-gradient(160deg, #110a08 0%, #080402 50%, #020101 100%);
        border-radius: 8px;
        border: 1px solid rgba(255, 51, 0, 0.15);
        box-shadow: 0 20px 50px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.8);
        padding: clamp(2rem, 4vw, 4rem);
        z-index: 1;
        transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;
        pointer-events: auto;
      }

      .scorched-project-slab::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0.1;
        pointer-events: none;
        border-radius: inherit;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        z-index: -1;
      }

      /* Elemental Underglow */
      .slab-aura {
        position: absolute;
        inset: -2px;
        border-radius: 10px;
        z-index: -2;
        background: linear-gradient(45deg, #ff3300, transparent, #00ffff);
        opacity: 0;
        filter: blur(12px);
        transition: opacity 0.5s ease;
        pointer-events: none;
      }

      .scorched-project-slab:hover {
        border-color: rgba(255, 51, 0, 0.4);
        box-shadow: 0 30px 60px rgba(0,0,0,0.95), inset 0 0 60px rgba(255, 51, 0, 0.05);
        transform: translateY(-5px);
      }

      .scorched-project-slab:hover .slab-aura {
        opacity: 0.6;
      }

      /* --- LAYOUT GRID --- */
      .project-layout-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: clamp(2rem, 4vw, 4rem);
        align-items: center;
      }

      .row-reversed .project-layout-grid {
        grid-template-columns: 1.2fr 1fr;
      }
      .row-reversed .project-info {
        grid-column: 2;
        grid-row: 1;
      }
      .row-reversed .project-portal-mount {
        grid-column: 1;
        grid-row: 1;
      }

      /* --- TYPOGRAPHY & DETAILS --- */
      .project-info header {
        margin-bottom: 2rem; 
        border-bottom: 1px solid rgba(255, 51, 0, 0.2); 
        padding-bottom: 1rem;
      }

      .project-role {
        color: #ff3300; 
        font-family: var(--font-mono, monospace); 
        font-size: 0.85rem; 
        text-transform: uppercase; 
        letter-spacing: 2px;
      }

      .project-name {
        margin: 0.8rem 0 0 0; 
        font-size: clamp(1.8rem, 3vw, 2.5rem); 
        font-family: var(--font-display, serif);
        text-shadow: 0 0 15px rgba(255, 51, 0, 0.3);
      }
      
      .project-name a {
        color: #fff; 
        text-decoration: none;
        transition: color 0.3s ease, text-shadow 0.3s ease;
      }
      .project-name a:hover {
        color: #00ffff;
        text-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
      }

      .project-desc-mount {
        font-size: 1.05rem; 
        color: #a0958a; 
        line-height: 1.8;
        font-family: var(--font-body, sans-serif);
        margin-bottom: 2rem;
        min-height: 120px; /* Prevents layout shift during Typewriter effect */
      }

      .project-metrics {
        list-style: none; 
        margin: 0 0 2rem 0; 
        padding: 0; 
        font-family: var(--font-mono, monospace); 
        font-size: 0.85rem;
      }
      
      .project-metrics li {
        margin-bottom: 0.8rem; 
        display: flex; 
        align-items: flex-start; 
        gap: 0.8rem; 
        color: #d0c5ba;
      }

      .tech-rune-stack {
        display: flex; 
        flex-wrap: wrap; 
        gap: 0.8rem;
      }

      .tech-rune {
        background: rgba(255, 51, 0, 0.05);
        border: 1px solid rgba(255, 51, 0, 0.3);
        padding: 0.4rem 0.9rem;
        border-radius: 2px;
        font-family: var(--font-mono, monospace);
        font-size: 0.75rem;
        color: #ffaa80;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .project-portal-mount {
        width: 100%;
        height: 100%;
        min-height: 350px;
        border-radius: 8px;
        /* Padding acts as an inner bezel for the portal */
        padding: 0.8rem;
        background: rgba(0,0,0,0.6); 
        box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
      }

      @media (max-width: 900px) {
        .project-layout-grid, .row-reversed .project-layout-grid {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        .row-reversed .project-info { grid-column: 1; grid-row: 2; }
        .row-reversed .project-portal-mount { grid-column: 1; grid-row: 1; }
        .project-portal-mount { min-height: 250px; }
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';

    const projectsHTML = this.projectsData.map((project, i) => {
      const isReversed = project.layout === 'right' || i % 2 !== 0;
      
      return `
        <article class="project-row ${isReversed ? 'row-reversed' : ''}" style="margin-bottom: clamp(4rem, 8vw, 8rem);">
          <div class="scorched-project-slab" data-index="${i}">
            <div class="slab-aura"></div>
            
            <div class="project-layout-grid">
              
              <div class="project-info">
                <header>
                  <span class="project-role">◈ ${project.role}</span>
                  <h3 class="project-name">
                    <a href="${project.preview_url}" target="_blank" rel="noopener noreferrer">${project.title}</a>
                  </h3>
                </header>
                
                <div class="project-desc-mount" data-text="${project.description.replace(/"/g, '&quot;')}"></div>
                
                ${project.metrics && project.metrics.length > 0 ? `
                  <ul class="project-metrics">
                    ${project.metrics.map(m => `
                      <li><span style="color: #ff3300;">⟡</span> ${m}</li>
                    `).join('')}
                  </ul>
                ` : ''}
                
                <div class="tech-rune-stack">
                  ${project.tech_stack.map(tech => `<span class="tech-rune">${tech}</span>`).join('')}
                </div>
              </div>

              <div class="project-portal-mount" id="portal-target-${i}"></div>
              
            </div>
          </div>
        </article>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="container" style="max-width: 1400px; margin: 0 auto; perspective: 2000px;">
        <div class="hoard-header">
          <h2 class="hoard-title">THE HOARD</h2>
          <p class="hoard-subtitle">Security & Edge Architectures</p>
        </div>
        
        <div class="projects-stream" style="display: flex; flex-direction: column;">
          ${projectsHTML}
        </div>
      </div>
    `;

    this.titleContainer = this.container.querySelector('.hoard-header');
    this.projectRows = this.container.querySelectorAll('.project-row');
  }

  _mountComponents() {
    const slabs = this.container.querySelectorAll('.scorched-project-slab');

    slabs.forEach((slab) => {
      const index = parseInt(slab.dataset.index, 10);
      const projectData = this.projectsData[index];
      
      const portalTarget = slab.querySelector('.project-portal-mount');
      const descTarget = slab.querySelector('.project-desc-mount');

      // 1. The Storm Portal (Interactive Iframe)
      const portal = new StormPortalFrame(portalTarget, {
        project: projectData,
        enableLazyLoad: true,
        fallbackOnMobile: true
      });
      this.components.portals.push(portal);

      // 2. Volcanic Typography Reveal
      const typeWriter = new TypewriterEffect(descTarget, {
        text: descTarget.dataset.text,
        duration: 1.2,
        autoStart: false, 
        glowColor: '#ff3300' // Magma burn
      });
      this.components.typewriters.push(typeWriter);
    });
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.titleContainer, ...this.projectRows], { opacity: 1, y: 0, filter: 'blur(0px)' });
      this.components.typewriters.forEach(tw => tw.complete());
      return;
    }

    // Title Section Reveal
    gsap.fromTo(this.titleContainer, 
      { opacity: 0, y: -40, filter: 'blur(15px)' },
      { 
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: "expo.out",
        scrollTrigger: { trigger: this.titleContainer, start: "top 85%" }
      }
    );

    // Staggered Heavy Reveal for each Project Slab
    this.projectRows.forEach((row, index) => {
      const slab = row.querySelector('.scorched-project-slab');
      const isReversed = row.classList.contains('row-reversed');
      const tw = this.components.typewriters[index];
      
      // Starting state: pushed back, blurred, slightly offset
      gsap.set(slab, { 
        opacity: 0, 
        x: isReversed ? 80 : -80,
        y: 60,
        z: -100, 
        filter: 'blur(15px)'
      });

      this.scrollTriggers.push(
        ScrollTrigger.create({
          trigger: row,
          start: "top 80%",
          onEnter: () => {
            // 1. Detonate the slab into place
            gsap.to(slab, {
              opacity: 1,
              x: 0, y: 0, z: 0,
              filter: 'blur(0px)',
              duration: 1.4,
              ease: "back.out(1.1)", 
              clearProps: "transform,filter" // Clears transform so hover states work properly
            });

            // 2. Trigger the Volcanic Text Burn-in slightly delayed
            setTimeout(() => { if (tw) tw.play(); }, 500);
          }
        })
      );
    });
  }

  _bindInteractiveVFX() {
    if (this.isReducedMotion || !this.lightning) return;

    this.projectRows.forEach(row => {
      const slab = row.querySelector('.scorched-project-slab');
      let isThrottled = false;
      
      const onEnter = () => {
        if (isThrottled) return;
        isThrottled = true;
        
        // Trigger external WebGL lightning behind the card
        this.lightning.triggerBurst(null, 1);
        
        setTimeout(() => { isThrottled = false; }, 3000);
      };

      slab.addEventListener('mouseenter', onEnter);
      this.hoverListeners.push({ el: slab, onEnter });
    });
  }

  dispose() {
    console.log('[ProjectsSection] Shutting down The Hoard...');

    this.scrollTriggers.forEach(st => st.kill());
    this.scrollTriggers = [];
    
    this.hoverListeners.forEach(({ el, onEnter }) => {
      el.removeEventListener('mouseenter', onEnter);
    });
    this.hoverListeners = [];

    gsap.killTweensOf([this.titleContainer, ...this.container.querySelectorAll('.scorched-project-slab')]);
    
    this.components.portals.forEach(p => p.dispose());
    this.components.typewriters.forEach(t => t.dispose());
    
    this.components.portals = [];
    this.components.typewriters = [];
    
    this.container.innerHTML = '';
  }
}