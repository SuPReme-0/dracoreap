import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Industry-Grade Dynamic Lighting Controller v6.0 (CATACLYSM PROTOCOL)
 * * Architectual Upgrades:
 * - Environment Sync: Lighting perfectly matches the Crimson Rift sky and Navy Abyss ocean.
 * - Dual-Tone Tracing: Dragon is rim-lit by Electric Cyan (storm) and Searing Crimson (sky cracks).
 * - Ocean Reflection Pulses: Ground lights simulate the red sky reflecting off the turbulent water.
 * - Violent Thunder Overrides: Lightning strikes temporarily wash out the red ambient light with blinding cyan.
 */
export class LightingSetup {
  static StatePresets = {
    // 1. INTRO: Ensures perfect visibility of the dragon against the dark UI
    sleeping: {
      ambient: 1.0,       
      key: 1.5,           
      rim: 2.0,           
      turbulence: 0.1,    // Calm water reflection
      shadowIntensity: 0.4,
      colorTemp: 6500     
    },
    // 2. THE DESCENT: Plunging into the cataclysm
    waking: {
      ambient: 0.5,
      key: 1.0,
      rim: 2.5,           
      turbulence: 0.4,
      shadowIntensity: 0.6,
      colorTemp: 7500     
    },
    // 3. THE RAGING STORM: Dark ocean, heavy red/blue contrast
    flying: {
      ambient: 0.2,      
      key: 0.6,           
      rim: 3.5,           // Strong Cyan rim to protect silhouette against the dark sky
      turbulence: 0.8,    // Water is choppy, reflecting the red sky heavily
      shadowIntensity: 0.8,
      colorTemp: 10000    
    },
    // 4. THE ANTICIPATION: The calm darkness before the strike
    striking: {
      ambient: 0.05,      // Almost pure darkness
      key: 0.2,
      rim: 4.5,           
      turbulence: 0.4,
      shadowIntensity: 1.0,
      colorTemp: 12000
    },
    // 5. THE CLIMAX: Roar and massive water turbulence
    roaring: {
      ambient: 0.3,
      key: 1.5,
      rim: 5.0,
      turbulence: 2.5,    // Ocean churns violently, massive red reflections
      shadowIntensity: 1.0,
      colorTemp: 8000
    },
    aggressive: {
      ambient: 0.3,
      key: 2.5,
      rim: 6.0,           
      turbulence: 1.5,
      shadowIntensity: 1.0,
      colorTemp: 11000
    }
  };

  constructor(scene, options = {}) {
    this.scene = scene;
    
    this.config = {
      qualityTier: options.qualityTier || 'high',
      enableShadows: options.enableShadows ?? true,
      lightningFlashDuration: options.lightningFlashDuration ?? 1.2,
      enableColorTempShift: options.enableColorTempShift ?? true,
      ...options
    };

    this.lights = {
      ambient: null,
      key: null,
      riftFill: null, // New: Crimson light from the sky cracks
      rim: null,
      oceanGlow: [],  // Repurposed from lavaGlow
      dragonGlow: null
    };

    // Base targets for GSAP
    this.baseIntensities = { turbulence: 0 };
    
    // PUBLIC EXPORTS FOR SHADER/VFX SYNCING
    this.globalFlashState = { value: 0.0 }; 
    this.currentLavaIntensity = 0.0; // Kept named 'Lava' to prevent breaking ScrollSync/Environment wiring

    this.currentState = 'sleeping';
    this.lightningActive = false;

    this._eventListeners = {};
    this.update = this.update.bind(this);
    this.triggerLightningFlash = this.triggerLightningFlash.bind(this);

    console.log('[LightingSetup] Cataclysm Protocol Master Lighting Initialized');
  }

  setup() {
    this._createAmbient();
    this._createKeyLight();
    this._createRiftFillLight();
    this._createRimLight();
    this._createOceanGlows();
    this._createDragonGlow();
    this._applyQualityTier();
    
    this.setState('sleeping', { duration: 0 }); 
  }

  _createAmbient() {
    // Top: Crimson Void (0x2a0810) | Bottom: Navy Abyss (0x020a15)
    // This immediately places the dragon IN the environment
    this.lights.ambient = new THREE.HemisphereLight(0x2a0810, 0x020a15, 0.8);
    this.lights.ambient.name = 'CataclysmHemisphere';
    this.scene.add(this.lights.ambient);
  }

