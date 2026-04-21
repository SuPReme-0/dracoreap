import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Live Project Preview Frame v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Bulletproof Sandboxing: Added strict protocol flags to prevent Chrome console spam.
 * - Memory Leak Fix: Properly cached bound event listeners for clean garbage collection.
 * - Magitech Boot Sequence: Iframe flickers to life like a CRT terminal.
 * - Anti-Trap UX: Added 'Escape' key listener to quickly exit interactive mode.
 */
export class LivePreviewFrame {
  constructor(element, options = {}) {
    this.container = element;
    this.config = {
      project: options.project || {},
      enableLazyLoad: options.enableLazyLoad ?? true,
      fallbackOnMobile: options.fallbackOnMobile ?? true,
      ...options
    };
    
    this.isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.isActive = false; 
    this.observer = null;

    this.iframe = null;
    this.overlay = null;
    this.loader = null;

    // Cache bound methods to prevent memory leaks during add/removeEventListener
    this._onIframeLoad = this._onIframeLoad.bind(this);
    this._enableInteraction = this._enableInteraction.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);

    this.init();
  }

  init() {
    this.container.classList.add('live-preview-container');
    
    // Always use fallback on mobile to save battery and prevent catastrophic scroll traps
    if (this.config.fallbackOnMobile && this.isMobile) {
      this._renderFallback();
      return;
    }

    if (this.config.enableLazyLoad) {
      this._setupLazyLoad();
    } else {
      this._buildDOM();
    }
  }

  _setupLazyLoad() {
    // Boot the iframe when it comes within 400px of the viewport
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this._buildDOM();
        this.observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    
    this.observer.observe(this.container);
  }

  _buildDOM() {
    const { project } = this.config;
    const previewUrl = project.preview_url || project.site_url;
    
    if (!previewUrl) {
      this._renderFallback();
      return;
    }

    this.container.innerHTML = '';
    
    // Base styling for the container to act as a window
    Object.assign(this.container.style, {
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(0, 255, 255, 0.15)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
      backgroundColor: '#020204',
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease'
    });

    // 1. The Iframe (Hidden and locked initially)
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'obsidian-iframe';
    this.iframe.title = `${project.title} Live Environment`;
    this.iframe.loading = 'lazy';
    
    // STRICT SANDBOX: Crucial for preventing the "Navigation to external protocol blocked" error
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
    
    Object.assign(this.iframe.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      border: 'none',
      opacity: '0',
      pointerEvents: 'none', // PREVENTS SCROLL TRAPPING
    });

    // 2. The Loading State (Terminal Aesthetic)
    this.loader = document.createElement('div');
    this.loader.className = 'obsidian-loader';
    Object.assign(this.loader.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      color: 'var(--color-cyan)',
      fontSize: '0.9rem',
      letterSpacing: '2px',
      zIndex: '5'
    });
    this.loader.innerHTML = `> ESTABLISHING SECURE CONNECTION<span class="cursor-blink">_</span>`;

    // 3. The Glassmorphic Overlay (Protects against accidental scrolls)
    this.overlay = document.createElement('div');
    this.overlay.className = 'preview-overlay';
    Object.assign(this.overlay.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(5, 5, 8, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: '0', // Hidden until load finishes
      zIndex: '10',
      transition: 'backdrop-filter 0.4s ease'
    });

    this.overlay.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <button class="interact-btn" style="background: rgba(0, 255, 255, 0.1); border: 1px solid var(--color-cyan); color: var(--color-cyan); padding: 0.8rem 1.5rem; font-family: var(--font-mono); text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: all 0.3s ease;">
          [ INITIALIZE INTERFACE ]
        </button>
        <a href="${project.site_url}" target="_blank" rel="noopener noreferrer" style="color: #fff; font-family: var(--font-body); font-size: 0.9rem; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 2px;">
          Deploy Externally ↗
        </a>
      </div>
    `;

    // Append in correct Z-order
    this.container.appendChild(this.iframe);
    this.container.appendChild(this.loader);
    this.container.appendChild(this.overlay);

    // Bind Listeners
    this.iframe.addEventListener('load', this._onIframeLoad);
    const interactBtn = this.overlay.querySelector('.interact-btn');
    interactBtn.addEventListener('click', this._enableInteraction);
    
    // Append to DOM to trigger the load
    this.iframe.src = previewUrl;
  }

  _onIframeLoad() {
    const tl = gsap.timeline();
    
    // Fade out terminal loader
    tl.to(this.loader, { opacity: 0, duration: 0.2, onComplete: () => this.loader.remove() });
    
    // Magitech CRT Flicker Entrance
    tl.to(this.iframe, { opacity: 0.5, duration: 0.05, ease: "none" })
      .to(this.iframe, { opacity: 0.2, duration: 0.05, ease: "none" })
      .to(this.iframe, { opacity: 0.8, duration: 0.05, ease: "none" })
      .to(this.iframe, { opacity: 1.0, duration: 0.1, ease: "power2.out" });
      
    // Fade in the protective glass overlay
    tl.to(this.overlay, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.1");
  }

  _enableInteraction() {
    if (this.isActive) return;
    this.isActive = true;

    // Melt away the glass overlay
    gsap.to(this.overlay, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: () => {
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.backdropFilter = 'blur(0px)';
      }
    });

    // Unlock the iframe for scrolling
    this.iframe.style.pointerEvents = 'auto';
    
    // Activate the Magitech borders
    this.container.style.borderColor = 'rgba(0, 255, 255, 0.8)';
    this.container.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.2), inset 0 0 15px rgba(0, 255, 255, 0.1)';

    // Listen for exit intents
    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  _disableInteraction() {
    if (!this.isActive) return;
    this.isActive = false;

    // Lock the iframe again
    this.iframe.style.pointerEvents = 'none';
    
    // Bring back the protective glass
    this.overlay.style.pointerEvents = 'auto';
    this.overlay.style.backdropFilter = 'blur(8px)';
    gsap.to(this.overlay, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.in'
    });

    // Cool down the borders
    this.container.style.borderColor = 'rgba(0, 255, 255, 0.15)';
    this.container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.8)';

    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  _handleOutsideClick(e) {
    if (this.isActive && !this.container.contains(e.target)) {
      this._disableInteraction();
    }
  }

  _handleKeyDown(e) {
    if (this.isActive && e.key === 'Escape') {
      this._disableInteraction();
    }
  }

  _renderFallback() {
    const { project } = this.config;
    this.container.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <img src="${project.thumbnail_url || '/assets/images/placeholder.webp'}" 
             alt="${project.title} Preview" 
             loading="lazy"
             style="width: 100%; height: 100%; object-fit: cover; opacity: 0.6;">
        
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(5,5,8,0.5);">
          <a href="${project.site_url}" target="_blank" rel="noopener noreferrer" 
             style="background: #000; border: 1px solid var(--color-cyan); color: var(--color-cyan); padding: 0.8rem 1.5rem; font-family: var(--font-mono); text-decoration: none; border-radius: 4px; text-transform: uppercase;">
            Open Project ↗
          </a>
        </div>
      </div>
    `;
  }

  dispose() {
    this.observer?.disconnect();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.iframe) this.iframe.removeEventListener('load', this._onIframeLoad);
    
    gsap.killTweensOf([this.overlay, this.loader, this.iframe]);
    this.container.innerHTML = '';
  }
}