import * as THREE from 'three';

/**
 * Industry-Grade Procedural Environment Shader v7.1 (CATACLYSM PROTOCOL)
 * * Architectural Upgrades:
 * - Opaque Render Queue Fix: transparent set to FALSE to prevent the shader from painting over the Opaque Dragon.
 * - Void & Cracks: The sky is torn open by procedural, glowing red fractures.
 * - Perspective Water Plane: Horizon split with true UV perspective distortion for the sea.
 * - Interactive Dragon Reflection: Projects the 3D dragon into the 2D shader to cast a rippling reflection.
 */
export class EnvironmentShader {
  constructor(scene, renderer, options = {}) {
    this.scene = scene;
    this.renderer = renderer;
    this.config = {
      qualityTier: options.qualityTier || 'high',
      resolution: options.resolution || new THREE.Vector2(window.innerWidth, window.innerHeight),
      ...options
    };

    this.mesh = null;
    this.material = null;

    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);

    this._init();
    console.log('[EnvironmentShader] Cataclysm Protocol & Ocean Reflection Initialized');
  }

  _init() {
    const { resolution, qualityTier } = this.config;
    // Scale noise iterations based on hardware to maintain 60FPS
    const octaves = qualityTier === 'low' ? 3.0 : (qualityTier === 'medium' ? 4.0 : 6.0);

    this.material = new THREE.ShaderMaterial({
      // 🛑 THE FIX: Must be false so it draws BEFORE the transparent pass, acting as a true background!
      transparent: false, 
      depthWrite: false,
      depthTest: false,
      blending: THREE.NoBlending, // Absolute base layer
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: resolution },
        uScrollProgress: { value: 0.0 },
        uStormIntensity: { value: 0.5 },
        uLightningFlash: { value: 0.0 },
        uDragonPos: { value: new THREE.Vector2(0.5, 0.5) }, // Tracks the dragon for reflection
        uOctaves: { value: octaves }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Bulletproof Fullscreen Quad: Hardcoded to the absolute back of the viewing frustum
          gl_Position = vec4(position.x, position.y, 0.9999, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        varying vec2 vUv;
        
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uScrollProgress;
        uniform float uStormIntensity;
        uniform float uLightningFlash;
        uniform vec2 uDragonPos;
        uniform float uOctaves;

        // --- CORE MATH & NOISE ---
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix( mix( hash( i + vec2(0.0,0.0) ), hash( i + vec2(1.0,0.0) ), u.x),
                      mix( hash( i + vec2(0.0,1.0) ), hash( i + vec2(1.0,1.0) ), u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < 6; i++) {
            if (float(i) >= uOctaves) break;
            v += a * noise(p);
            p = rot * p * 2.0 + vec2(100.0);
            a *= 0.5;
          }
          return v;
        }

        // --- 1. CATACLYSMIC SKY ---
        vec3 renderSky(vec2 uv, float time, float stormInt, float flash) {
          // Deep Void Base
          vec3 skyBase = vec3(0.02, 0.01, 0.03);
          
          // Volumetric Storm Clouds
          vec2 cloudUv = uv * 3.0 + vec2(time * 0.1, 0.0);
          float clouds = fbm(cloudUv);
          vec3 cloudColor = mix(vec3(0.05, 0.02, 0.08), vec3(0.1, 0.05, 0.15), clouds);
          
          // Red Sky Fractures / Cracks
          float crackNoise = fbm(uv * 5.0 - time * 0.2);
          float ridge = 1.0 - abs(crackNoise * 2.0 - 1.0);
          float crackGlow = pow(ridge, 12.0) * fbm(uv * 15.0 + time * 0.5); 
          
          vec3 crackColor = vec3(1.0, 0.1, 0.0) * crackGlow * (1.0 + stormInt * 2.0);
          
          // Cold Navy Lightning Flashes
          vec3 lightningColor = vec3(0.2, 0.5, 1.0) * flash * smoothstep(0.0, 1.0, uv.y) * fbm(uv * 8.0 + time);
          
          return skyBase + cloudColor + crackColor + lightningColor;
        }

        // --- 2. ABYSS OCEAN & REFLECTION ---
        vec3 renderWater(vec2 uv, float time, float stormInt, float horizon, vec3 skyColor, float flash) {
          float depth = (horizon - uv.y) / horizon; 
          if (depth <= 0.0) return vec3(0.0); 
          
          vec2 waterUv = vec2(uv.x, depth);
          waterUv.x *= (1.0 + depth * 2.0); 
          waterUv.x += sin(waterUv.y * 15.0 + time * 2.0) * 0.05 * depth;
          
          float ripples = fbm(waterUv * vec2(12.0, 6.0) - time * 1.5);
          
          vec3 waterColor = vec3(0.01, 0.02, 0.04);
          
          vec3 reflection = skyColor * 0.4 * smoothstep(0.3, 0.8, ripples);
          waterColor += reflection;
          
          // --- THE DRAGON REFLECTION ---
          float dx = uv.x - uDragonPos.x;
          dx += (ripples - 0.5) * 0.15 * depth;
          
          float dy = depth - (abs(uDragonPos.y - horizon) * 1.2); 
          float dist = length(vec2(dx, dy * 2.0));
          
          float reflectMask = smoothstep(0.2, 0.05, dist);
          
          vec3 drgSilhouette = mix(vec3(0.0), vec3(0.0, 0.4, 0.8), ripples);
          drgSilhouette += vec3(0.2, 0.8, 1.0) * flash; 
          
          waterColor = mix(waterColor, drgSilhouette, reflectMask * 0.7 * (1.0 - depth));

          waterColor += vec3(0.1, 0.2, 0.3) * pow(ripples, 4.0) * stormInt;
          
          return waterColor;
        }

        void main() {
          vec2 uv = vUv;
          float time = uTime * 0.15;
          
          float horizon = 0.3 + (uScrollProgress * 0.05);

          vec3 finalColor = vec3(0.0);

          if (uv.y > horizon) {
            finalColor = renderSky(uv, time, uStormIntensity, uLightningFlash);
          } else {
            vec3 fakeSkyColor = renderSky(vec2(uv.x, horizon + (horizon - uv.y)), time, uStormIntensity, uLightningFlash);
            finalColor = renderWater(uv, time, uStormIntensity, horizon, fakeSkyColor, uLightningFlash);
          }

          finalColor *= smoothstep(0.0, 0.02, abs(uv.y - horizon));

          float vignette = length(uv - 0.5) * 1.2;
          finalColor *= 1.0 - smoothstep(0.4, 1.2, vignette);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    
    // Ensure it is always behind everything in the opaque queue
    this.mesh.renderOrder = -9999;
    this.scene.add(this.mesh);

    window.addEventListener('resize', this.resize, { passive: true });
  }

  update(delta, params = {}) {
    if (!this.material) return;
    
    const u = this.material.uniforms;
    u.uTime.value += delta;
    
    if (params.scrollProgress !== undefined) u.uScrollProgress.value = params.scrollProgress;
    if (params.stormIntensity !== undefined) u.uStormIntensity.value = params.stormIntensity;
    if (params.lightningFlash !== undefined) u.uLightningFlash.value = params.lightningFlash;

    if (params.dragonPosition && params.camera) {
      const p = params.dragonPosition.clone();
      p.project(params.camera);
      
      const screenX = (p.x + 1.0) / 2.0;
      const screenY = (p.y + 1.0) / 2.0;

      u.uDragonPos.value.lerp(new THREE.Vector2(screenX, screenY), 0.1);
    }
  }

  resize() {
    if (!this.material) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.config.resolution.set(w, h);
    this.material.uniforms.uResolution.value.set(w, h);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    if (this.material) this.material.dispose();
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      this.scene.remove(this.mesh);
    }
  }
}