  _createKeyLight() {
    this.lights.key = new THREE.DirectionalLight(0x88ccff, 2.0); // Cold storm moonlight
    this.lights.key.name = 'StormMoonKey';
    this.lights.key.position.set(-15, 30, 20);
    this.lights.key.castShadow = this.config.enableShadows;
    
    if (this.config.enableShadows) {
      this.lights.key.shadow.mapSize.set(2048, 2048);
      this.lights.key.shadow.camera.near = 0.5;
      this.lights.key.shadow.camera.far = 100;
      
      const d = 20;
      this.lights.key.shadow.camera.left = -d;
      this.lights.key.shadow.camera.right = d;
      this.lights.key.shadow.camera.top = d;
      this.lights.key.shadow.camera.bottom = -d;
      this.lights.key.shadow.bias = -0.0005;
      this.lights.key.shadow.normalBias = 0.05; 
    }
    this.scene.add(this.lights.key);
  }

  _createRiftFillLight() {
    // Searing Crimson light hitting the dragon from the top/right to simulate the sky cracks
    this.lights.riftFill = new THREE.DirectionalLight(0xff1133, 1.0); 
    this.lights.riftFill.name = 'CrimsonRiftFill';
    this.lights.riftFill.position.set(15, 20, -10);
    this.scene.add(this.lights.riftFill);
  }

  _createRimLight() {
    // Electric Cyan tracing the dragon from behind so it never disappears
    this.lights.rim = new THREE.DirectionalLight(0x00aaff, 2.0); 
    this.lights.rim.name = 'ThunderRim';
    this.lights.rim.position.set(-10, 0, -25);
    this.scene.add(this.lights.rim);
  }

  _createOceanGlows() {
    for (let i = 0; i < 3; i++) {
      // Simulating the red sky reflecting off the dark navy waves below
      const glow = new THREE.PointLight(0x880011, 0.5, 40, 2.0);
      glow.name = `OceanReflection_${i}`;
      glow.position.set((i - 1) * 15, -12, 5);
      glow.castShadow = false;
      this.lights.oceanGlow.push(glow);
      this.scene.add(glow);
    }
  }

  _createDragonGlow() {
    // Spine lighting
    this.lights.dragonGlow = new THREE.PointLight(0x0088ff, 0.0, 20, 2);
    this.lights.dragonGlow.name = 'SpineLightningGlow';
    this.lights.dragonGlow.castShadow = false;
    this.scene.add(this.lights.dragonGlow);
  }

  _applyQualityTier() {
    const tier = this.config.qualityTier;
    if (tier === 'low') {
      this.config.enableShadows = false;
      if (this.lights.key) this.lights.key.castShadow = false;
      this.lights.oceanGlow.slice(1).forEach(l => l.visible = false);
    } else if (tier === 'medium') {
      if (this.lights.key) this.lights.key.shadow.mapSize.set(1024, 1024);
      this.lights.oceanGlow.slice(2).forEach(l => l.visible = false);
    }
  }

  setState(state, options = {}) {
    if (this.currentState === state && options.duration !== 0) return;
    const preset = LightingSetup.StatePresets[state];
    if (!preset) return;

    const prev = this.currentState;
    this.currentState = state;
    const duration = options.duration ?? 1.5;
    const ease = options.ease || 'power2.inOut';

    gsap.killTweensOf([
      this.lights.ambient, 
      this.lights.key, 
      this.lights.riftFill, 
      this.lights.rim,
      this.baseIntensities
    ]);

    gsap.to(this.lights.ambient, { intensity: preset.ambient, duration, ease });
    gsap.to(this.lights.key, { intensity: preset.key, duration, ease });
    
    // The Crimson Rift dims when the moon gets bright, and intensifies when the storm gets dark
    gsap.to(this.lights.riftFill, { intensity: Math.max(0.5, preset.shadowIntensity * 1.5), duration, ease });
    gsap.to(this.lights.rim, { intensity: preset.rim, duration, ease });
    
    gsap.to(this.baseIntensities, { turbulence: preset.turbulence, duration, ease });

    if (this.config.enableColorTempShift) {
      const color = this._tempToRGB(preset.colorTemp);
      gsap.to(this.lights.key.color, {
        r: color.r, g: color.g, b: color.b,
        duration: duration * 0.8, ease
      });
    }

    this._emit('stateChange', { state, prev });
  }

