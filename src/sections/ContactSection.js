import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MedievalButton } from '../ui/MedievalButton.js';
import { SocialEmblems } from '../ui/SocialEmblems.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Contact Section Controller v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Event Hijacking: Intercepts the contact click to trigger a massive WebGL Climax before executing the mailto link.
 * - Reactive Hover VFX: Rolling over the contact button triggers distant lightning flashes in the 3D scene.
 * - Magitech Integration: The UI elements inherit the global subsurface magma CSS glow.
 * - Memory Safety: Full disposal pipeline for the hijacked event listeners.
 */
export class ContactSection {
  /**
   * @param {HTMLElement} container - DOM element (#contact)
   * @param {Object} data - The full portfolio data (needs profile data)
   * @param {Object} appSystems - The WebGL core systems for VFX triggers
   */
  constructor(container, data, appSystems = {}) {
    this.container = container;
    this.profileData = data.profile || {};
    
    // Bind WebGL VFX Systems
    this.dragon = appSystems.dragon || null;
    this.camera = appSystems.camera || null;
    this.lighting = appSystems.lighting || null;
    this.lightning = appSystems.lightning || null;

    this.components = {
      buttons: [],
      emblems: []
    };
    
    this.scrollTrigger = null;
    this.isReducedMotion = a11yManager.shouldReduceMotion();
    
    // Bind the hijacked click handler to the class instance
    this._handleCinematicContact = this._handleCinematicContact.bind(this);
    this._handleHoverVFX = this._handleHoverVFX.bind(this);
    
    console.log('[ContactSection] Initializing The Summit...');
  }

  init() {
    this._buildDOM();
    this._mountComponents();
    this._setupAnimations();
    this._bindVFXEvents();
  }

  _buildDOM() {
    // pointer-passthrough lets clicks hit the WebGL canvas in empty areas
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    
    const { name, email } = this.profileData;
    const firstName = name ? name.split(' ')[0] : 'Engineer';
    const currentYear = new Date().getFullYear();
    
    this.container.innerHTML = `
      <div class="container" style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100vh; justify-content: center; pointer-events: none; position: relative;">
        
        <div class="contact-header" style="margin-bottom: 5rem; pointer-events: auto;">
          <h2 class="section-title" style="font-size: clamp(2.5rem, 5vw, 4rem);">SUMMON THE KEEPER</h2>
          <div style="width: 60px; height: 2px; background: var(--color-cyan); margin: 1.5rem auto; box-shadow: 0 0 15px var(--color-cyan);"></div>
          <p style="color: var(--color-text-muted); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 3px; font-size: 0.95rem;">
            Ready to forge secure, zero-remote architectures?
          </p>
        </div>

        <div class="contact-actions" style="display: flex; flex-direction: column; gap: 4rem; align-items: center; pointer-events: auto; perspective: 1000px;">
          <div class="contact-btn-target magitech-interactive" data-email="${email}" data-name="${firstName}" style="padding: 1rem; border-radius: 50%;"></div>
          
          <div class="socials-target"></div>
        </div>

        <footer class="contact-footer" style="position: absolute; bottom: 2rem; width: 100%; text-align: center; pointer-events: auto;">
          <p style="font-family: var(--font-mono); font-size: 0.8rem; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px;">
            © ${currentYear} ${name}. Engineered for Edge Security.
          </p>
        </footer>

      </div>
    `;

    this.header = this.container.querySelector('.contact-header');
    this.btnTarget = this.container.querySelector('.contact-btn-target');
    this.socialsTarget = this.container.querySelector('.socials-target');
    this.footer = this.container.querySelector('.contact-footer');
  }

  _mountComponents() {
    const { socials } = this.profileData;
    const email = this.btnTarget.dataset.email;
    const firstName = this.btnTarget.dataset.name;

    // 1. Mount the Medieval/Magitech Wax Seal Button
    const btnEl = document.createElement('a');
    btnEl.href = `mailto:${email}?subject=Secure%20Architecture%20Inquiry&body=Hello%20${firstName},%0A%0AI'm%20interested%20in%20discussing...`;
    // We override the visual text here so it fits the new style
    btnEl.innerHTML = `<span class="seal-text">INITIATE CONTACT</span>`;
    btnEl.className = "contact-anchor-tag"; // Tagged for event hijacking
    
    this.btnTarget.appendChild(btnEl);

    const contactBtn = new MedievalButton(btnEl, {
      magneticStrength: 0.8 // High magnetic pull for the final CTA
    });
    this.components.buttons.push(contactBtn);

    // 2. Mount the Social Emblems Grid
    const emblems = new SocialEmblems(this.socialsTarget, {
      links: socials || {}
    });
    this.components.emblems.push(emblems);
  }

