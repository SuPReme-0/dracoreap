import gsap from 'gsap';
import * as THREE from 'three';
import { a11yManager } from '../utils/accessibility.js';
import { NameCard } from '../ui/NameCard.js';

/**
 * Industry-Grade Intro Section Controller v8.0 (THE HAZY VEIL)
 * * Architectural Upgrades:
 * - The Hazy Veil: Heavy backdrop-filter blurs the 3D dragon until the seal is broken.
 * - Monolithic Intro: Staggered, cinematic text reveal for the initial screen.
 * - Asymmetrical Balance: UI mounts on the left, massive WebGL flame bursts on the right.
 */
export class IntroSection {
  constructor(container, profileData, appSystems) {
    this.container = container;
    this.data = profileData || {};
    
    this.dragon = appSystems.dragon;
    this.camera = appSystems.camera;
    this.lightning = appSystems.lightning;
    this.flames = appSystems.flames; 

    this.state = {
      isAwake: false,
      isTransitioning: false
    };

    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.nameCard = null;

    this._handleClick = this._handleClick.bind(this);
  }

  init() {
    document.body.style.overflow = 'hidden';
    
    this._buildDOM();
    this._setupAnimations();
    this._bindEvents();
    
    console.log('[IntroSection] Hazy Veil Armed. Sovereign is hidden.');
  }