  triggerLightningFlash() {
    if (this.lightningActive) return;
    this.lightningActive = true;

    const preset = LightingSetup.StatePresets[this.currentState];
    const baseKeyInt = preset.key;
    const peakKeyInt = baseKeyInt + 15.0; // Violent flash

    const tl = gsap.timeline({
      onComplete: () => { this.lightningActive = false; }
    });

    // 1. The Pre-strikes (Rapid flickering)
    tl.to(this.lights.key, { intensity: peakKeyInt * 0.4, duration: 0.05, ease: "none" })
      .to(this.lights.key, { intensity: 0, duration: 0.05, ease: "none" })
      .to(this.lights.key, { intensity: peakKeyInt * 0.7, duration: 0.03, ease: "none" })
      .to(this.lights.key, { intensity: 0, duration: 0.05, ease: "none" });

    // 2. The Main Strike (Violent Navy/Cyan Override)
    // Momentarily override the crimson rift so the lightning feels blindingly bright
    tl.to(this.lights.riftFill.color, { r: 0.2, g: 0.8, b: 1.0, duration: 0.05 }, "<");
    tl.to(this.lights.key.color, { r: 0.2, g: 0.8, b: 1.0, duration: 0.05 }, "<");
    
    tl.to(this.lights.key, { intensity: peakKeyInt, duration: 0.08, ease: "power4.out" });
    
    // SYNC: Push the global proxy to 1.0 for the EnvironmentShader to read
    tl.to(this.globalFlashState, { value: 1.0, duration: 0.08, ease: "power4.out" }, "<");

    tl.to([this.lights.ambient, this.lights.riftFill, this.lights.rim], {
      intensity: (i, obj) => obj.intensity * 3.5,
      duration: 0.08,
      ease: "power2.out",
    }, "<");

    // 3. The Exponential Decay
    tl.to(this.lights.key, { intensity: preset.key, duration: this.config.lightningFlashDuration, ease: "expo.out" });
    
    // Return to the proper colors
    const baseColor = this._tempToRGB(preset.colorTemp);
    tl.to(this.lights.key.color, { r: baseColor.r, g: baseColor.g, b: baseColor.b, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    tl.to(this.lights.riftFill.color, { r: 1.0, g: 0.06, b: 0.2, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<"); // Return to crimson
    
    tl.to(this.lights.ambient, { intensity: preset.ambient, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    tl.to(this.lights.riftFill, { intensity: Math.max(0.5, preset.shadowIntensity * 1.5), duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    tl.to(this.lights.rim, { intensity: preset.rim, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    
    // SYNC: Fade the shader flash back to 0.0
    tl.to(this.globalFlashState, { value: 0.0, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");

    if (this.lights.dragonGlow) {
      gsap.fromTo(this.lights.dragonGlow, 
        { intensity: 10.0 }, 
        { intensity: 0, duration: 0.8, ease: "expo.out" }
      );
    }

    this._emit('lightningFlash', { timestamp: performance.now() });
  }

  update(delta, context = {}) {
    const time = context.time || performance.now() * 0.001;
    
    // Procedural Ocean Shimmering
    this.lights.oceanGlow.forEach((light, i) => {
      if (!light.visible) return;
      const phaseOffset = i * 3.14; 
      // Faster, choppier wave reflections
      const waves = Math.sin(time * 2.5 + phaseOffset) * 0.4; 
      const finalIntensity = Math.max(0, this.baseIntensities.turbulence + waves);
      
      light.intensity = finalIntensity;
      
      // Store the average for the Environment Shader's uOceanIntensity
      if (i === 1) this.currentLavaIntensity = finalIntensity;
    });

    // Dynamic Target Tracking
    if (context.dragonPosition) {
      if (this.lights.dragonGlow) {
        this.lights.dragonGlow.position.lerp(context.dragonPosition, 0.2);
      }
      
      if (this.lights.key.castShadow && this.lights.key.target) {
        this.lights.key.target.position.lerp(context.dragonPosition, 0.1);
        this.lights.key.target.updateMatrixWorld();
      }
    }
  }

  setQualityTier(tier) {
    this.config.qualityTier = tier;
    this._applyQualityTier();
  }

  _tempToRGB(temp) {
    const t = temp / 100;
    let r, g, b;
    if (t <= 66) {
      r = 255; 
      g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(t) - 161.1195681661));
      b = t <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(t - 10) - 305.0447927307));
    } else {
      r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(t - 60, -0.1332047592)));
      g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(t - 60, -0.0755148492)));
      b = 255;
    }
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => {
      try { cb(data); } catch(e) { console.error(e); }
    });
  }

  on(event, cb) {
    if (!this._eventListeners[event]) this._eventListeners[event] = [];
    this._eventListeners[event].push(cb);
    return () => {
      this._eventListeners[event] = this._eventListeners[event].filter(c => c !== cb);
    };
  }

  dispose() {
    gsap.killTweensOf([
      this.lights.ambient, 
      this.lights.key, 
      this.lights.riftFill, 
      this.lights.rim,
      this.baseIntensities,
      this.globalFlashState
    ]);
    if (this.lights.dragonGlow) gsap.killTweensOf(this.lights.dragonGlow);
    if (this.lights.key?.color) gsap.killTweensOf(this.lights.key.color);
    if (this.lights.riftFill?.color) gsap.killTweensOf(this.lights.riftFill.color);

    Object.values(this.lights).forEach(l => {
      if (Array.isArray(l)) {
        l.forEach(subLight => this.scene.remove(subLight));
      } else if (l?.isLight) {
        this.scene.remove(l);
      }
    });
    
    this.lights = { oceanGlow: [] };
    this._eventListeners = {};
  }
}