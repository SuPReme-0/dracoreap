import * as THREE from 'three';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

import { EnvironmentShader } from './EnvironmentShader.js'; 

/* ─── Embedded Sky Lightning (Sparse & Powerful) ─────────────────────────── */
const ENV = {
  background: 0x03020a,
  fog:        0x05030e,
  lightning:  {
    core: new THREE.Color(0xe0f7ff),
    edge: new THREE.Color(0x0033ff),
  },
};

class SkyLightning {
  constructor(scene) {
    this.scene   = scene;
    this.maxSegs = 1000; 
    const mv     = this.maxSegs * 2;

    this._pos  = new Float32Array(mv * 3).fill(0);
    this._life = new Float32Array(mv).fill(0);
    this._int  = new Float32Array(mv).fill(0);
    this._seed = new Float32Array(mv).fill(0);
    for (let i = 0; i < mv; i++) this._pos[i*3+1] = -99999;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',   new THREE.BufferAttribute(this._pos,  3));
    geo.setAttribute('aLife',      new THREE.BufferAttribute(this._life, 1));
    geo.setAttribute('aIntensity', new THREE.BufferAttribute(this._int,  1));
    geo.setAttribute('aSeed',      new THREE.BufferAttribute(this._seed, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uFlash: { value: 0 },
        uCore:  { value: ENV.lightning.core.clone() },
        uEdge:  { value: ENV.lightning.edge.clone() },
      },
      vertexShader: `
        attribute float aLife;
        attribute float aIntensity;
        attribute float aSeed;
        uniform   float uTime;
        varying   float vAlpha;
        varying   float vInt;
        void main() {
          vInt = aIntensity;
          if (aLife <= 0.0) { gl_Position = vec4(0,0,-1000,1); return; }
          float s = step(0.18, fract(sin(uTime * 58.0 + aSeed) * 43758.5));
          vAlpha  = pow(aLife, 1.3) * s;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3  uCore, uEdge;
        uniform float uFlash;
        varying float vAlpha, vInt;
        void main() {
          if (vAlpha < 0.01) discard;
          vec3 col = mix(uEdge, uCore, vInt);
          // Massive multiplier for flash to make strikes blinding
          gl_FragColor = vec4(col * (4.0 + vInt * 10.0 + uFlash * 25.0), vAlpha);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });

    this.lines = new THREE.LineSegments(geo, mat);
    this.lines.frustumCulled = false;
    scene.add(this.lines);

    this._nxt   = 0;
    this._timer = 0;
    // Set a high initial threshold so it doesn't strike immediately on load
    this._nextStrikeTime = 10.0 + Math.random() * 15.0; 
  }

  _seg(p1, p2, life, intensity, seed) {
    const s = this._nxt++ % this.maxSegs;
    const a = s*2, b = s*2+1;
    this._pos[a*3]=p1.x; this._pos[a*3+1]=p1.y; this._pos[a*3+2]=p1.z;
    this._pos[b*3]=p2.x; this._pos[b*3+1]=p2.y; this._pos[b*3+2]=p2.z;
    this._life[a]=this._life[b]=life;
    this._int[a]=this._int[b]=intensity;
    this._seed[a]=this._seed[b]=seed;
  }

  _bolt(start, end, segs, branch, seed) {
    let cur = start.clone();
    const st  = end.clone().sub(start).divideScalar(segs);
    const jit = st.length() * (branch ? 0.5 : 1.0);
    const lf  = branch ? (0.2 + Math.random() * 0.2) : (0.5 + Math.random() * 0.5); // Longer lingering life
    const it  = branch ? (0.2 + Math.random() * 0.3) : 1.0; // Stronger core

    for (let i = 0; i < segs; i++) {
      const nxt = cur.clone().add(st);
      nxt.x += (Math.random()-.5)*jit; nxt.y += (Math.random()-.5)*jit*.55; nxt.z += (Math.random()-.5)*jit;
      this._seg(cur, nxt, lf, it, seed);
      if (!branch) {
        const off = new THREE.Vector3((Math.random()-.5)*.2,(Math.random()-.5)*.2,(Math.random()-.5)*.2);
        this._seg(cur.clone().add(off), nxt.clone().add(off), lf, it*.5, seed);
      }
      if (!branch && Math.random() > 0.7) {
        const bl = Math.max(3, Math.floor((segs-i)*.5));
        this._bolt(nxt, nxt.clone().add(new THREE.Vector3((Math.random()-.5)*15,(Math.random()*-20-4),(Math.random()-.5)*15)), bl, true, seed);
      }
      cur = nxt;
    }
  }

  strike(targetPos) {
    const seed = Math.random() * 100;
    const s    = new THREE.Vector3((Math.random()-.5)*40, 25+Math.random()*20, -35+Math.random()*40);
    const e    = targetPos
      ? targetPos.clone().add(new THREE.Vector3((Math.random()-.5)*2, Math.random()*2, (Math.random()-.5)*2))
      : new THREE.Vector3((Math.random()-.5)*15, -10, (Math.random()-.5)*15);
    this._bolt(s, e, 8+Math.floor(Math.random()*8), false, seed);
  }

  burst(targetPos, count = 3) {
    for (let i = 0; i < count; i++) setTimeout(() => this.strike(targetPos), i * 75);
    gsap.killTweensOf(this.lines.material.uniforms.uFlash);
    // Extreme flash value for a blinding, powerful strike
    this.lines.material.uniforms.uFlash.value = 5.0;
    gsap.to(this.lines.material.uniforms.uFlash, { value: 0, duration: 1.5, ease: 'power2.out' });
  }

  update(delta) {
    this._timer += delta;
    
    // Sparse, powerful ambient lightning. Triggers randomly every 10 to 25 seconds.
    if (this._timer > this._nextStrikeTime) {
      this.burst(null, Math.floor(Math.random() * 3) + 1); // 1 to 3 bolts
      this._timer = 0;
      this._nextStrikeTime = 10.0 + Math.random() * 15.0; 
    }

    let dirty = false;
    const mv  = this.maxSegs * 2;
    for (let i = 0; i < mv; i++) {
      if (this._life[i] > 0) {
        this._life[i] -= delta * 2.0; // Slower fade for better persistence of vision
        if (this._life[i] <= 0) { this._pos[i*3+1] = -99999; this._life[i] = 0; }
        dirty = true;
      }
    }
    if (dirty) {
      this.lines.geometry.attributes.position.needsUpdate = true;
      this.lines.geometry.attributes.aLife.needsUpdate    = true;
    }
    this.lines.material.uniforms.uTime.value += delta;
  }

  dispose() { this.scene.remove(this.lines); this.lines.geometry.dispose(); this.lines.material.dispose(); }
}

/* ─── SceneManager ───────────────────────────────────────────────────────── */

export class SceneManager {
  static QualityTier = {
    LOW: { name: 'low', antialias: false, shadows: false, postProcessing: false, pixelRatioCap: 1.0, bloomStrength: 0, shadowResolution: 512 },
    MEDIUM: { name: 'medium', antialias: true, shadows: true, postProcessing: true, pixelRatioCap: 1.5, bloomStrength: 1.0, shadowResolution: 1024 },
    HIGH: { name: 'high', antialias: true, shadows: true, postProcessing: true, pixelRatioCap: 2.0, bloomStrength: 1.2, shadowResolution: 2048 },
    ULTRA: { name: 'ultra', antialias: true, shadows: true, postProcessing: true, pixelRatioCap: 2.0, bloomStrength: 1.5, shadowResolution: 4096 },
  };

  constructor(canvasSelector, options = {}) {
    this.canvas = document.querySelector(canvasSelector);
    if (!this.canvas) throw new Error(`SceneManager: Canvas "${canvasSelector}" not found`);

    const tierConfig = SceneManager.QualityTier[options.quality?.toUpperCase()] || SceneManager.QualityTier.HIGH;
    this.config = {
      quality: options.quality || 'high',
      enablePostProcessing: options.enablePostProcessing ?? true,
      enableShadows: options.enableShadows ?? true,
      autoAdjustQuality: options.autoAdjustQuality ?? true,
      enableFallback: options.enableFallback ?? true,
      cameraIntroPos: new THREE.Vector3(0, 2.5, 3.5),
      cameraCruisePos: new THREE.Vector3(0, 2,  14),
      stormIntensity: 0.7,
      ...tierConfig,
      ...options,
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.clock = new THREE.Clock(); 
    
    this.environment = null; 
    this._sky = null;

    this.isInitialized = false;
    this.isContextLost = false;
    this.fallbackMode = false;
    this._introComplete  = false;
    this._scrollProgress = 0;
    
    // Kept for Environment Shader tracking, updated externally by main.js
    this._dragonWorldPos = new THREE.Vector3(0, 0, 0);
    
    this.performance = { startTime: 0, frameCount: 0, lastFpsCheck: performance.now(), currentFps: 60, consecutiveLowFps: 0 };
    this._eventListeners = {};
    
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this._onContextLost = this._onContextLost.bind(this);
    this._onContextRestored = this._onContextRestored.bind(this);
  }

  _detectCapabilities() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { antialias: false }) || canvas.getContext('webgl', { antialias: false });
      if (!gl) return { webgl: false, performance: 'low', renderer: 'none' };
      const renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const isLowEnd = /Intel HD Graphics|AMD Radeon R[3-5]|Mali-4|Adreno [3-4]|PowerVR/i.test(renderer);
      return { webgl: true, webgl2: !!canvas.getContext('webgl2'), maxTextureSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, 4096), isMobile, isLowEnd, performance: isLowEnd || isMobile ? 'low' : 'high', renderer };
    } catch (error) {
      return { webgl: false, performance: 'low', renderer: 'error' };
    }
  }

  _applyCanvasStyles() {
    if (this.canvas.parentElement !== document.body) {
      document.body.appendChild(this.canvas);
    }
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '-1'; 
    this.canvas.style.pointerEvents = 'none'; 
    this.canvas.style.display = 'block';
  }

  async setup() {
    console.log('[SceneManager] Igniting Cataclysm Protocol Stage v8.4 (Decoupled Canvas)...');
    
    try {
      this._applyCanvasStyles();
      this.capabilities = this._detectCapabilities();
      
      if (!this.capabilities.webgl && this.config.enableFallback) return this._enableFallbackMode();
      
      if (this.config.autoAdjustQuality && this.capabilities.performance === 'low') this._applyQualityTier('low');
      else this._applyQualityTier(this.config.quality);
      
      await this._setupScene();
      await this._setupCamera();
      await this._setupLighting();
      await this._setupRenderer();
      
      if (this.config.postProcessing && this.config.enablePostProcessing) {
        await this._setupPostProcessing();
      }

      // 🌊 NATIVE ENVIRONMENT INTEGRATION
      this.environment = new EnvironmentShader(this.scene, this.renderer, this.config);
      if (this.environment.mesh) {
        this.environment.mesh.frustumCulled = false; 
      }

      // ⚡ SPARSE SKY LIGHTNING
      this._sky = new SkyLightning(this.scene);

      this._setupEventHandlers();
      
      this.isInitialized = true;
      this.performance.startTime = performance.now(); 
      
      this._emit('ready', { scene: this.scene, camera: this.camera, renderer: this.renderer });
      return this;
      
    } catch (error) {
      console.error('❌ SceneManager setup failed:', error);
      if (this.config.enableFallback && !this.fallbackMode) return this._enableFallbackMode();
      throw error;
    }
  }

  async _enableFallbackMode() {
    this.fallbackMode = true;
    this.config.enablePostProcessing = false;
    this.config.enableShadows = false;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070a); 
    
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 3, 12);
    
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    
    await this._setupLighting();
    
    this.isInitialized = true;
    this._emit('ready', { scene: this.scene, camera: this.camera, fallback: true });
    return this;
  }

  _applyQualityTier(tierName) {
    const tier = SceneManager.QualityTier[tierName.toUpperCase()] || SceneManager.QualityTier.HIGH;
    Object.assign(this.config, tier);
    this.config.quality = tier.name;
  }

  async _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.name = 'ObsidianTempest';
    this.scene.background = new THREE.Color(0x05070a); 
    if (!this.fallbackMode) {
      this.scene.fog = new THREE.FogExp2(0x05070a, 0.015);
    }
    this.scene.matrixAutoUpdate = true;
  }

  async _setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.name = 'CinematicCamera';
    this.camera.position.copy(this.config.cameraIntroPos);
    this.camera.lookAt(0, 1.5, 0);
  }

  async _setupLighting() {
    const ambient = new THREE.AmbientLight(0x0a0c16, 0.8);
    const dir = new THREE.DirectionalLight(0xbaccff, 1.5);
    dir.position.set(-10, 20, 10);
    this.scene.add(ambient, dir);
  }

  async _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.config.antialias,
      alpha: false, 
      powerPreference: 'high-performance',
      stencil: false,
    });

    this.renderer.sortObjects = true;
    this.renderer.setClearColor(new THREE.Color(0x05070a), 1.0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0; 
    
    if (this.config.shadows && this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.canvas.addEventListener('webglcontextlost', this._onContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this._onContextRestored, false);
  }

  _onContextLost(event) {
    event.preventDefault();
    this.isContextLost = true;
  }

  _onContextRestored() {
    this.isContextLost = false;
    if (this.renderer) this.renderer.resetState();
  }

  async _setupPostProcessing() {
    if (!this.config.postProcessing || this.fallbackMode) return;

    try {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));

      const renderPass = new RenderPass(this.scene, this.camera);
      renderPass.clearColor = new THREE.Color(0x05070a);
      renderPass.clearAlpha = 1.0;
      this.composer.addPass(renderPass);

      if (this.config.bloomStrength > 0) {
        this._bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          this.config.bloomStrength, 
          0.8,                       
          1.8 // Strict threshold
        );
        this.composer.addPass(this._bloomPass);
      }

      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);

    } catch (error) {
      console.warn('[SceneManager] Post-processing setup failed, falling back:', error);
      this.composer = null;
      this.config.postProcessing = false;
    }
  }

  /* ─── Public API for External Control (Called by main.js / Dragon) ─────── */

  playIntroCinematic() {
    this.renderer.toneMappingExposure = 2.4;

    const tl = gsap.timeline({
      onComplete: () => {
        this._introComplete = true;
      }
    });

    tl.to({}, { duration: 1.5 });
    
    tl.to(this.camera.position, {
      x: this.config.cameraCruisePos.x,
      y: this.config.cameraCruisePos.y,
      z: this.config.cameraCruisePos.z,
      duration: 1.3, ease: 'power2.inOut',
    }, 4.5);
    
    tl.to(this.renderer, {
      toneMappingExposure: 1.0, duration: 1.3, ease: 'power2.out',
    }, '<');

    tl.add(() => {
      gsap.to({}, { 
        duration: 1.3, 
        onUpdate: () => this.camera.lookAt(0, 1.5, 0) 
      });
    }, 4.5);

    tl.totalDuration(5.8);
  }

  triggerAtmosphericFlash(intensity = 2.0, duration = 1.0) {
    if (!this.renderer || this.fallbackMode) return;
    gsap.killTweensOf(this.renderer);
    this.renderer.toneMappingExposure = intensity;
    gsap.to(this.renderer, {
      toneMappingExposure: 1.0,
      duration: duration,
      ease: 'expo.out'
    });
  }

  triggerSkyLightning(pos, count = 3) {
    if (this._sky) this._sky.burst(pos, count);
  }

  onScroll(scrollProgress) {
    if (!this._introComplete) return;
    this._scrollProgress = Math.min(1, Math.max(0, scrollProgress));
    
    const targetY = this.config.cameraCruisePos.y + this._scrollProgress * 1.8;
    gsap.to(this.camera.position, { y: targetY, duration: 0.9, ease: 'power1.out', overwrite: 'auto' });
  }

  updateDragonTracking(worldPos) {
    if (worldPos) this._dragonWorldPos.copy(worldPos);
  }

  /* ──────────────────────────────────────────────────────────────────────── */

  async _setupEventHandlers() {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.resize(window.innerWidth, window.innerHeight), 100);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    this._cleanupHandlers = () => {
      window.removeEventListener('resize', handleResize);
      this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
      clearTimeout(resizeTimeout);
    };
  }

  resize(width, height) {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));
    
    if (this.composer && this.config.postProcessing) {
      this.composer.setSize(width, height);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));
      if (this._bloomPass) this._bloomPass.resolution.set(width, height);
    }
    
    if (this.environment) this.environment.resize();
  }

  startLoop() {
    const loop = () => { this._rafId = requestAnimationFrame(loop); this.render(); };
    loop();
  }

  stopLoop() { if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; } }

  render() {
    if (this.isContextLost || !this.isInitialized) return;
    this._updatePerformanceMetrics();

    const delta = this.clock.getDelta();

    const currentFlash = Math.max(0, this.renderer.toneMappingExposure - 1.0);
    
    // Tick the environment
    if (this.environment) {
      this.environment.update(delta, {
        scrollProgress: this._scrollProgress,
        stormIntensity: this.config.stormIntensity,
        lightningFlash: currentFlash,
        camera: this.camera,
        dragonPosition: this._dragonWorldPos
      });
    }

    // Tick the sky lightning
    if (this._sky) {
      this._sky.update(delta); // Updates random strikes and fades out active ones
    }

    const lookTarget = this._dragonWorldPos.clone().add(new THREE.Vector3(0, 0.5, 0));
    if (this._introComplete) this.camera.lookAt(lookTarget);

    try {
      if (this.composer && this.config.postProcessing && !this.fallbackMode) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.error('[SceneManager] Render error. Safely disabling composer:', error);
      if (this.composer) {
        this.config.postProcessing = false;
        this.composer.dispose();
        this.composer = null;
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  _updatePerformanceMetrics() {
    const now = performance.now();
    if (now - this.performance.startTime < 5000) {
      this.performance.lastFpsCheck = now;
      this.performance.frameCount = 0;
      return; 
    }
    this.performance.frameCount++;
    const elapsed = now - this.performance.lastFpsCheck;
    if (elapsed >= 1000) {
      this.performance.currentFps = Math.round((this.performance.frameCount * 1000) / elapsed);
      this.performance.frameCount = 0;
      this.performance.lastFpsCheck = now;
      if (this.config.autoAdjustQuality) {
        if (this.performance.currentFps < 30) {
          this.performance.consecutiveLowFps++;
          if (this.performance.consecutiveLowFps >= 3) {
            this._downgradeQuality();
            this.performance.consecutiveLowFps = 0;
          }
        } else if (this.performance.currentFps > 45) {
          this.performance.consecutiveLowFps = 0;
        }
      }
    }
  }

  _downgradeQuality() {
    const tiers = Object.keys(SceneManager.QualityTier).map(k => k.toLowerCase());
    const currentIndex = tiers.indexOf(this.config.quality);
    if (currentIndex > 0) {
      const newQuality = tiers[currentIndex - 1];
      console.warn(`[SceneManager] Thermal Throttling Detected. Downgrading WebGL quality to [${newQuality.toUpperCase()}]`);
      this._applyQualityTier(newQuality);
      const newPixelRatio = Math.min(window.devicePixelRatio, this.config.pixelRatioCap);
      if (this.renderer) {
        this.renderer.setPixelRatio(newPixelRatio);
      }
      if (this.composer) {
        if (!this.config.postProcessing) {
          this.composer.dispose();
          this.composer = null;
        } else {
          this.composer.setPixelRatio(newPixelRatio);
          this.composer.passes.forEach(pass => {
            if (pass instanceof UnrealBloomPass) {
              pass.strength = this.config.bloomStrength;
            }
          });
        }
      }
    }
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => { try { cb(data); } catch(e) {} });
  }

  dispose() {
    if (this._cleanupHandlers) this._cleanupHandlers();
    if (this.environment) this.environment.dispose();
    if (this._sky) this._sky.dispose();
    if (this.composer) { this.composer.dispose(); this.composer = null; }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.renderer.context = null;
      this.renderer.domElement = null;
    }
    if (this.scene) {
      this.scene.traverse(object => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          Array.isArray(object.material) ? object.material.forEach(m => m.dispose()) : object.material.dispose();
        }
      });
      this.scene.clear();
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.isInitialized = false;
  }
}