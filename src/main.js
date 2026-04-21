import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 1. Utilities & Managers
import { dataManager } from './utils/jsonLoader.js';
import { responsiveManager } from './utils/responsive.js';
import { ScrollSync } from './utils/scrollSync.js';

// 2. WebGL Core Systems
import { SceneManager } from './core/scene/SceneManager.js';
import { LightingSetup } from './core/scene/LightingSetup.js';
import { CameraController } from './core/camera/CameraController.js';
import { DragonController } from './core/dragon/DragonController.js';
import { FlameParticles } from './core/particles/FlameParticles.js';
import { LightningParticles } from './core/particles/LightningParticles.js';

// 3. DOM Section Controllers
import { IntroSection } from './sections/IntroSection.js';
import { SkillsSection } from './sections/SkillsSection.js';
import { ProjectsSection } from './sections/ProjectsSection.js';
import { AboutSection } from './sections/AboutSection.js';
import { ContactSection } from './sections/ContactSection.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Obsidian Tempest Application Core v17.0 (THE SOVEREIGN ORCHESTRATOR)
 * Master Orchestrator for Magitech UI and WebGL Engine.
 */
class App {
  constructor() {
    this.systems = {};
    this.sections = {};
    this.data = null;
    
    this._renderLoop = this._renderLoop.bind(this);
  }

  async boot() {
    // FORCE RESET: Kill browser scroll memory to prevent GSAP state cascades
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    console.log('⚡ IGNITING OBSIDIAN TEMPEST ARCHITECTURE ⚡');
    
    try {
      const sysConfig = responsiveManager.getSystemConfig();
      this.data = await dataManager.load('/data/portfolio_data.json');
      
      this._injectGlobalFX(); // Inject the CSS for the screen flash

      // 1. Initialize Master Scene (The World)
      this.systems.sceneManager = new SceneManager('#webgl-canvas', {
        quality: sysConfig.qualityTier,
        enablePostProcessing: sysConfig.enablePostProcessing,
        enableShadows: sysConfig.enableShadows
      });
      await this.systems.sceneManager.setup();

      const coreScene = this.systems.sceneManager.scene;
      const coreCamera = this.systems.sceneManager.camera;
      this.systems.environment = this.systems.sceneManager.environment;

      // 2. Initialize Lighting
      this.systems.lighting = new LightingSetup(coreScene, sysConfig);
      this.systems.lighting.setup();

      // 3. 🐉 Initialize the Dragon (v17.0 Obsidian Apex)
      this.systems.dragon = new DragonController(coreScene, {
        modelPath: '/assets/models/dragon.glb',
        targetSize: 14,
        basePosition: new THREE.Vector3(0, 0, -2),
        zoomPosition: new THREE.Vector3(0, 0.5, 4), 
        enableLightning: true,
        enableSparks: true,
        enableFlame: true,
        enableEnvReflection: true // Crucial for PBR Scales
      });

      // 4. Initialize External Particle Systems
      this.systems.flames = new FlameParticles(coreScene, sysConfig);
      this.systems.lightning = new LightningParticles(coreScene, sysConfig);

      // 5. 🔌 Bind VFX Callbacks (Wiring the Dragon to the World)
      this.systems.dragon.bindLightningCallback((pos, target, options) => {
        const intensity = options?.intensity || 1.0;
        // 2D Sky Lightning
        if (this.systems.sceneManager.triggerSkyLightning) {
          this.systems.sceneManager.triggerSkyLightning(pos, 1);
        }
        // 3D Volumetric Lightning
        if (this.systems.lightning && this.systems.lightning.triggerBurst) {
          this.systems.lightning.triggerBurst(intensity * 6, pos); 
        }
      });

      this.systems.dragon.bindFlashCallback((intensity, dur) => {
        // WebGL HDR ToneMapping Flash
        if (this.systems.sceneManager.triggerAtmosphericFlash) {
          this.systems.sceneManager.triggerAtmosphericFlash(intensity * 0.6, dur);
        }
        // CSS DOM Screen Flash
        document.body.classList.add('flash');
        setTimeout(() => document.body.classList.remove('flash'), dur * 1000);
      });

      this.systems.dragon.bindExternalFlameCallback((count) => {
        if (this.systems.flames && this.systems.flames.triggerBurst) {
          this.systems.flames.triggerBurst(count);
        }
      });

      // Await the heavy asset loading
      await this.systems.dragon.load();

      // 6. Initialize Cinematic Camera
      this.systems.camera = new CameraController(coreCamera, sysConfig);

      // 7. Master Scroll Conductor
      this.systems.scrollSync = new ScrollSync({
        sceneManager: this.systems.sceneManager, 
        cameraController: this.systems.camera,
        dragonController: this.systems.dragon,
        lightingSetup: this.systems.lighting,
        environmentShader: this.systems.environment,
        lightningParticles: this.systems.lightning,
        flameParticles: this.systems.flames
      });

      // 8. 🗺️ Map Scroll Sections to Dragon Animation Clips
      this._wireAnimationClipping();

      // 9. Mount DOM Sections
      this._mountSections();

      // 10. Start the Unified Render Loop
      requestAnimationFrame(this._renderLoop);

      // 11. Clear UI Blockers & Arm the Scene
      setTimeout(() => {
        this._removeLoader();
        this.systems.scrollSync.refresh();
      }, 1000);

    } catch (error) {
      console.error('❌ CRITICAL SYSTEM FAILURE:', error);
      const errorMsg = error.stack || error.message;
      
      document.body.innerHTML = `
        <div style="color:#00ffff; padding: 2rem; font-family: monospace; background: #010204; height: 100vh; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 1.5rem; z-index: 99999; position: relative;">
          <h2 style="color:#ff1133; border-bottom: 1px solid #ff1133; padding-bottom: 0.5rem;">CORE OVERHEAT: SYSTEM BOOT FAILURE</h2>
          <pre style="white-space: pre-wrap; background: rgba(0,255,255,0.05); padding: 1rem; border-radius: 4px; max-width: 800px; line-height: 1.5;">${errorMsg}</pre>
          <button onclick="location.reload()" style="background:rgba(0,255,255,0.1); color:#00ffff; border:1px solid #00ffff; padding:10px 20px; cursor:pointer; font-family: monospace; text-transform: uppercase; transition: all 0.3s ease;">Re-Initialize Protocol</button>
        </div>
      `;
    }
  }