  _bindVFXEvents() {
    if (this.isReducedMotion) return;

    const anchor = this.btnTarget.querySelector('.contact-anchor-tag');
    if (!anchor) return;

    // Subtle Hover Effect: Flashes lightning in the background
    anchor.addEventListener('mouseenter', this._handleHoverVFX);

    // The Climax: Hijack the click to play the roar before opening email
    anchor.addEventListener('click', this._handleCinematicContact);
  }

  _handleHoverVFX() {
    // A quick, distant flash of lightning to hint at the power
    this.lighting?.triggerLightningFlash();
  }

  _handleCinematicContact(e) {
    e.preventDefault(); // Stop the mailto from firing instantly
    
    const targetHref = e.currentTarget.href;

    a11yManager.announce("Initiating contact protocol. Standby.", "assertive");

    // 1. Execute the Ultimate VFX Stack
    this.dragon?.setState('roaring');
    this.lighting?.setState('striking', { duration: 0.2 });
    this.camera?.triggerShake(2.0, 1.2); // Maximum intensity shake
    
    // Command lightning to strike exactly at the dragon's current physical position
    const dragonPos = this.dragon?.model?.position;
    this.lightning?.triggerBurst(dragonPos);

    // 2. Blast the UI backward in 3D space
    gsap.to(this.btnTarget, {
      scale: 0.8,
      filter: 'brightness(2) blur(2px)',
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });

    // 3. Release the Payload (Open the email client after the roar finishes)
    setTimeout(() => {
      window.location.href = targetHref;
      
      // Calm the dragon back down after the email opens
      setTimeout(() => {
        this.dragon?.setState('sleeping');
        this.lighting?.setState('sleeping', { duration: 2.0 });
      }, 1000);
      
    }, 800); // 800ms delay feels incredibly snappy but allows the VFX to hit hard
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.header, this.btnTarget, this.socialsTarget, this.footer], { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' });
      return;
    }

    // Set initial hidden states with 3D depth
    gsap.set(this.header, { opacity: 0, y: -50, filter: 'blur(10px)' });
    gsap.set(this.btnTarget, { opacity: 0, scale: 0.5, rotationX: 45 });
    gsap.set(this.socialsTarget, { opacity: 0, y: 40 });
    gsap.set(this.footer, { opacity: 0 });

    // ScrollTrigger to animate the UI elements in
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.container,
      start: 'top 65%',
      onEnter: () => {
        const tl = gsap.timeline();

        tl.to(this.header, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: "power3.out"
        })
        .to(this.btnTarget, {
          opacity: 1,
          scale: 1,
          rotationX: 0,
          duration: 1.2,
          ease: "elastic.out(1, 0.4)"
        }, "-=0.6")
        .to(this.socialsTarget, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.2)"
        }, "-=0.8")
        .to(this.footer, {
          opacity: 1,
          duration: 1.5,
          ease: "power2.inOut"
        }, "-=0.4");
      }
    });
  }

  dispose() {
    console.log('[ContactSection] System Disposing...');
    
    // Clean up hijacked event listeners
    const anchor = this.btnTarget.querySelector('.contact-anchor-tag');
    if (anchor) {
      anchor.removeEventListener('mouseenter', this._handleHoverVFX);
      anchor.removeEventListener('click', this._handleCinematicContact);
    }

    if (this.scrollTrigger) this.scrollTrigger.kill();
    gsap.killTweensOf([this.header, this.btnTarget, this.socialsTarget, this.footer]);
    
    this.components.buttons.forEach(c => c.dispose());
    this.components.emblems.forEach(c => c.dispose());
    
    this.components.buttons = [];
    this.components.emblems = [];
    
    this.container.innerHTML = '';
  }
}