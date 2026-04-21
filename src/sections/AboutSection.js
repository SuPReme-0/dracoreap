import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ParchmentCard } from '../ui/ParchmentCard.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade About Section Controller v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Asymmetrical Composition: Pushes DOM content to the right, opening a negative-space window on the left for the WebGL Dragon.
 * - Magitech Hover Injection: The lore card now tracks the user's cursor with a subsurface magma glow.
 * - Cinematic Text Scrubbing: Bio paragraphs reveal organically tied directly to scroll velocity.
 * - Memory Safety: Bulletproof disposal pipeline for SPA architecture.
 */
export class AboutSection {
  /**
   * @param {HTMLElement} container - DOM element (#about)
   * @param {Object} data - The full portfolio data (needs profile and about)
   */
  constructor(container, data) {
    this.container = container;
    this.profileData = data.profile || {};
    this.aboutData = data.about || {};
    
    this.components = {
      cards: []
    };
    
    this.scrollTriggers = [];
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    
    console.log('[AboutSection] Initializing The Lore...');
  }

  init() {
    this._buildDOM();
    this._mountComponents();
    this._setupAnimations();
  }

  _buildDOM() {
    // pointer-passthrough allows the left side of the screen to pass clicks directly to the 3D Dragon
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    
    const { short, full, values } = this.aboutData;
    const photoUrl = this.profileData.photo_url || '';

    // Split the full bio into paragraphs for staggered scroll-scrubbed animation
    const paragraphs = (full || '').split('\n\n').filter(Boolean).map(p => 
      `<p class="bio-paragraph" style="margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.8;">${p.trim()}</p>`
    ).join('');

    this.container.innerHTML = `
      <div class="container" style="max-width: 900px; margin-left: auto; margin-right: 0;">
        
        <div class="about-header" style="text-align: right; margin-bottom: 4rem; pointer-events: auto; padding-right: 2rem;">
          <h2 class="section-title">THE ARCHITECT</h2>
          <div style="width: 80px; height: 2px; background: var(--color-cyan); margin-left: auto; margin-top: 1rem; box-shadow: 0 0 10px var(--color-cyan);"></div>
        </div>

        <div class="about-parchment-target" style="pointer-events: auto;">
          <div class="magitech-interactive parchment-card parchment-claw-border" style="padding: clamp(2rem, 4vw, 4rem);">
            
            <div class="about-grid" style="display: grid; gap: 3rem; align-items: start;">
              
              <div class="about-sidebar" style="display: flex; flex-direction: column; gap: 1.5rem; align-items: center; text-align: center;">
                ${photoUrl ? `
                  <div class="profile-photo-wrapper" style="width: 180px; height: 180px; border-radius: 50%; border: 2px solid var(--color-cyan); overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,255,255,0.2);">
                    <img src="${photoUrl}" alt="${this.profileData.name}" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(0.9);">
                  </div>
                ` : `
                  <div class="profile-photo-wrapper" style="width: 180px; height: 180px; border-radius: 50%; border: 2px dashed var(--color-cyan); display: flex; align-items: center; justify-content: center; color: var(--color-cyan); font-family: var(--font-mono);">
                    [IMAGE_MISSING]
                  </div>
                `}
                <p style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 600; color: #2a1f18; text-transform: uppercase; letter-spacing: 1px;">
                  ${short}
                </p>
              </div>

              <div class="about-main">
                <div class="bio-content">
                  ${paragraphs}
                </div>
                
                ${values?.length ? `
                  <div style="margin-top: 3rem; border-top: 1px dashed rgba(80, 50, 20, 0.3); padding-top: 2rem;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 1.5rem; color: #2a1f18; text-transform: uppercase; letter-spacing: 2px; font-family: var(--font-mono);">// Core_Axioms.sys</h3>
                    <ul class="values-list" style="list-style: none; padding: 0; display: grid; gap: 1.2rem;">
                      ${values.map(val => `
                        <li class="value-item" style="display: flex; align-items: flex-start; gap: 1rem; font-family: var(--font-body); font-weight: 500; color: #1a1510;">
                          <span style="color: #8b0000; font-size: 1.2rem; transform: translateY(-2px);">▹</span>
                          <span>${val}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

    this.titleContainer = this.container.querySelector('.about-header');
    this.parchmentTarget = this.container.querySelector('.about-parchment-target');
    this.bioParagraphs = this.container.querySelectorAll('.bio-paragraph');
    this.valueItems = this.container.querySelectorAll('.value-item');
  }

  _mountComponents() {
    // Wrap the internal card structure with the GSAP entry physics
    const parchment = new ParchmentCard(this.parchmentTarget.firstElementChild, {
      direction: 'up',
      delay: 0.1
    });
    this.components.cards.push(parchment);
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.titleContainer, this.bioParagraphs, this.valueItems], { opacity: 1, y: 0, filter: 'blur(0px)', x: 0 });
      return;
    }

    // 1. Animate Section Title (Snaps in from the right)
    gsap.set(this.titleContainer, { opacity: 0, x: 50 });
    this.scrollTriggers.push(
      ScrollTrigger.create({
        trigger: this.container,
        start: "top 75%",
        onEnter: () => {
          gsap.to(this.titleContainer, { opacity: 1, x: 0, duration: 1.2, ease: "power3.out" });
        }
      })
    );

    // 2. Scrub the Bio Paragraphs (They reveal organically as the user scrolls)
    gsap.set(this.bioParagraphs, { opacity: 0, y: 20, filter: 'blur(8px)' });
    
    this.scrollTriggers.push(
      ScrollTrigger.create({
        trigger: this.parchmentTarget,
        start: "top 65%",
        end: "bottom 85%",
        scrub: 0.5, // 500ms smoothing on the scrub
        animation: gsap.to(this.bioParagraphs, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          stagger: 0.3, // Cascades down the paragraphs
          ease: "none"
        })
      })
    );

    // 3. Pop in the Core Axioms (Fires once when they cross the threshold)
    if (this.valueItems.length > 0) {
      gsap.set(this.valueItems, { opacity: 0, x: -30 });
      
      this.scrollTriggers.push(
        ScrollTrigger.create({
          trigger: ".values-list",
          start: "top 90%",
          onEnter: () => {
            gsap.to(this.valueItems, {
              opacity: 1,
              x: 0,
              stagger: 0.15,
              duration: 0.8,
              ease: "back.out(1.2)"
            });
          }
        })
      );
    }
  }

  dispose() {
    console.log('[AboutSection] Disposing');
    this.scrollTriggers.forEach(st => st.kill());
    gsap.killTweensOf([this.titleContainer, this.bioParagraphs, this.valueItems]);
    
    this.components.cards.forEach(c => c.dispose());
    this.components.cards = [];
    this.scrollTriggers = [];
    
    this.container.innerHTML = '';
  }
}