  /**
   * Injects the global CSS required for the Lightning Screen Flash effect
   */
  _injectGlobalFX() {
    if (!document.getElementById('global-vfx')) {
      const style = document.createElement('style');
      style.id = 'global-vfx';
      style.innerHTML = `
        body.flash { animation: dom-flash 0.15s ease-out; }
        @keyframes dom-flash {
          0% { box-shadow: inset 0 0 0 100vmax rgba(255, 255, 255, 0); }
          50% { box-shadow: inset 0 0 0 100vmax rgba(0, 229, 255, 0.15); }
          100% { box-shadow: inset 0 0 0 100vmax rgba(255, 255, 255, 0); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Listens to the ScrollSync system and tells the Dragon to crossfade 
   * to the correct animation timeline segment based on the active HTML section.
   */
  _wireAnimationClipping() {
    if (!this.systems.scrollSync || !this.systems.dragon) return;

    if (typeof this.systems.scrollSync.on === 'function') {
      this.systems.scrollSync.on('sectionEnter', ({ sectionId }) => {
        const validSections = ['intro', 'skills', 'projects', 'about', 'contact'];
        
        if (validSections.includes(sectionId)) {
          // Slow down the animation slightly during the 'about' section for dramatic effect
          const timeScale = (sectionId === 'about') ? 0.85 : 1.0;
          
          this.systems.dragon.setSection(sectionId, { 
            timeScale: timeScale, 
            loop: true 
          });
        }
      });
    }
  }

  _mountSections() {
    const appSystems = {
      dragon: this.systems.dragon,
      camera: this.systems.camera,
      lighting: this.systems.lighting,
      lightning: this.systems.lightning,
      flames: this.systems.flames,
      scrollSync: this.systems.scrollSync
    };

    // Pass the entire AppSystems object to the DOM sections so they can trigger WebGL events (like the IntroSection unseal)
    if (document.getElementById('intro')) this.sections.intro = new IntroSection(document.getElementById('intro'), this.data.profile, appSystems);
    if (document.getElementById('skills')) this.sections.skills = new SkillsSection(document.getElementById('skills'), this.data.skills);
    if (document.getElementById('projects')) this.sections.projects = new ProjectsSection(document.getElementById('projects'), this.data.projects, appSystems);
    if (document.getElementById('about')) this.sections.about = new AboutSection(document.getElementById('about'), this.data);
    if (document.getElementById('contact')) this.sections.contact = new ContactSection(document.getElementById('contact'), this.data, appSystems);

    Object.values(this.sections).forEach(section => {
      if (section && typeof section.init === 'function') section.init();
    });
    
    setTimeout(() => ScrollTrigger.refresh(), 200);
  }

  _removeLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
      gsap.to(loader, {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.inOut',
        onComplete: () => loader.remove()
      });
    }
  }

  _renderLoop(timestamp) {
    requestAnimationFrame(this._renderLoop);

    const delta = this.systems.sceneManager.clock.getDelta();
    const elapsed = this.systems.sceneManager.clock.getElapsedTime();

    // 1. Tick the Dragon
    if (this.systems.dragon) {
      this.systems.dragon.update(delta, elapsed, { cameraPosition: this.systems.sceneManager.camera.position });
      
      // Feed the dragon's live position to the SceneManager for water reflections
      const dragonPos = this.systems.dragon.getWorldPosition();
      if (this.systems.sceneManager.updateDragonTracking) {
        this.systems.sceneManager.updateDragonTracking(dragonPos);
      }
    }

    // 2. Tick the External Systems
    if (this.systems.camera) {
      this.systems.camera.update(delta, elapsed);
    }

    if (this.systems.lighting) {
      const dragonPos = this.systems.dragon?.model?.position;
      this.systems.lighting.update(delta, { dragonPosition: dragonPos, time: elapsed });
    }

    if (this.systems.flames) {
      this.systems.flames.update(delta, { dragonPosition: this.systems.dragon?.getWorldPosition() });
    }

    if (this.systems.lightning) {
      this.systems.lightning.update(delta, { stormIntensity: 0.7 });
    }

    // 3. Render the Unified Scene
    this.systems.sceneManager.render();
  }
}

// Ignition
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.boot();
});