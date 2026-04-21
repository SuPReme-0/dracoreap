import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DragonController } from '../core/dragon/DragonController.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Scroll Synchronization System v6.1 (FOOLPROOF BINDING)
 * Master Orchestrator for Magitech UI and WebGL Engine.
 * * Architectual Upgrades:
 * - Aggressive System Binding: Checks multiple variable names to guarantee connection with main.js.
 * - The Magic Link: User's scroll progress now directly scrubs the Dragon's animation timeline.
 * - Cinematic Inertia: 1.5s damped scrub keeps the massive 3D model moving smoothly.
 */
export class ScrollSync {
  constructor(appSystems = {}) {
    // CRITICAL FIX: Aggressively checks all possible names your main.js might have used
    this.systems = {
      scene: appSystems.scene || appSystems.sceneManager || null, 
      camera: appSystems.camera || appSystems.cameraController || null,
      dragon: appSystems.dragon || appSystems.dragonController || null, // <--- THE FIX IS HERE
      lighting: appSystems.lighting || appSystems.lightingSetup || null,
      environment: appSystems.environment || appSystems.environmentShader || null,
      lightning: appSystems.lightning || appSystems.lightningParticles || null,
      flames: appSystems.flames || appSystems.flameParticles || null
    };

    this.config = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      bootLockout: 1500 
    };

    this.globalProgress = 0;
    this.isLocked = true;
    this.triggers = [];

    ScrollTrigger.config({ ignoreMobileResize: true });

    this._init();
  }

  _init() {
    console.log('[ScrollSync] Cinematic Conductor Initialized. Checking Systems:');
    console.log(' - Dragon Connected:', !!this.systems.dragon); // This will now log TRUE
    console.log(' - Scene Connected:', !!this.systems.scene);

    setTimeout(() => {
      this.isLocked = false;
      console.log('[ScrollSync] Ignition Lock Released. Systems Live.');
      ScrollTrigger.refresh(); 
    }, this.config.bootLockout);

    this._setupGlobalScrub();
    this._setupSectionTriggers();
  }

  _setupGlobalScrub() {
    this.masterTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: this.config.reducedMotion ? false : 1.5, 
      onUpdate: (self) => {
        this.globalProgress = self.progress;

        if (this.systems.camera) {
          this.systems.camera.setScrollProgress(this.globalProgress);
        }

        // THE MAGIC LINK
        if (this.systems.dragon && typeof this.systems.dragon.scrubTimeline === 'function') {
          this.systems.dragon.scrubTimeline(this.globalProgress);
        }
      }
    });
  }

  _safeTrigger(selector, options) {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`[ScrollSync] Anchor ${selector} not found in DOM.`);
      return;
    }

    const wrappedOptions = { ...options };
    
    ['onEnter', 'onLeave', 'onEnterBack', 'onLeaveBack'].forEach(hook => {
      if (options[hook]) {
        wrappedOptions[hook] = (...args) => {
          if (this.isLocked) return; 
          options[hook](...args);
        };
      }
    });

    const st = ScrollTrigger.create({
      trigger: el,
      ...wrappedOptions
    });

    this.triggers.push(st);
  }

  _setupSectionTriggers() {
    // 1. INTRO -> SKILLS 
    this._safeTrigger('#skills', {
      start: 'top 60%',
      onEnter: () => {
        this.systems.dragon?.setState(DragonController.State.STRIKING);
        this.systems.lighting?.setState('striking', { duration: 1.5 });
      },
      onLeaveBack: () => {
        this.systems.dragon?.setState(DragonController.State.FLYING);
        this.systems.lighting?.setState('flying', { duration: 1.5 });
      }
    });

    // 2. SKILLS -> PROJECTS 
    this._safeTrigger('#projects', {
      start: 'top 55%',
      onEnter: () => {
        this.systems.dragon?.setState(DragonController.State.AGGRESSIVE);
        this.systems.lighting?.setState('aggressive', { duration: 1.5 });
        this.systems.lightning?.triggerBurst();
      },
      onLeaveBack: () => {
        this.systems.dragon?.setState(DragonController.State.STRIKING);
        this.systems.lighting?.setState('striking', { duration: 1.5 });
      }
    });

    // 3. PROJECTS -> ABOUT (THE CLIMAX)
    this._safeTrigger('#about', {
      start: 'top 50%', 
      onEnter: () => {
        this.systems.dragon?.setState(DragonController.State.ROARING);
        this.systems.lighting?.setState('roaring', { duration: 0.5 });
        
        if (!this.config.reducedMotion) {
          this.systems.camera?.triggerShake(1.6, 1.2);
        }
        
        if (this.systems.scene && typeof this.systems.scene.triggerAtmosphericFlash === 'function') {
          this.systems.scene.triggerAtmosphericFlash(4.0, 1.5);
        } else {
          this.systems.lighting?.triggerLightningFlash?.(); 
        }
        
        // Target VFX at Dragon
        const dragonPos = this.systems.dragon?.model?.position;
        this.systems.lightning?.triggerBurst(dragonPos);
        this.systems.flames?.triggerBurst(180); 
      },
      onLeaveBack: () => {
        this.systems.dragon?.setState(DragonController.State.AGGRESSIVE);
        this.systems.lighting?.setState('aggressive', { duration: 1.5 });
      }
    });

    // 4. ABOUT -> CONTACT 
    this._safeTrigger('#contact', {
      start: 'top 65%',
      onEnter: () => {
        this.systems.dragon?.setState(DragonController.State.SLEEPING);
        this.systems.lighting?.setState('sleeping', { duration: 2.5 });
      },
      onLeaveBack: () => {
        this.systems.dragon?.setState(DragonController.State.ROARING);
        this.systems.lighting?.setState('roaring', { duration: 1.2 });
      }
    });
  }

  refresh() {
    ScrollTrigger.refresh();
  }

  dispose() {
    this.masterTrigger?.kill();
    this.triggers.forEach(t => t.kill());
    this.triggers = [];
  }
}