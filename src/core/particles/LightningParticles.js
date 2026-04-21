import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Industry-Grade Cinematic Lightning System v5.0 (HIGH-VOLTAGE FANTASY)
 * Engineered for the "Obsidian Tempest" aesthetic.
 * * Architectual Upgrades:
 * - Fantasy Plasma Palette: Shifts from Deep Royal Blue to Blinding Ice Blue.
 * - HDR Overdrive: Shader math pushes RGB values to extreme limits to trigger massive volumetric bloom.
 * - Tesla-Coil Branching: Fractal generation tuned for erratic, shattered web-like strikes.
 * - LineSegments Architecture: Guaranteed sharp, continuous plasma arcs without particle gaps.
 */
export class LightningParticles {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.config = {
      maxSegments: options.maxSegments ?? 3000, // Increased for denser webs
      qualityTier: options.qualityTier || 'high',
      enableBranching: options.enableBranching ?? true,
      ...options
    };

    if (this.config.qualityTier === 'low') this.config.maxSegments = 800;
    else if (this.config.qualityTier === 'medium') this.config.maxSegments = 1500;

    this.lines = null;
    this.material = null;
    this.geometry = null;
    
    // Core data buffers (1 segment = 2 vertices)
    const maxVerts = this.config.maxSegments * 2;
    this.data = {
      positions: new Float32Array(maxVerts * 3),
      life: new Float32Array(maxVerts),
      intensity: new Float32Array(maxVerts),
      seed: new Float32Array(maxVerts)
    };

    this.nextIdx = 0; 
    this.stormIntensity = 0.4;

