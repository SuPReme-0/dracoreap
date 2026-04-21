import * as THREE from 'three';

/**
 * Industry-Grade Procedural Obsidian Fire v7.0 (CATACLYSM PROTOCOL)
 * Engineered for the "Obsidian Tempest" cinematic aesthetic.
 * * Architectual Upgrades:
 * - Wind Shear Physics: Flames are violently blown diagonally to sync with the storm.
 * - Tightened Emission: Fire is tightly bound to the dragon's skeleton; no more screen-covering blobs.
 * - Ocean Embers: Ground fire converted to small, aggressive sparks skipping on the water.
 * - Sharp Erosion: Shader math tuned for licking, realistic flame shapes rather than cloudy smoke.
 */
export class FlameParticles {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.config = {
      maxParticles: options.maxParticles ?? 300, // Reduced slightly for tighter, cleaner visuals
      qualityTier: options.qualityTier || 'high',
      emissionZoneRadius: options.emissionZoneRadius ?? 6, // Squeezed the radius heavily
      ...options
    };
    
    if (this.config.qualityTier === 'low') this.config.maxParticles = 100;
    else if (this.config.qualityTier === 'medium') this.config.maxParticles = 200;
    
    this.instanceMesh = null;
    this.material = null;
    this.geometry = null;
    
    // Core data buffers
    this.data = {
      positions: new Float32Array(this.config.maxParticles * 3),
      life: new Float32Array(this.config.maxParticles),
      size: new Float32Array(this.config.maxParticles),
      velocity: new Float32Array(this.config.maxParticles * 3),
      seed: new Float32Array(this.config.maxParticles),
      type: new Float32Array(this.config.maxParticles) // 0 = Ocean Embers, 1 = Dragon Obsidian
    };
    
