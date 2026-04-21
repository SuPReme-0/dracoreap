/**
 * NameCard.js — "The Sovereign's Missive"
 * A 3D physical component shaped like a sealed ancient letter.
 * Once the magma seal is broken, the flaps fold away to reveal a hazy, 
 * glassmorphic card with steady mist, base fire effects, and mirror-shine text.
 */
import gsap from 'gsap';

export class NameCard {
  constructor(containerId, name, title) {
    this.container = document.getElementById(containerId);
    this.name = name.toUpperCase();
    this.title = title.toUpperCase();
    this.isBuilt = false;
    this.isOpen = false; 
  }

  build() {
    if (!this.container) return;

    // Inject the CSS for the Mirror Shine, Pulsating Border, Mist, and Fire
    if (!document.getElementById('namecard-fx')) {
      const style = document.createElement('style');
      style.id = 'namecard-fx';
      style.innerHTML = `
        @keyframes mirrorShine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes borderPulse {
          0% { box-shadow: 0 5px 20px rgba(255, 17, 0, 0.2), inset 0 0 10px rgba(255, 17, 0, 0.1); border-color: rgba(255, 17, 0, 0.3); }
          50% { box-shadow: 0 10px 40px rgba(255, 17, 0, 0.5), inset 0 0 25px rgba(255, 17, 0, 0.4); border-color: rgba(255, 17, 0, 0.7); }
          100% { box-shadow: 0 5px 20px rgba(255, 17, 0, 0.2), inset 0 0 10px rgba(255, 17, 0, 0.1); border-color: rgba(255, 17, 0, 0.3); }
        }
        @keyframes mistDrift {
          0% { background-position: 0% 0%; }
          100% { background-position: -200% -100%; }
        }
        @keyframes fireFlicker {
          0% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 0.7; transform: scaleY(1.1); }
          100% { opacity: 0.4; transform: scaleY(1); }
        }
        .mirror-text-h1 {
          background: linear-gradient(110deg, #ffffff 20%, #aaddff 40%, #ffffff 50%, #ffffff 70%, #aaddff 80%, #ffffff 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: mirrorShine 5s linear infinite;
        }
        .mirror-text-h3 {
          background: linear-gradient(110deg, var(--color-cyan) 20%, #ffffff 40%, var(--color-cyan) 50%, var(--color-cyan) 70%, #ffffff 80%, var(--color-cyan) 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: mirrorShine 6s linear infinite reverse;
        }
        .obsidian-card-active {
          animation: borderPulse 4s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

    this.container.innerHTML = `
      <div class="ancient-letter-wrapper" style="position: relative; perspective: 1500px; width: 100%; max-width: 650px; margin-bottom: 2rem; cursor: pointer; transition: transform 0.3s ease;">
        
        <div class="letter-core" style="position: relative; z-index: 1; text-align: left; padding: 2.5rem 3rem; opacity: 0; transform: scale(0.9) translateY(20px); background: rgba(5, 7, 10, 0.35); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 17, 0, 0.3); border-radius: 8px; overflow: hidden;">
          
          <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.015%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.3%22/%3E%3C/svg%3E'); background-size: cover; mix-blend-mode: screen; opacity: 0.5; animation: mistDrift 30s linear infinite; pointer-events: none; z-index: -2;"></div>
          
          <div style="position: absolute; bottom: -20%; left: -10%; right: -10%; height: 80%; background: radial-gradient(ellipse at bottom center, rgba(255, 51, 0, 0.45) 0%, rgba(200, 20, 0, 0.1) 40%, transparent 70%); mix-blend-mode: screen; animation: fireFlicker 3s ease-in-out infinite; pointer-events: none; z-index: -1;"></div>
          
          <h1 class="mirror-text-h1" style="position: relative; font-family: var(--font-display); font-size: clamp(2.5rem, 5vw, 4.8rem); margin: 0; text-shadow: 0 0 30px rgba(255, 17, 0, 0.8); letter-spacing: 5px; z-index: 2;">
            ${this.name}
          </h1>
          <h3 class="mirror-text-h3" style="position: relative; font-family: var(--font-mono); font-size: clamp(0.9rem, 1.5vw, 1.3rem); margin-top: 0.8rem; letter-spacing: 7px; text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); z-index: 2;">
            ${this.title}
          </h3>
        </div>

        <div class="letter-flap top-flap" style="position: absolute; top: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to bottom, #11141a, #0a0c12); border: 1px solid rgba(255, 17, 0, 0.2); border-bottom: 1px solid rgba(255, 17, 0, 0.8); box-shadow: 0 15px 40px rgba(0,0,0,0.9); z-index: 5; transform-origin: top center; display: flex; align-items: flex-end; justify-content: center; border-radius: 4px 4px 0 0;">
           <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.05%22/%3E%3C/svg%3E'); pointer-events: none;"></div>
        </div>

        <div class="letter-flap bottom-flap" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to top, #11141a, #0a0c12); border: 1px solid rgba(255, 17, 0, 0.2); border-top: 1px solid rgba(255, 17, 0, 0.8); box-shadow: 0 -15px 40px rgba(0,0,0,0.9); z-index: 4; transform-origin: bottom center; display: flex; align-items: flex-start; justify-content: center; border-radius: 0 0 4px 4px;">
           <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.05%22/%3E%3C/svg%3E'); pointer-events: none;"></div>
        </div>

        <div class="letter-seal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; background: radial-gradient(circle at 30% 30%, #ff3300, #550000); border-radius: 50%; border: 2px solid #ff5500; box-shadow: 0 0 30px rgba(255, 17, 0, 0.7); z-index: 6; display: flex; align-items: center; justify-content: center; transition: box-shadow 0.3s ease;">
           <div style="width: 20px; height: 20px; border: 2px solid #ffaa00; transform: rotate(45deg); opacity: 0.9;"></div>
        </div>
        
        <div class="click-hint" style="position: absolute; top: 110%; left: 50%; transform: translateX(-50%); color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.8rem; letter-spacing: 4px; opacity: 0.7; pointer-events: none;">BREAK SEAL</div>

      </div>
    `;

    this.wrapper = this.container.querySelector('.ancient-letter-wrapper');
    this.topFlap = this.container.querySelector('.top-flap');
    this.bottomFlap = this.container.querySelector('.bottom-flap');
    this.core = this.container.querySelector('.letter-core');
    this.seal = this.container.querySelector('.letter-seal');
    this.hint = this.container.querySelector('.click-hint');

    this.isBuilt = true;

    this.wrapper.addEventListener('mouseenter', () => {
      if (!this.isOpen) this.seal.style.boxShadow = '0 0 50px rgba(255, 51, 0, 1.0)';
    });
    this.wrapper.addEventListener('mouseleave', () => {
      if (!this.isOpen) this.seal.style.boxShadow = '0 0 30px rgba(255, 17, 0, 0.7)';
    });

    this.wrapper.addEventListener('click', () => this.open());
  }

  open() {
    if (!this.isBuilt || this.isOpen) return;
    this.isOpen = true; 

    this.wrapper.style.cursor = 'default';

    const tl = gsap.timeline();

    // 1. The Magma Seal shatters
    tl.to(this.seal, {
      scale: 2.0,
      opacity: 0,
      duration: 0.3,
      ease: "back.in(2.0)"
    }, 0);

    tl.to(this.hint, { opacity: 0, duration: 0.2 }, 0);

    // 2. Physical folds swing open
    tl.to(this.topFlap, {
      rotateX: 120,     
      opacity: 0,       
      duration: 1.8,
      ease: "power3.inOut"
    }, 0.15); 

    tl.to(this.bottomFlap, {
      rotateX: -120,    
      opacity: 0,
      duration: 1.8,
      ease: "power3.inOut"
    }, 0.15);

    // 3. The Hazy Card pushes forward
    tl.to(this.core, {
      opacity: 1,
      scale: 1.0,
      y: 0,
      duration: 1.5,
      ease: "back.out(1.2)",
      onComplete: () => {
        // Ignite the pulsating border effect
        this.core.classList.add('obsidian-card-active');
      }
    }, 0.5); 
  }
}