    this.update = this.update.bind(this);
    this._triggerStrike = this._triggerStrike.bind(this);
    this._init();
  }

  _init() {
    const maxVerts = this.config.maxSegments * 2;
    this.geometry = new THREE.BufferGeometry();
    
    // Hide all lines initially
    for (let i = 0; i < maxVerts; i++) {
      this.data.positions[i * 3] = 0;
      this.data.positions[i * 3 + 1] = -1000; 
      this.data.positions[i * 3 + 2] = 0;
      this.data.life[i] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.data.positions, 3));
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.data.life, 1));
    this.geometry.setAttribute('aIntensity', new THREE.BufferAttribute(this.data.intensity, 1));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.data.seed, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlashBoost: { value: 0 },
        // Deep Fantasy Lighting Palette
        uCoreColor: { value: new THREE.Color(0xe0f7ff) }, // Blinding Ice Blue / White
        uEdgeColor: { value: new THREE.Color(0x0044ff) }  // Deep Royal Fantasy Blue
      },
      vertexShader: `
        attribute float aLife;
        attribute float aIntensity;
        attribute float aSeed;
        
        uniform float uTime;
        
        varying float vAlpha;
        varying float vIntensity;

        void main() {
          vIntensity = aIntensity;
          
          if (aLife <= 0.0) {
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
            return;
          }

          // VIOLENT STROBE EFFECT
          // Shared seed per strike ensures the entire branch flickers together
          float strobeNoise = fract(sin(uTime * 50.0 + aSeed) * 43758.5453);
          float strobe = step(0.25, strobeNoise); // 75% chance to be ON per frame (denser plasma)
          
          // Exponential fade out for that snappy electrical decay
          vAlpha = pow(aLife, 1.5) * strobe; 
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vIntensity;
        
        uniform vec3 uCoreColor;
        uniform vec3 uEdgeColor;
        uniform float uFlashBoost;

        void main() {
          if (vAlpha < 0.01) discard;
          
          // Color shifts from Deep Blue on the fringes to Ice White at the core
          vec3 baseColor = mix(uEdgeColor, uCoreColor, vIntensity);
          
          // HDR OVERDRIVE: Push values far past 1.0 so the SceneManager's Bloom catches it
          // This creates the volumetric "glow" without needing actual cylinder geometry
          float hdrMultiplier = 8.0 + (vIntensity * 12.0) + (uFlashBoost * 25.0);
          
          gl_FragColor = vec4(baseColor * hdrMultiplier, vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending, // Light adds to light (burns brighter when overlapping)
      depthWrite: false,
      depthTest: true
    });

    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.lines.frustumCulled = false;
    this.scene.add(this.lines);
  }

  _writeSegment(p1, p2, life, intensity, seed) {
    const idx = this.nextIdx;
    this.nextIdx = (this.nextIdx + 1) % this.config.maxSegments;

    const vIdx1 = idx * 2;
    const vIdx2 = idx * 2 + 1;

    this.data.positions[vIdx1 * 3] = p1.x;
    this.data.positions[vIdx1 * 3 + 1] = p1.y;
    this.data.positions[vIdx1 * 3 + 2] = p1.z;

    this.data.positions[vIdx2 * 3] = p2.x;
    this.data.positions[vIdx2 * 3 + 1] = p2.y;
    this.data.positions[vIdx2 * 3 + 2] = p2.z;

    this.data.life[vIdx1] = life;
    this.data.life[vIdx2] = life;

    this.data.intensity[vIdx1] = intensity;
    this.data.intensity[vIdx2] = intensity;

    this.data.seed[vIdx1] = seed;
    this.data.seed[vIdx2] = seed;
  }

  _addSegment(p1, p2, life, intensity, seed, isTrunk) {
    this._writeSegment(p1, p2, life, intensity, seed);

    if (isTrunk) {
      // Micro-jitters simulate thick, multi-arc main trunks
      const offset1 = new THREE.Vector3((Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4);
      this._writeSegment(p1.clone().add(offset1), p2.clone().add(offset1), life, intensity * 0.9, seed);
      
      const offset2 = new THREE.Vector3((Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4);
      this._writeSegment(p1.clone().add(offset2), p2.clone().add(offset2), life, intensity * 0.8, seed);
    }
  }

  _generateBoltPath(start, end, segments, isBranch, boltSeed) {
    let currentPos = start.clone();
    const totalVector = end.clone().sub(start);
    const stepVector = totalVector.divideScalar(segments);
    
    // Increased jitter for highly erratic, Tesla-coil style paths
    const jitterMagnitude = stepVector.length() * 1.2;
    
    const intensity = isBranch ? 0.3 + Math.random() * 0.4 : 1.0;
    const lifeDuration = isBranch ? 0.5 : 0.8; // Branches burn out slightly faster

    for (let i = 0; i < segments; i++) {
      let nextPos = currentPos.clone().add(stepVector);
      
      // Chaotic spatial displacement
      nextPos.x += (Math.random() - 0.5) * jitterMagnitude;
      nextPos.y += (Math.random() - 0.5) * jitterMagnitude * 0.8;
      nextPos.z += (Math.random() - 0.5) * jitterMagnitude;

      this._addSegment(currentPos, nextPos, lifeDuration, intensity, boltSeed, !isBranch);

      // Aggressive Hierarchical Branching
      if (this.config.enableBranching && !isBranch && Math.random() > 0.6) { // 40% chance to branch per segment
        const branchLength = Math.floor((segments - i) * 0.7);
        if (branchLength > 2) {
          const branchEnd = nextPos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            -10 - Math.random() * 20,
            (Math.random() - 0.5) * 30
          ));
          this._generateBoltPath(nextPos, branchEnd, branchLength, true, boltSeed);
        }
      }

      currentPos = nextPos;
    }
  }

  _triggerStrike(targetPos = null) {
    const boltSeed = Math.random() * 100.0;

    const startX = (Math.random() - 0.5) * 120;
    const startZ = -30 + (Math.random() - 0.5) * 80;
    const startPos = new THREE.Vector3(startX, 50 + Math.random() * 20, startZ);

    let endPos;
    if (targetPos) {
      endPos = targetPos.clone();
    } else {
      endPos = new THREE.Vector3(
        startX + (Math.random() - 0.5) * 50,
        -10, // Ocean level
        startZ + (Math.random() - 0.5) * 50
      );
    }

    const segments = 15 + Math.floor(Math.random() * 15);
    this._generateBoltPath(startPos, endPos, segments, false, boltSeed);
  }

  update(delta, params = {}) {
    const { maxSegments } = this.config;
    this.stormIntensity = params.stormIntensity ?? this.stormIntensity;

    this.material.uniforms.uTime.value += delta;

    // Ambient random strikes
    const strikeProbability = delta * this.stormIntensity * 0.8;
    if (Math.random() < strikeProbability) {
      this._triggerStrike();
    }

    let needsUpdate = false;
    const maxVerts = maxSegments * 2;
    for (let i = 0; i < maxVerts; i++) {
      if (this.data.life[i] > 0) {
        // Fast decay for that explosive visual snap
        this.data.life[i] -= delta * 2.5; 
        
        if (this.data.life[i] <= 0) {
          this.data.positions[i * 3 + 1] = -1000; // Hide underground
          this.data.life[i] = 0;
        }
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.aLife.needsUpdate = true;
    }
  }

  triggerBurst(targetPos = null) {
    const burstCount = 4 + Math.floor(Math.random() * 4); // Multiple overlapping strikes
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => this._triggerStrike(targetPos), i * 50);
    }
    
    // Massive HDR flash overdrive
    gsap.killTweensOf(this.material.uniforms.uFlashBoost);
    this.material.uniforms.uFlashBoost.value = 3.0;
    gsap.to(this.material.uniforms.uFlashBoost, { 
      value: 0, 
      duration: 0.8, 
      ease: 'power3.out' 
    });
  }

  dispose() {
    if (this.scene && this.lines) this.scene.remove(this.lines);
    this.geometry?.dispose();
    this.material?.dispose();
    this.lines = null;
  }
}