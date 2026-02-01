import { Vector2 } from '../utils/math';

/**
 * Unified input manager for keyboard, mouse, and touch input.
 * 
 * Provides a frame-based input model:
 * - `isKeyDown(key)` - Is the key currently held?
 * - `isKeyPressed(key)` - Was the key just pressed this frame?
 * - `isKeyReleased(key)` - Was the key just released this frame?
 * 
 * Pointer (mouse/touch) is unified:
 * - `pointerPosition` - Current pointer location (null if not active)
 * - `isPointerDown()` - Is primary pointer (mouse button / first touch) active?
 * 
 * Multi-touch is also available via `touches`.
 */
export class InputManager {
  // Keyboard state
  private keysDown: Set<string> = new Set();
  private keysPressed: Set<string> = new Set();
  private keysReleased: Set<string> = new Set();

  // Pointer state (unified mouse + primary touch)
  private _pointerPosition: Vector2 | null = null;
  private _pointerDown: boolean = false;
  private _pointerPressed: boolean = false;
  private _pointerReleased: boolean = false;

  // Multi-touch state
  private _touches: Vector2[] = [];

  // Bound handlers for cleanup
  private boundKeyDown = this.handleKeyDown.bind(this);
  private boundKeyUp = this.handleKeyUp.bind(this);
  private boundMouseMove = this.handleMouseMove.bind(this);
  private boundMouseDown = this.handleMouseDown.bind(this);
  private boundMouseUp = this.handleMouseUp.bind(this);
  private boundTouchStart = this.handleTouchStart.bind(this);
  private boundTouchMove = this.handleTouchMove.bind(this);
  private boundTouchEnd = this.handleTouchEnd.bind(this);

  constructor() {
    this.attach();
  }

  /**
   * Attach all event listeners to window.
   */
  private attach(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd);
    window.addEventListener('touchcancel', this.boundTouchEnd);
  }

  /**
   * Remove all event listeners. Call this when the game is destroyed.
   */
  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('touchstart', this.boundTouchStart);
    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
    window.removeEventListener('touchcancel', this.boundTouchEnd);
  }

  // === Keyboard ===

  /**
   * Check if a key is currently held down.
   * 
   * @param key - Key identifier (e.g., 'ArrowLeft', 'a', 'Escape')
   */
  isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  /**
   * Debug helper: Get number of currently held keys.
   */
  get activeKeyCount(): number {
    return this.keysDown.size;
  }

  /**
   * Check if a key was just pressed this frame.
   * Only true for one frame when the key transitions from up to down.
   */
  isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }

  /**
   * Check if a key was just released this frame.
   * Only true for one frame when the key transitions from down to up.
   */
  isKeyReleased(key: string): boolean {
    return this.keysReleased.has(key);
  }

  // === Pointer (Unified Mouse/Touch) ===

  /**
   * Current pointer position, or null if no active pointer.
   * For touch, this is the first touch point.
   * Returns a clone to prevent external mutation.
   */
  get pointerPosition(): Vector2 | null {
    return this._pointerPosition?.clone() ?? null;
  }

  /**
   * Is the primary pointer (left mouse button or first touch) currently active?
   */
  isPointerDown(): boolean {
    return this._pointerDown;
  }

  /**
   * Was the primary pointer just pressed this frame?
   */
  isPointerPressed(): boolean {
    return this._pointerPressed;
  }

  /**
   * Was the primary pointer just released this frame?
   */
  isPointerReleased(): boolean {
    return this._pointerReleased;
  }

  // === Multi-Touch ===

  /**
   * Get all current touch positions.
   * Empty array if no touches or using mouse.
   */
  get touches(): readonly Vector2[] {
    return this._touches;
  }

  // === Frame Update ===

  /**
   * Clear per-frame state. Call this at the END of each frame's update.
   * This resets pressed/released states for the next frame.
   */
  endFrame(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this._pointerPressed = false;
    this._pointerReleased = false;
  }

  // === Event Handlers ===

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default scrolling/browser actions for game keys
    const gameKeys = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Space',
      'KeyW', 'KeyA', 'KeyS', 'KeyD'
    ]);

    if (gameKeys.has(e.code)) {
      e.preventDefault();
    }

    if (!this.keysDown.has(e.code)) {
      this.keysPressed.add(e.code);
    }
    this.keysDown.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (this.keysDown.has(e.code)) {
      this.keysReleased.add(e.code);
    }
    this.keysDown.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    this._pointerPosition = new Vector2(e.clientX, e.clientY);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) { // Left button only
      this._pointerDown = true;
      this._pointerPressed = true;
      this._pointerPosition = new Vector2(e.clientX, e.clientY);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this._pointerDown = false;
      this._pointerReleased = true;
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault(); // Prevent scrolling/zooming
    this.updateTouches(e.touches);

    if (e.touches.length > 0) {
      this._pointerDown = true;
      this._pointerPressed = true;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    this.updateTouches(e.touches);
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.updateTouches(e.touches);

    if (e.touches.length === 0) {
      this._pointerDown = false;
      this._pointerReleased = true;
      this._pointerPosition = null;
    }
  }

  private updateTouches(touchList: TouchList): void {
    this._touches = [];
    for (let i = 0; i < touchList.length; i++) {
      const touch = touchList[i];
      this._touches.push(new Vector2(touch.clientX, touch.clientY));
    }

    // Update pointer position to first touch
    if (this._touches.length > 0) {
      this._pointerPosition = this._touches[0].clone();
    }
  }
}
