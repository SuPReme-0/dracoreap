import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ParchmentCard } from '../ui/ParchmentCard.js';
import { TypewriterEffect } from '../ui/TypewriterEffect.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Skills Section Controller v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Spatial Scrubbing: Each card now possesses its own physical ScrollTrigger, typing text organically as it crosses the viewport.
 * - Magitech Hover Integration: Injected CSS interactive classes so cards emit a subsurface magma glow tracking the cursor.
 * - Centralized CSS Compliance: Relies perfectly on the master main.css z-index and layout architectures.
 * - Memory Safety: Full garbage collection of localized ScrollTrigger arrays to prevent SPA memory leaks.
 */
export class SkillsSection {
  constructor(container, data) {
    this.container = container;
    this.skillsData = data || [];
    
    this.components = {
      cards: [],
      typewriters: []
    };
    
    this.scrollTriggers = []; // Upgraded to array for localized triggers
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    
    console.log('[SkillsSection] Initializing Arsenal...');
  }

  init() {
    this._buildDOM();
    this._mountComponents();
  }

  _buildDOM() {
    // pointer-passthrough ensures empty space allows clicks through to the WebGL Canvas (e.g., clicking the dragon)
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    
    this.container.innerHTML = `
      <div class="container">
        <h2 class="section-title" style="margin-bottom: 3.5rem; text-align: center; pointer-events: auto;">
          DOMAINS & ARSENAL
        </h2>
        
        <div class="grid-auto">
          ${this.skillsData.map((skill, i) => `
            <article class="skill-card-wrapper" data-index="${i}" style="pointer-events: auto;">
              <div class="skill-card-inner parchment-card parchment-claw-border magitech-interactive" style="padding: 2.5rem; height: 100%;">
                
                <header style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(80, 50, 20, 0.2); padding-bottom: 1rem;">
                  <img src="${skill.icon}" alt="" style="width: 32px; height: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                  <h3 style="margin: 0; color: #2a1f18; text-transform: uppercase; letter-spacing: 1px; font-size: 1.2rem;">
                    ${skill.domain}
                  </h3>
                </header>
                
                <div style="font-family: var(--font-mono); font-size: 0.95rem; color: #1a1510; line-height: 1.8;">
                  <p style="color: #5a3d2b; font-weight: 600; margin-bottom: 0.8rem; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;">
                    // Technical_Expertise.sys
                  </p>
                  <div class="typewriter-target" data-skills="${skill.technical_skills.map(s => `> ${s}`).join('<br>')}"></div>
                </div>
                
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;

    this.title = this.container.querySelector('.section-title');
    this.cardWrappers = this.container.querySelectorAll('.skill-card-wrapper');
  }

  _mountComponents() {
    this.cardWrappers.forEach((wrapper, i) => {
      const innerCard = wrapper.querySelector('.skill-card-inner');
      const typewriterTarget = wrapper.querySelector('.typewriter-target');

      // 1. Mount Parchment Card (Directional "Claw Strike" Reveal)
      // Alternating entrance vectors based on grid index
      const direction = i % 2 === 0 ? 'left' : 'right';
      
      const parchment = new ParchmentCard(innerCard, {
        direction: direction,
        delay: i * 0.15 // Organic stagger
      });
      this.components.cards.push(parchment);

      // 2. Mount Typewriter 
      const rawText = typewriterTarget.dataset.skills.replace(/<br>/g, '\n');
      
      const typewriter = new TypewriterEffect(typewriterTarget, {
        text: rawText,
        cursorChar: '▋',
        autoStart: false // Driven purely by scroll physics
      });
      this.components.typewriters.push(typewriter);

      // 3. Localized Spatial Scroll Scrubbing
      if (this.isReducedMotion) {
        typewriter.complete();
      } else {
        const trigger = ScrollTrigger.create({
          trigger: wrapper,
          start: "top 85%",    // Begin typing when the card enters the lower screen
          end: "bottom 60%",   // Finish typing by the time the card reaches the upper-mid screen
          scrub: 0.2,          // Smooth easing to prevent jitter on hard mousewheel clicks
          onUpdate: (self) => {
            // Slight multiplier ensures it finishes completely before exiting bounds
            const typingProgress = Math.min(1.0, self.progress * 1.1);
            typewriter.setProgress(typingProgress);
          }
        });
        this.scrollTriggers.push(trigger);
      }
    });

    // 4. Master Section Title Animation
    if (!this.isReducedMotion) {
      gsap.fromTo(this.title, 
        { opacity: 0, y: -30, letterSpacing: '12px' },
        { 
          opacity: 1, 
          y: 0, 
          letterSpacing: '2px', // Snaps together sharply
          duration: 1.2, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: this.container,
            start: "top 80%",
          }
        }
      );
    }
  }

  dispose() {
    console.log('[SkillsSection] System Disposing...');
    
    // Kill localized triggers safely
    this.scrollTriggers.forEach(st => st.kill());
    this.scrollTriggers = [];
    
    gsap.killTweensOf(this.title);
    
    this.components.cards.forEach(c => c.dispose());
    this.components.typewriters.forEach(t => t.dispose());
    
    this.components.cards = [];
    this.components.typewriters = [];
    this.container.innerHTML = '';
  }
}