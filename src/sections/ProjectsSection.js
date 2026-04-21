import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GlassCard } from '../ui/GlassCard.js';
import { LivePreviewFrame } from '../ui/LivePreviewFrame.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Projects Section Controller v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Depth Compositing: Projects float over the fire, while allowing the Dragon to break the Z-plane.
 * - Interactive Lightning: Wired external VFX system to project hover states.
 * - Magitech Injection: Elements inherit subsurface magma CSS glow.
 * - Memory Safety: Full disposal of localized triggers and event listeners.
 */
export class ProjectsSection {
  constructor(container, data, appSystems) {
    this.container = container;
    this.projectsData = data || [];
    
    // We need the lightning system to trigger interactive strikes on hover
    this.lightning = appSystems?.lightning || null;
    
    this.components = {
      cards: [],
      previews: []
    };
    
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.scrollTriggers = [];
    this.hoverListeners = [];
    
    console.log('[ProjectsSection] Initializing The Hoard...');
  }

  init() {
    this._buildDOM();
    this._mountComponents();
    this._setupAnimations();
    this._bindInteractiveVFX();
  }

  _buildDOM() {
    // pointer-passthrough allows clicks to hit the WebGL canvas where there is empty space
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    this.container.style.minHeight = 'auto'; // Projects naturally dictate their own height

    const projectsHTML = this.projectsData.map((project, i) => {
      // Alternate layouts: Even indexes = Text Left. Odd indexes = Text Right.
      const isReversed = project.layout === 'right' || i % 2 !== 0;
      
      return `
        <article class="project-row ${isReversed ? 'row-reversed' : ''}" style="pointer-events: auto;">
          <div class="project-glass-container magitech-glass-card magitech-interactive" data-index="${i}">
            
            <div class="project-info">
              <header style="margin-bottom: 1.5rem;">
                <span style="color: var(--color-cyan); font-family: var(--font-mono); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">
                  // ${project.role}
                </span>
                <h3 style="margin-top: 0.5rem; font-size: clamp(1.8rem, 3vw, 2.5rem);">
                  <a href="${project.repo_url}" target="_blank" rel="noopener noreferrer">${project.title}</a>
                </h3>
              </header>
              
              <p style="margin-bottom: 1.5rem; font-size: 1.05rem;">
                ${project.description}
              </p>
              
              ${project.metrics && project.metrics.length > 0 ? `
                <ul class="project-metrics" style="list-style: none; margin-bottom: 1.5rem; padding: 0;">
                  ${project.metrics.map(m => `
                    <li style="margin-bottom: 0.5rem; display: flex; align-items: flex-start; gap: 0.5rem;">
                      <span style="color: var(--color-cyan);">▸</span> ${m}
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
              
              <div class="project-tech-stack" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${project.tech_stack.map(tech => `
                  <span style="background: rgba(255,255,255,0.05); border: 1px solid rgba(0,255,255,0.1); padding: 0.3rem 0.8rem; border-radius: 20px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-cyan);">
                    ${tech}
                  </span>
                `).join('')}
              </div>
            </div>

            <div class="project-preview-target" id="preview-target-${i}"></div>
            
          </div>
        </article>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="container">
        <div class="projects-header" style="text-align: center; margin-bottom: 6rem; pointer-events: auto;">
          <h2 class="section-title">THE HOARD</h2>
          <p style="color: var(--color-cyan); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 2px;">
            Security & Edge Architectures
          </p>
        </div>
        
        <div class="projects-stream" style="display: flex; flex-direction: column; gap: clamp(4rem, 8vw, 8rem);">
          ${projectsHTML}
        </div>
      </div>
    `;

    this.titleContainer = this.container.querySelector('.projects-header');
    this.projectRows = this.container.querySelectorAll('.project-row');
  }

  _mountComponents() {
    const containers = this.container.querySelectorAll('.project-glass-container');

    containers.forEach((glassEl) => {
      const index = parseInt(glassEl.dataset.index, 10);
      const projectData = this.projectsData[index];
      const previewTarget = glassEl.querySelector('.project-preview-target');

      // 1. Mount Glass Card Physics
      // Reduced tilt for heavy content blocks to maintain readability
      const glassCard = new GlassCard(glassEl, {
        tiltMaxDeg: 3, 
        tiltLerp: 0.05
      });
      this.components.cards.push(glassCard);

      // 2. Mount Live Preview Frame
      const preview = new LivePreviewFrame(previewTarget, {
        project: projectData,
        enableLazyLoad: true,
        fallbackOnMobile: true
      });
      this.components.previews.push(preview);
    });
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.titleContainer, ...this.projectRows], { opacity: 1, y: 0 });
      return;
    }

    gsap.set(this.titleContainer, { opacity: 0, y: 30 });
    
    // 1. Animate Header
    this.scrollTriggers.push(
      ScrollTrigger.create({
        trigger: this.titleContainer,
        start: "top 80%",
        onEnter: () => {
          gsap.to(this.titleContainer, { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" });
        }
      })
    );

    // 2. Animate each project row independently as it scrolls into view
    this.projectRows.forEach((row) => {
      const glassContainer = row.querySelector('.project-glass-container');
      const isReversed = row.classList.contains('row-reversed');
      
      // Slide in from the left or right based on the layout
      gsap.set(glassContainer, { 
        opacity: 0, 
        x: isReversed ? 80 : -80,
        y: 40
      });

      this.scrollTriggers.push(
        ScrollTrigger.create({
          trigger: row,
          start: "top 85%",
          onEnter: () => {
            gsap.to(glassContainer, {
              opacity: 1,
              x: 0,
              y: 0,
              duration: 1.4,
              ease: "power3.out",
              // CRITICAL: Clear GSAP transform matrix when done so the CSS 3D hover tilt can take over
              clearProps: "transform" 
            });
          }
        })
      );
    });
  }

  _bindInteractiveVFX() {
    if (this.isReducedMotion || !this.lightning) return;

    this.projectRows.forEach(row => {
      const el = row.querySelector('.project-glass-container');
      
      // We throttle the lightning strike so it doesn't spam if they move their mouse wildly
      let isThrottled = false;
      
      const onEnter = () => {
        if (isThrottled) return;
        isThrottled = true;
        
        // Trigger a localized 3D lightning strike in the background
        this.lightning.triggerBurst();
        
        setTimeout(() => { isThrottled = false; }, 2000);
      };

      el.addEventListener('mouseenter', onEnter);
      
      // Store reference for garbage collection
      this.hoverListeners.push({ el, onEnter });
    });
  }

  dispose() {
    console.log('[ProjectsSection] System Disposing...');
    
    // 1. Clean Scroll Physics
    this.scrollTriggers.forEach(st => st.kill());
    this.scrollTriggers = [];
    
    // 2. Clean Event Listeners
    this.hoverListeners.forEach(({ el, onEnter }) => {
      el.removeEventListener('mouseenter', onEnter);
    });
    this.hoverListeners = [];

    // 3. Clean GSAP Matrix
    gsap.killTweensOf([this.titleContainer, ...this.container.querySelectorAll('.project-glass-container')]);
    
    // 4. Dispose Sub-components
    this.components.cards.forEach(c => c.dispose());
    this.components.previews.forEach(p => p.dispose());
    this.components.cards = [];
    this.components.previews = [];
    
    this.container.innerHTML = '';
  }
}