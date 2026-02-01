import { InputManager } from './input/InputManager';
import { Scene } from './core/Scene';

/**
 * Abstract Game base class
 * 
 * Handles:
 * - Canvas setup and high-DPI scaling
 * - Game loop with delta time
 * - Input management (keyboard, mouse, touch)
 * - Scene management
 * - Pause/resume functionality
 * 
 * Two usage patterns are supported:
 * 
 * 1. **Scene-based** (recommended): Set a scene and let it handle update/render
 *    ```typescript
 *    class MyGame extends Game {
 *      constructor() {
 *        super();
 *        this.setScene(new GameplayScene());
 *      }
 *    }
 *    ```
 * 
 * 2. **Direct override**: Override update/render for simple games
 *    ```typescript
 *    class SimpleGame extends Game {
 *      update(dt: number) { ... }
 *      render(ctx: CanvasRenderingContext2D) { ... }
 *    }
 *    ```
 */
export abstract class Game {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  /** Unified input manager for keyboard, mouse, and touch */
  protected input: InputManager;

  /** Currently active scene, if any */
  protected scene: Scene | null = null;

  private lastTime: number = 0;
  private running: boolean = false;
  private paused: boolean = false;

  /** Bound resize handler for proper cleanup */
  private boundResize = this.resize.bind(this);

  constructor(canvasId: string = 'game-canvas') {
    // Create input manager first (starts listening immediately)
    this.input = new InputManager();

    // Create and setup canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = canvasId;
    document.body.appendChild(this.canvas);

    // Get 2D rendering context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    // Initial resize and setup listeners
    this.resize();
    window.addEventListener('resize', this.boundResize);

    // Start the game loop
    this.start();
  }

  // === Getters ===

  /** Current canvas width in CSS pixels */
  get width(): number {
    return window.innerWidth;
  }

  /** Current canvas height in CSS pixels */
  get height(): number {
    return window.innerHeight;
  }

  /** Whether the game is currently paused */
  get isPaused(): boolean {
    return this.paused;
  }

  // === Scene Management ===

  /**
   * Set the active scene.
   * The previous scene's onExit() is called, then the new scene's onEnter().
   */
  setScene(scene: Scene): void {
    if (this.scene) {
      this.scene.onExit();
    }
    this.scene = scene;
    scene._setGame(this);
    scene.onEnter();
  }

  /**
   * Get the current scene.
   */
  getScene(): Scene | null {
    return this.scene;
  }

  // === Pause Control ===

  /** Pause the game - updates stop but rendering continues */
  public pause(): void {
    if (!this.paused) {
      this.paused = true;
      this.scene?.onPause();
    }
  }

  /** Resume the game from paused state */
  public resume(): void {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now();
      this.scene?.onResume();
    }
  }

  /** Toggle between paused and running states */
  public togglePause(): void {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  // === Canvas Management ===

  /**
   * Handle window resize and high-DPI scaling
   */
  private resize(): void {
    const dpr = window.devicePixelRatio || 1;

    // Set the canvas size in CSS pixels
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Set the canvas buffer size accounting for device pixel ratio
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    // Reset and scale the context atomically to avoid transform stacking
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Notify subclass of resize
    this.onResize();
  }

  // === Lifecycle ===

  /** Start the game loop */
  protected start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * Stop the game loop and clean up all resources.
   * Override in subclass to add additional cleanup, but always call super.stop().
   */
  public stop(): void {
    this.running = false;

    // Cleanup scene
    if (this.scene) {
      this.scene.onExit();
      this.scene = null;
    }

    // Cleanup input
    this.input.destroy();

    // Remove window listeners
    window.removeEventListener('resize', this.boundResize);

    // Remove canvas from DOM
    this.canvas.remove();
  }

  /** Main game loop using requestAnimationFrame */
  private loop(currentTime: number): void {
    if (!this.running) return;

    // Update logic (only when not paused)
    if (!this.paused) {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      if (this.scene) {
        this.scene.update(deltaTime);
      } else {
        this.update(deltaTime);
      }
    }

    // Render (always, even when paused)
    if (this.scene) {
      this.scene.render(this.ctx);
    } else {
      this.render();
    }

    // Clear per-frame input state AFTER both update and render
    // (render may check input for pause toggle)
    this.input.endFrame();

    requestAnimationFrame((time) => this.loop(time));
  }

  // === Abstract Methods ===
  // Override these for simple games without scenes

  /**
   * Update game logic - called every frame when not paused.
   * Override this for simple games, or use scenes for complex games.
   */
  protected update(_dt: number): void {
    // Default: no-op. Override in subclass or use scenes.
  }

  /**
   * Render the game - called every frame.
   * Override this for simple games, or use scenes for complex games.
   */
  protected render(): void {
    // Default: no-op. Override in subclass or use scenes.
  }

  /**
   * Called when the window is resized.
   * Override to reposition game objects.
   */
  protected onResize(): void {
    // Default: no-op. Override in subclass if needed.
  }
}
