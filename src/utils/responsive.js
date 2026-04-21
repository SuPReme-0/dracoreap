/**
 * Industry-Grade Hardware Governor & Responsive Manager v4.0
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectual Upgrades:
 * - Thermal Throttling Prevention: Aggressive devicePixelRatio capping for high-DPI mobile screens.
 * - Synced VFX Limits: Particle thresholds aligned perfectly with InstancedMesh (Flames v6) and LineSegments (Lightning v4).
 * - Memory-Safe Profiling: Handles edge cases where navigator.deviceMemory is undefined (Firefox/Safari).
 * - Debounce Optimization: Clean layout shift broadcasting to prevent DOM thrashing on orientation change.
 */
class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
    };

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      orientation: 'landscape',
      qualityTier: 'high', // Automatically recalculated on init
    };

    // Hardware profiling via browser APIs (with safe fallbacks)
    this.hardware = {
      cores: navigator.hardwareConcurrency || 4,
      // deviceMemory is Chrome/Edge only. Fallback to 4GB if unknown.
      memory: navigator.deviceMemory || 4, 
      isAppleMobile: /iPhone|iPad|iPod/i.test(navigator.userAgent)
    };

    this._subscribers = [];
    this._resizeTimeout = null;

    // Cache bound methods
    this._handleResize = this._handleResize.bind(this);

    this._init();
  }

  _init() {
    this._detectTouch();
    this._calculateViewport();
    this.state.qualityTier = this._calculateOptimalQualityTier();

    // Listen for layout shifts
    window.addEventListener('resize', this._handleResize, { passive: true });
    window.addEventListener('orientationchange', this._handleResize, { passive: true });

    console.log(`[Hardware Governor] Profile: ${this.hardware.cores} Cores, ~${this.hardware.memory}GB RAM.`);
    console.log(`[Hardware Governor] WebGL Tier Locked: [${this.state.qualityTier.toUpperCase()}]`);
  }

  /**
   * Evaluates hardware limits and assigns a safe WebGL quality tier.
   * Prioritizes thermal management and stable 60 FPS over raw resolution.
   * @returns {string} 'low', 'medium', 'high', or 'ultra'
   */
  _calculateOptimalQualityTier() {
    const { cores, memory, isAppleMobile } = this.hardware;
    const { isMobile, width } = this.state;

    // ULTRA: High-end workstations
    if (!isMobile && cores >= 8 && memory >= 8 && width >= 1920) {
      return 'ultra';
    }
    
    // HIGH: Standard laptops and capable desktops
    if (!isMobile && cores >= 4 && memory >= 4) {
      return 'high';
    }

    // MEDIUM: Modern smartphones (Apple A-series chips) and older laptops
    if (isAppleMobile || (cores >= 4 && memory >= 4)) {
      return 'medium';
    }

    // LOW: Budget mobile devices, low-RAM tablets, heavy thermal constraints
    return 'low';
  }

  _detectTouch() {
    this.state.hasTouch = (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  _calculateViewport() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.state.width = w;
    this.state.height = h;
    this.state.orientation = w > h ? 'landscape' : 'portrait';

    this.state.isMobile = w <= this.breakpoints.mobile;
    this.state.isTablet = w > this.breakpoints.mobile && w <= this.breakpoints.tablet;
    this.state.isDesktop = w > this.breakpoints.tablet;
  }

  _handleResize() {
    // 150ms debounce prevents executing expensive layout math while the user is actively dragging the window
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    
    this._resizeTimeout = setTimeout(() => {
      const prevMobile = this.state.isMobile;
      const prevOrientation = this.state.orientation;

      this._calculateViewport();

      // Only flag a 'majorShift' if the UI needs to fundamentally restructure
      const majorShift = (prevMobile !== this.state.isMobile) || (prevOrientation !== this.state.orientation);

      this._notifySubscribers({
        ...this.state,
        majorShift
      });
    }, 150);
  }

  /**
   * Generates the master configuration object consumed by the SceneManager and VFX Controllers.
   */
  getSystemConfig() {
    const tier = this.state.qualityTier;
    const isLow = tier === 'low';
    const isMedium = tier === 'medium';
    const isUltra = tier === 'ultra';

    return {
      qualityTier: tier,
      
      // Post-Processing & Shadows
      enablePostProcessing: !isLow, 
      enableShadows: !isLow,
      
      // CRITICAL: GPU Thermal Management (High-DPI Mobile Defense)
      // Capping mobile pixel ratios prevents exponential rendering overhead
      pixelRatioCap: isLow ? 1.0 : (isMedium ? 1.5 : (isUltra ? 2.0 : 1.5)),

      // Synced VFX Limitations (Mapped to FlameParticles v6.0 and LightningParticles v4.0)
      flameParticleCount: isLow ? 150 : (isMedium ? 250 : (isUltra ? 400 : 350)),
      maxLightningSegments: isLow ? 500 : (isMedium ? 1000 : 2000),

      // UI/UX Modifiers
      isTouchDevice: this.state.hasTouch
    };
  }

  /**
   * Subscribe to debounced resize/layout events
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this._subscribers.push(callback);
    // Immediately fire with current state to hydrate components on mount
    callback(this.state);
    
    return () => {
      this._subscribers = this._subscribers.filter(cb => cb !== callback);
    };
  }

  _notifySubscribers(data) {
    this._subscribers.forEach(cb => {
      try { cb(data); } catch (e) { console.error('[ResponsiveManager] Subscriber Error:', e); }
    });
  }

  dispose() {
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('orientationchange', this._handleResize);
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._subscribers = [];
  }
}

// Export as a singleton
export const responsiveManager = new ResponsiveManager();