  _buildDOM() {
    const name = this.data.name || "Priyanshu Roy";
    const title = this.data.title || "AI Researcher & Technologist";
    const avatar = this.data.image || "/assets/avatar.jpg";

    // The Architecture Chips (Floating Below the Card)
    const architectures = [
      "Agentic RAG Workflows",
      "On-Device Inference",
      "GoPrivate EDR",
      "WebGL & Deck.gl"
    ];

    const chipsHTML = architectures.map((tech, i) => `
      <div class="arch-chip float-anim-${i % 3}" style="
        padding: 0.6rem 1.2rem; 
        background: rgba(255, 51, 0, 0.05); 
        border: 1px solid rgba(255, 51, 0, 0.2); 
        border-radius: 4px; 
        color: #fff; 
        font-family: var(--font-mono); 
        font-size: 0.85rem; 
        letter-spacing: 2px;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(255, 51, 0, 0.1);
        opacity: 0;
        transform: translateY(20px);
      ">
        <span style="color: var(--color-magma); margin-right: 6px;">◈</span> ${tech}
      </div>
    `).join('');

    // Split name for the monolithic intro reveal
    const nameSpans = name.split('').map(char => 
      char === ' ' ? '&nbsp;' : `<span class="intro-name-char" style="display:inline-block; will-change: transform, opacity;">${char}</span>`
    ).join('');

    this.container.innerHTML = `
      <div class="hero-persistent-wrapper container" style="position: relative; z-index: 10; min-height: 100vh; display: flex; align-items: center; justify-content: flex-start; padding-top: 10vh; padding-left: 5vw;">
        <div class="hero-layout" style="display: flex; gap: 3rem; align-items: flex-start; width: 100%; max-width: 900px;">
          
          <div class="hero-avatar-wrapper" style="position: relative; width: 120px; height: 120px; flex-shrink: 0; opacity: 0; transform: scale(0.8); margin-top: 1rem;">
            <div style="position: absolute; inset: -2px; border-radius: 50%; background: linear-gradient(135deg, rgba(255,51,0,0.8), rgba(0,34,68,0.8)); animation: spin 4s linear infinite; box-shadow: 0 0 30px rgba(255,51,0,0.3);"></div>
            <div style="position: absolute; inset: 0; border-radius: 50%; overflow: hidden; border: 2px solid #05070a; background: #000;">
              <img src="${avatar}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) grayscale(0.2);"/>
            </div>
          </div>

          <div class="hero-info" style="flex: 1; min-width: 300px;">
            <div id="sovereign-name-card"></div>
            <div class="hero-chips" style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
              ${chipsHTML}
            </div>
          </div>

        </div>
      </div>

      <div class="intro-cinematic-overlay" style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 100; background: rgba(5, 7, 10, 0.6); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);">
        
        <div class="intro-content" style="position: relative; z-index: 2; perspective: 1200px; text-align: center; display: flex; flex-direction: column; align-items: center;">
          
          <h1 class="intro-dragon-name" aria-label="${name}" style="font-family: var(--font-display); font-size: clamp(3rem, 8vw, 6rem); color: #ffffff; text-shadow: 0 0 40px rgba(255, 51, 0, 0.3); margin-bottom: 0.5rem; letter-spacing: 8px;">
            ${nameSpans}
          </h1>
          
          <h3 class="intro-dragon-title" style="font-family: var(--font-mono); font-size: clamp(1rem, 2vw, 1.5rem); color: var(--color-cyan); letter-spacing: 6px; opacity: 0; transform: translateY(20px); margin-bottom: 4rem;">
            ${title}
          </h3>
          
          <button class="magitech-seal-btn enter-btn" aria-label="Unseal" tabindex="0" style="opacity: 0; transform: scale(0.8);">
            <div class="seal-wax-container">
              <div class="seal-wax-outer"></div>
              <div class="seal-wax-inner">
                <svg class="seal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
            </div>
            <span class="seal-text" style="letter-spacing: 4px;">UNSEAL</span>
          </button>

        </div>
      </div>
    `;

    // Inject physics for the floating chips
    if (!document.getElementById('intro-chip-physics')) {
      const style = document.createElement('style');
      style.id = 'intro-chip-physics';
      style.innerHTML = `
        @keyframes floatAnim0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes floatAnim1 { 0%, 100% { transform: translateY(-4px); } 50% { transform: translateY(6px); } }
        @keyframes floatAnim2 { 0%, 100% { transform: translateY(3px); } 50% { transform: translateY(-5px); } }
        .float-anim-0 { animation: floatAnim0 4s ease-in-out infinite; }
        .float-anim-1 { animation: floatAnim1 5s ease-in-out infinite; }
        .float-anim-2 { animation: floatAnim2 4.5s ease-in-out infinite; }
      `;
      document.head.appendChild(style);
    }

    this.overlay = this.container.querySelector('.intro-cinematic-overlay');
    this.nameChars = this.container.querySelectorAll('.intro-name-char');
    this.introTitle = this.container.querySelector('.intro-dragon-title');
    this.enterBtn = this.container.querySelector('.enter-btn');
    
    this.avatarProfile = this.container.querySelector('.hero-avatar-wrapper');
    this.archChips = this.container.querySelectorAll('.arch-chip');

    // Instantiate the Ancient Letter NameCard
    this.nameCard = new NameCard('sovereign-name-card', name, title);
    this.nameCard.build();
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.nameChars, this.introTitle, this.enterBtn], { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 });
      this.state.isAwake = true;
      return;
    }

    const tl = gsap.timeline({ delay: 0.3 });

    // 1. The Monolithic Text Reveal
    tl.fromTo(this.nameChars, 
      { opacity: 0, filter: 'blur(20px)', z: -200, y: 30 },
      { opacity: 1, filter: 'blur(0px)', z: 0, y: 0, duration: 1.8, stagger: 0.08, ease: "power3.out" }
    );

    // 2. Title Sub-fade
    tl.to(this.introTitle, 
      { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 
      "-=1.0"
    );

    // 3. UNSEAL Button Drops In
    tl.to(this.enterBtn, 
      { opacity: 1, scale: 1, duration: 1.5, ease: "elastic.out(1, 0.6)",
        onComplete: () => {
          this.state.isAwake = true;
        }
      }, "-=0.5"
    );
  }

  _bindEvents() {
    this.enterBtn.addEventListener('click', this._handleClick);
    this.enterBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._handleClick();
      }
    });
  }

  _handleClick() {
    if (this.state.isTransitioning || !this.state.isAwake) return;
    this.state.isTransitioning = true;

    a11yManager.announce("Seal broken. Sovereign awakened.", "assertive");

    // --- 1. THE SHATTER (DOM) ---
    // The Monolithic Name, Title, and Button blow out towards the camera
    gsap.to([this.nameChars, this.introTitle, this.enterBtn], {
      opacity: 0,
      z: 500, 
      rotationZ: () => (Math.random() - 0.5) * 30, 
      rotationX: () => (Math.random() - 0.5) * 45,
      scale: 2.0,
      filter: 'blur(20px)',
      duration: 0.9,
      stagger: 0.02,
      ease: "power3.in"
    });

    // --- 2. THE CATACLYSM STRIKE (WebGL) ---
    // Clear the haze to reveal the beast
    gsap.to(this.overlay, {
      backdropFilter: 'blur(0px)',
      webkitBackdropFilter: 'blur(0px)',
      background: 'rgba(5, 7, 10, 0.0)',
      duration: 1.2,
      delay: 0.4,
      ease: "power2.inOut",
      onStart: () => {
        // Dragon roars as the haze clears
        this.dragon?.setState('roaring');
        if (!this.isReducedMotion) this.camera?.triggerShake(2.0, 1.5); 
        
        const headPos = this.dragon?.getWorldPosition();
        
        // Trigger Lightning
        this.lightning?.triggerBurst(headPos, 6);
        
        // 🔥 ASYMMETRICAL FLAME BURST (RIGHT SIDE)
        // We pass a custom position to the flames so it erupts in the empty space
        if (this.flames && this.flames.triggerBurst) {
          const rightSidePos = new THREE.Vector3(12, -2, -2);
          this.flames.triggerBurst(300, rightSidePos);
        }
      },
      onComplete: () => {
        this.overlay.style.display = 'none'; 
        document.body.style.overflow = '';
        
        this.dragon?.setState('flying');

        // --- 3. REVEAL THE PERSISTENT UI ---
        // A. Avatar scales in
        gsap.to(this.avatarProfile, { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" });

        // B. Splinter Open the Ancient Obsidian Name Card
        this.nameCard.open();

        // C. Cascade Architecture Chips
        gsap.to(this.archChips, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          delay: 0.8, // Wait for the NameCard to begin opening
          ease: "back.out(1.2, 0.5)"
        });
      }
    });
  }

  dispose() {
    this.enterBtn?.removeEventListener('click', this._handleClick);
    gsap.killTweensOf([this.nameChars, this.introTitle, this.enterBtn, this.overlay, this.avatarProfile, this.archChips]);
    this.container.innerHTML = '';
  }
}