    this.lavaIntensity = 0.8;
    this.elapsedTime = 0;
    this._init();
  }

  _init() {
    const { maxParticles } = this.config;
    
    for (let i = 0; i < maxParticles; i++) {
      this._resetParticleData(i);
      this.data.life[i] = 0; 
    }

    const baseGeo = new THREE.PlaneGeometry(1, 1);
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.copy(baseGeo);
    baseGeo.dispose();

    // Register all attributes
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.data.life, 1));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.data.seed, 1));
    this.geometry.setAttribute('aType', new THREE.BufferAttribute(this.data.type, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLavaIntensity: { value: this.lavaIntensity },
        
        // Ocean Ember Palette (Bright, aggressive sparks)
        uColorCoreG: { value: new THREE.Color(0xffaa00) },  // Searing Yellow
        uColorMidG: { value: new THREE.Color(0xff1100) },   // Crimson
        
        // Dragon Obsidian Fire Palette (Deep void core, bleeding edges)
        uColorCoreD: { value: new THREE.Color(0x010002) },  // Pure Void/Black
        uColorMidD: { value: new THREE.Color(0xaa0011) },   // Searing Blood Red
        
        uColorSmoke: { value: new THREE.Color(0x020101) }   // Shared Ash
      },
      vertexShader: `
        attribute float aLife;
        attribute float aSeed;
        attribute float aType;
        
        uniform float uTime;
        
        varying vec2 vUv;
        varying float vAlpha;
        varying float vLife;
        varying float vSeed;
        varying float vType;

        void main() {
          if (aLife <= 0.0) {
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0); 
            return;
          }

          vUv = uv;
          vLife = aLife;
          vSeed = aSeed;
          vType = aType;
          
          // Fast attack, smooth decay (real fire bursts then fades)
          vAlpha = smoothstep(0.0, 0.1, aLife) * smoothstep(1.0, 0.2, aLife);
          
          // --- MANUAL BILLBOARDING ---
          vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          
          // Add a slight rotation to the particles based on their seed for organic variety
          float rot = aSeed * 6.28 + uTime * 0.5;
          vec2 rotatedPos = vec2(
            position.x * cos(rot) - position.y * sin(rot),
            position.x * sin(rot) + position.y * cos(rot)
          );
          
          vec3 orient = rotatedPos.x * cameraRight + rotatedPos.y * cameraUp;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(orient, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uLavaIntensity;
        
        uniform vec3 uColorCoreG;
        uniform vec3 uColorMidG;
        uniform vec3 uColorCoreD;
        uniform vec3 uColorMidD;
        uniform vec3 uColorSmoke;
        
        varying vec2 vUv;
        varying float vAlpha;
        varying float vLife;
        varying float vSeed;
        varying float vType;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                     mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0; float a = 0.5;
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < 3; i++) {
            v += a * noise(p); p = rot * p * 2.0 + vec2(10.0); a *= 0.5;
          }
          return v;
        }

        void main() {
          if (vAlpha < 0.01) discard;

          vec2 uv = vUv - 0.5; 
          
          // --- WIND SHEAR & EROSION ---
          float t = uTime * 6.0 + vSeed * 50.0;
          // Wind pushes the texture diagonally
          uv.x += (uv.y * 0.5) + uTime * 0.2; 
          uv.y -= uTime * 0.8; 
          
          // Sharp erosion for licking flames
          float n = fbm(uv * 5.0 - vec2(t * 0.2, t * 0.8));
          float dist = length(vUv - vec2(0.5, 0.2)); 
          
          // Subtract distance to keep it circular, add vLife so it shrinks as it dies
          float shape = n - (dist * 1.8);
          shape += (vLife * 0.8); 
          
          float fireMask = smoothstep(0.15, 0.35, shape);
          if (fireMask <= 0.01) discard;

          // --- DUAL PALETTE SELECTION ---
          vec3 activeCore = mix(uColorCoreG, uColorCoreD, vType);
          vec3 activeMid = mix(uColorMidG, uColorMidD, vType);

          float heat = smoothstep(0.0, 0.6, shape) * vLife;
          
          vec3 baseColor = mix(uColorSmoke, activeMid, smoothstep(0.1, 0.7, heat));
          vec3 finalColor = mix(baseColor, activeCore, smoothstep(0.7, 0.95, heat) * uLavaIntensity);
          
          // Ocean embers (vType 0) fade out completely to transparent, Dragon fire (vType 1) leaves black smoke
          float smokeAlphaFade = mix(0.0, mix(0.3, 1.0, heat), vType); 
          if (vType < 0.5) smokeAlphaFade = heat; // Embers don't cast smoke
          
          float finalAlpha = fireMask * vAlpha * smokeAlphaFade;
          
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending, 
      depthWrite: false, 
      depthTest: true
    });

    this.instanceMesh = new THREE.InstancedMesh(this.geometry, this.material, maxParticles);
    this.instanceMesh.frustumCulled = false;
    this.scene.add(this.instanceMesh);
  }

  _resetParticleData(idx, dragonPos = null) {
    // Shorter lifespan = tighter fire
    this.data.life[idx] = 0.4 + Math.random() * 0.5;
    this.data.seed[idx] = Math.random();

    // 60% of particles are Dragon Obsidian Fire, 40% are Ocean Embers
    const isDragonFlame = dragonPos && Math.random() > 0.4;

    if (isDragonFlame) {
      // --- 1. DRAGON TRAIL FLAMES ---
      this.data.type[idx] = 1.0; 
      this.data.size[idx] = Math.random() * 1.5 + 0.8; // Drastically reduced size
      
      // Spawn VERY tightly around the dragon
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      
      this.data.positions[idx * 3] = dragonPos.x + offset.x;
      this.data.positions[idx * 3 + 1] = dragonPos.y + offset.y;
      this.data.positions[idx * 3 + 2] = dragonPos.z + offset.z;

      // Velocity incorporates the gale-force storm wind (blowing heavily down and left)
      this.data.velocity[idx * 3] = offset.x * 0.5 - 2.0;     // Wind pushing left
      this.data.velocity[idx * 3 + 1] = offset.y * 0.5 + 1.0; // Heat rising
      this.data.velocity[idx * 3 + 2] = offset.z * 0.5;

    } else {
      // --- 2. DYNAMIC OCEAN EMBERS ---
      this.data.type[idx] = 0.0; 
      this.data.size[idx] = Math.random() * 0.8 + 0.3; // Tiny sparks
      
      // Scatter them widely across the sea surface
      const angle = (Math.random() * Math.PI * 2); 
      const radius = Math.pow(Math.random(), 2) * 25.0; 
      
      this.data.positions[idx * 3] = Math.cos(angle) * radius;
      // Lock them tightly to the ocean level (approx -10)
      this.data.positions[idx * 3 + 1] = -10 + (Math.random() - 0.5) * 1.0; 
      this.data.positions[idx * 3 + 2] = Math.sin(angle) * radius;

      // Embers get aggressively whipped by the wind
      this.data.velocity[idx * 3] = -5.0 - Math.random() * 3.0; // Extreme wind shear
      this.data.velocity[idx * 3 + 1] = 0.5 + Math.random() * 1.5; // Skipping on waves
      this.data.velocity[idx * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
  }

  update(delta, params = {}) {
    if (!this.instanceMesh) return;
    
    this.elapsedTime += delta;
    const { maxParticles } = this.config;
    this.lavaIntensity = params.lavaIntensity ?? this.lavaIntensity;
    
    // Spawn rate tied to intensity
    const spawnRate = 60 * Math.max(0.5, this.lavaIntensity); 
    const spawnCount = Math.floor(delta * spawnRate) + (Math.random() < (delta * spawnRate) % 1 ? 1 : 0);
    
    const dragonPos = params.dragonPosition || null;

    for (let i = 0; i < spawnCount; i++) {
      const idx = Math.floor(Math.random() * maxParticles);
      if (this.data.life[idx] <= 0) {
        this._resetParticleData(idx, dragonPos);
      }
    }

    this.material.uniforms.uTime.value = this.elapsedTime;
    this.material.uniforms.uLavaIntensity.value = this.lavaIntensity;

    const dummy = new THREE.Object3D();
    const lifeAttr = this.geometry.attributes.aLife;

    for (let i = 0; i < maxParticles; i++) {
      if (this.data.life[i] > 0) {
        const isDragon = this.data.type[i] > 0.5;
        
        // Fast burnout
        this.data.life[i] -= delta * (isDragon ? 1.2 : 0.8); 
        
        // Apply wind physics continuously
        if (isDragon) {
          // Dragon flames get pulled slightly back by the wind as they die
          this.data.velocity[i * 3] -= delta * 1.5; 
        } else {
          // Ocean embers succumb heavily to gravity and wind
          this.data.velocity[i * 3 + 1] -= delta * 2.0; // Gravity
          if (this.data.positions[i * 3 + 1] < -11) {
            // Bounce off the water
            this.data.velocity[i * 3 + 1] *= -0.5;
            this.data.positions[i * 3 + 1] = -11;
          }
        }

        // Apply velocities
        this.data.positions[i * 3] += this.data.velocity[i * 3] * delta;
        this.data.positions[i * 3 + 1] += this.data.velocity[i * 3 + 1] * delta;
        this.data.positions[i * 3 + 2] += this.data.velocity[i * 3 + 2] * delta;
        
        dummy.position.set(this.data.positions[i * 3], this.data.positions[i * 3 + 1], this.data.positions[i * 3 + 2]);
        
        // Expansion (tight for dragon, fast for embers)
        const expansion = isDragon ? (1.0 + (1.0 - this.data.life[i]) * 0.5) : 1.0;
        dummy.scale.setScalar(this.data.size[i] * expansion);
        
        dummy.updateMatrix();
        this.instanceMesh.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -1000, 0); 
        dummy.updateMatrix();
        this.instanceMesh.setMatrixAt(i, dummy.matrix);
        this.data.life[i] = 0;
      }
    }

    this.instanceMesh.instanceMatrix.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  }

  triggerBurst(count = 50) {
    if (!this.instanceMesh) return;
    const burstCount = Math.min(count, this.config.maxParticles);
    
    // When the dragon roars, unleash a localized, high-velocity blast of embers
    for (let i = 0; i < burstCount; i++) {
      const idx = Math.floor(Math.random() * this.config.maxParticles);
      this._resetParticleData(idx, null); 
      this.data.velocity[idx * 3] -= 15.0 + Math.random() * 10.0; // Blown extremely hard left
      this.data.velocity[idx * 3 + 1] += 5.0 + Math.random() * 5.0; // Shot upwards
      this.data.size[idx] *= 1.2; 
      this.data.life[idx] = 1.0; 
    }
  }

  dispose() {
    if (this.scene && this.instanceMesh) this.scene.remove(this.instanceMesh);
    this.geometry?.dispose();
    this.material?.dispose();
    this.instanceMesh = null;
  }
}