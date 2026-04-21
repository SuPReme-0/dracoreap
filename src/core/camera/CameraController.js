import * as THREE from 'three';
import gsap from 'gsap';
import { a11yManager } from '../../utils/accessibility.js';

/**
 * Industry-Grade Cinematic Camera Controller v7.1 (CATACLYSM PROTOCOL)
 * Engineered specifically for the Obsidian Tempest scroll-narrative.
 * * Architectual Upgrades:
 * - Macro-Cinematography: Splines pulled dramatically closer (Z: 4 to 8) to convey massive scale.
 * - Dynamic Framing: Panning across specific anatomy (jaw, chest, claws) while leaving negative space for UI.
 * - Dragon-Centric Lock-On: Target splines recalibrated to track the beast's center mass.
 */
export class CameraController {
  constructor(camera, options = {}) {
    this.camera = camera;
    
    this.config = {
      parallaxStrength: options.parallaxStrength ?? 0.8, 
      parallaxDamping: options.parallaxDamping ?? 0.05,
      shakeIntensity: options.shakeIntensity ?? 1.2, 
      fovBreathAmount: options.fovBreathAmount ?? 0.5, 
      fovBreathSpeed: options.fovBreathSpeed ?? 0.3,
      ...options
    };

    this.isReducedMotion = a11yManager.shouldReduceMotion();
    this.isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);

    // State Vectors
    this.mouse = new THREE.Vector2(0, 0);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.parallaxOffset = new THREE.Vector3(0, 0, 0);
    this.shakeOffset = new THREE.Vector3(0, 0, 0);
    
    // Core Rail Tracking
    this.basePosition = new THREE.Vector3();
    this.baseTarget = new THREE.Vector3();
    this.dampedTarget = new THREE.Vector3();
    
    // Pre-allocated vectors for the render loop
    this._tempVector = new THREE.Vector3();
    this.finalTarget = new THREE.Vector3();
    
    this.scrollProgress = 0;
    this.isShaking = false;
    this.baseFov = this.camera.fov;
    this.shakeFovOffset = 0;

    this._buildSplineTracks();

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onDeviceOrientation = this._onDeviceOrientation.bind(this);
    
    this._init();
  }

  _init() {
    if (!this.isReducedMotion) {
      if (this.isMobile && window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', this._onDeviceOrientation, { passive: true });
      } else {
        window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      }
    }
    
    // Snap to exact start
    this.positionCurve.getPoint(0, this.basePosition);
    this.targetCurve.getPoint(0, this.baseTarget);
    this.dampedTarget.copy(this.baseTarget);
    
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.dampedTarget);
    
    console.log('[CameraController] Macro-Cinematic Splines Armed');
  }

  /**
   * Constructs the perfect cinematic curves for the camera to ride along.
   * Assuming the Dragon sits at (0, 0, -2).
   */
  _buildSplineTracks() {
    // 1. Position Track (The Dolly Rail) - Pulled tight into the dragon's personal space
    this.positionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 6),     // Intro: Tight, imposing shot on the head/chest
      new THREE.Vector3(4.0, 0.5, 7),   // Skills (UI Right): Camera moves right, framing dragon on the left
      new THREE.Vector3(-4.0, -1.0, 6), // Projects (UI Left): Camera sweeps left, framing dragon on the right
      new THREE.Vector3(3.5, -2.0, 5),  // About (UI Right): Low-angle tight shot near the claws
      new THREE.Vector3(0, -1.0, 3.5)   // Contact: Extreme claustrophobic close-up on the glowing core
    ]);
    this.positionCurve.curveType = 'centripetal'; 

    // 2. Target Track (Where the lens is looking)
    this.targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, -2),    // Intro: Looking dead at the face
      new THREE.Vector3(-1.5, 0.5, -2), // Skills: Looking across the left shoulder/wing
      new THREE.Vector3(1.5, -0.5, -2), // Projects: Looking at the right claw/chest
      new THREE.Vector3(-1.0, 0.0, -2), // About: Looking up at the jaw from below
      new THREE.Vector3(0, -0.5, -2)    // Contact: Staring directly into the magma core
    ]);
    this.targetCurve.curveType = 'centripetal';
  }

  _onMouseMove(event) {
    this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  _onDeviceOrientation(event) {
    if (!event.gamma || !event.beta) return;
    this.targetMouse.x = THREE.MathUtils.clamp(event.gamma / 45, -1, 1);
    this.targetMouse.y = THREE.MathUtils.clamp((event.beta - 45) / 45, -1, 1);
  }

  setScrollProgress(progress) {
    this.scrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
  }

  triggerShake(intensity = 1.0, duration = 0.6) {
    if (this.isShaking || this.isReducedMotion) return;
    this.isShaking = true;

    const shakeParams = { val: intensity };
    
    gsap.to(shakeParams, {
      val: 0,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => {
        this.shakeOffset.x = (Math.random() - 0.5) * shakeParams.val * this.config.shakeIntensity;
        this.shakeOffset.y = (Math.random() - 0.5) * shakeParams.val * this.config.shakeIntensity;
        this.shakeOffset.z = (Math.random() - 0.5) * shakeParams.val * this.config.shakeIntensity;
      },
      onComplete: () => {
        this.shakeOffset.set(0, 0, 0);
        this.isShaking = false;
      }
    });

    gsap.fromTo(this, 
      { shakeFovOffset: -4 * intensity }, 
      { shakeFovOffset: 0, duration: duration, ease: "elastic.out(1, 0.3)" }
    );
  }

  update(delta, time = performance.now() * 0.001) {
    // 1. Sample exact rail position based on Scroll Progress
    this.positionCurve.getPoint(this.scrollProgress, this.basePosition);
    this.targetCurve.getPoint(this.scrollProgress, this.baseTarget);

    // 2. Heavy Lens Damping for natural, weighty camera sweeps
    this.dampedTarget.lerp(this.baseTarget, 0.05);

    // 3. Parallax Math
    if (!this.isReducedMotion) {
      this.mouse.lerp(this.targetMouse, this.config.parallaxDamping);
      this.parallaxOffset.x = -this.mouse.x * this.config.parallaxStrength;
      this.parallaxOffset.y = -this.mouse.y * this.config.parallaxStrength;
    }

    // 4. Compose Final Position
    this.camera.position.copy(this.basePosition)
      .add(this.parallaxOffset)
      .add(this.shakeOffset);

    // 5. Compose Final Focus Point
    this._tempVector.copy(this.parallaxOffset).multiplyScalar(0.15); 
    this.finalTarget.copy(this.dampedTarget).add(this._tempVector);
    
    this.camera.lookAt(this.finalTarget);

    // 6. Cinematic FOV Breathing
    if (!this.isReducedMotion) {
      const fovBreath = Math.sin(time * this.config.fovBreathSpeed) * this.config.fovBreathAmount;
      this.camera.fov = this.baseFov + fovBreath + this.shakeFovOffset;
      this.camera.updateProjectionMatrix();
    }
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    gsap.killTweensOf(this);
  }
}