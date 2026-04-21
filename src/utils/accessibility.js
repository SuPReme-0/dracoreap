/**
 * Industry-Grade Accessibility (A11y) Manager v4.0
 * Bridges the WebGL black-box with the DOM accessibility tree.
 * * Architectual Upgrades:
 * - Asynchronous Narration Queue: Prevents simultaneous WebGL events from overwriting screen reader announcements.
 * - Focus Trapping API: Locks keyboard navigation during fullscreen modal/iframe interactions.
 * - High Contrast Detection: OS-level 'prefers-contrast: more' tracking for glassmorphic fallbacks.
 * - Memory-Safe Listeners: Class-bound methods prevent event listener memory leaks.
 */
class AccessibilityManager {
  constructor() {
    this.state = {
      isKeyboardUser: false,
      prefersReducedMotion: false,
      prefersHighContrast: false,
    };

    this.liveRegion = null;
    this._subscribers = [];
    
    // Queue system for screen reader announcements
    this._announcementQueue = [];
    this._isAnnouncing = false;

    // Bound methods for clean listener toggling
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleMouseDown = this._handleMouseDown.bind(this);

    this._init();
  }

  _init() {
    this._createLiveRegion();
    this._setupMediaQueries();
    
    // Default to mouse mode until a keyboard tap is detected
    window.addEventListener('keydown', this._handleKeyDown);

    console.log(`[A11yManager] Engine Active | Motion: ${this.state.prefersReducedMotion ? 'Reduced' : 'Full'} | Contrast: ${this.state.prefersHighContrast ? 'High' : 'Normal'}`);
  }

  /**
   * Creates an invisible DOM element that screen readers monitor for updates.
   * Forces the browser to translate 3D visual changes into semantic audio.
   */
  _createLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'webgl-announcer';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    
    // Modern visually hidden CSS standard (better than display: none, which screen readers ignore)
    Object.assign(this.liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0'
    });

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Tracks OS-level visual preferences (Motion Sickness & Vision Impairment)
   */
  _setupMediaQueries() {
    // Reduced Motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.state.prefersReducedMotion = motionQuery.matches;
    motionQuery.addEventListener('change', (e) => {
      this.state.prefersReducedMotion = e.matches;
      this._notifySubscribers('motionPreferenceChanged', e.matches);
    });

    // High Contrast
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    this.state.prefersHighContrast = contrastQuery.matches;
    contrastQuery.addEventListener('change', (e) => {
      this.state.prefersHighContrast = e.matches;
      this._notifySubscribers('contrastPreferenceChanged', e.matches);
    });
  }

  /**
   * Smart Keyboard Detection
   * Keeps UI clean of focus outlines until the exact moment a user hits "Tab"
   */
  _handleKeyDown(e) {
    if (e.key === 'Tab' || e.key === 'Enter') {
      this.state.isKeyboardUser = true;
      document.body.classList.add('keyboard-navigation'); // CSS uses this to enable focus outlines
      this._notifySubscribers('navigationModeChanged', 'keyboard');
      
      // Swap listeners: Wait for a mouse click to revert to mouse mode
      window.removeEventListener('keydown', this._handleKeyDown);
      window.addEventListener('mousedown', this._handleMouseDown);
    }
  }

  _handleMouseDown() {
    this.state.isKeyboardUser = false;
    document.body.classList.remove('keyboard-navigation');
    this._notifySubscribers('navigationModeChanged', 'mouse');
    
    // Swap listeners: Wait for a key press to revert to keyboard mode
    window.removeEventListener('mousedown', this._handleMouseDown);
    window.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Safely queues and reads messages to the screen reader.
   * @param {string} message - Text to read aloud (e.g., "The dragon's eyes ignite.")
   * @param {string} priority - 'polite' (wait) or 'assertive' (interrupt current speech)
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;

    if (priority === 'assertive') {
      // Assertive messages jump the queue and interrupt
      this._processAnnouncement(message, priority);
    } else {
      // Polite messages wait their turn
      this._announcementQueue.push(message);
      if (!this._isAnnouncing) {
        this._processQueue();
      }
    }
  }

  _processQueue() {
    if (this._announcementQueue.length === 0) {
      this._isAnnouncing = false;
      return;
    }

    this._isAnnouncing = true;
    const message = this._announcementQueue.shift();
    this._processAnnouncement(message, 'polite');

    // Wait 1.5 seconds before reading the next queued message
    setTimeout(() => this._processQueue(), 1500);
  }

  _processAnnouncement(message, priority) {
    // Clear first to force the screen reader to register a change, even if the message is identical to the last one
    this.liveRegion.textContent = ''; 
    this.liveRegion.setAttribute('aria-live', priority);
    
    // 50ms delay allows the DOM mutation observer to catch the clearing before inserting new text
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 50);
  }

  /**
   * Traps keyboard focus within a specific element (e.g., a modal or iframe overlay).
   * @param {HTMLElement} container - The wrapper to lock focus inside.
   */
  trapFocus(container) {
    if (!container) return;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, select, details, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    this._focusTrapHandler = (e) => {
      const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
      if (!isTabPressed) return;

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', this._focusTrapHandler);
    first.focus();
  }

  /**
   * Releases a previously established focus trap.
   * @param {HTMLElement} container - The wrapper to unlock.
   */
  releaseFocus(container) {
    if (!container || !this._focusTrapHandler) return;
    container.removeEventListener('keydown', this._focusTrapHandler);
    this._focusTrapHandler = null;
  }

  /**
   * Check if complex animations (camera shakes, fast dollies) should be bypassed.
   * @returns {boolean}
   */
  shouldReduceMotion() {
    return this.state.prefersReducedMotion;
  }

  /**
   * Check if the user is relying on keyboard navigation.
   * @returns {boolean}
   */
  isKeyboardNavigating() {
    return this.state.isKeyboardUser;
  }

  subscribe(event, callback) {
    this._subscribers.push({ event, callback });
    return () => {
      this._subscribers = this._subscribers.filter(sub => sub.callback !== callback);
    };
  }

  _notifySubscribers(event, data) {
    this._subscribers
      .filter(sub => sub.event === event)
      .forEach(sub => sub.callback(data));
  }
}

// Export as a singleton
export const a11yManager = new AccessibilityManager();