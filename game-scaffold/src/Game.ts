/**
 * Interface for entities that need cleanup when the game stops.
 * Implement this for entities that hold event listeners, timers, or external resources.
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * Abstract Game base class
 * Handles canvas setup, high-DPI scaling, resize events, and the RAF loop.
 * Extend this class and implement update() and render() to create a game.
 */
export abstract class Game {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private running: boolean = false;
  private paused: boolean = false;

  /** Registered entities that will be destroyed when the game stops */
  private entities: Destroyable[] = [];

  /** Bound resize handler for proper cleanup */
  private boundResize = this.resize.bind(this);

  constructor(canvasId: string = 'game-canvas') {
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

  /** Pause the game - updates stop but rendering continues */
  public pause(): void {
    this.paused = true;
  }

  /** Resume the game from paused state */
  public resume(): void {
    if (this.paused) {
      this.paused = false;
      // Reset lastTime to prevent large dt spike after unpause
      this.lastTime = performance.now();
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

  /**
   * Register an entity for automatic cleanup when the game stops.
   * Returns the entity for chaining.
   */
  protected registerEntity<T extends Destroyable>(entity: T): T {
    this.entities.push(entity);
    return entity;
  }

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

    // Remove window listeners
    window.removeEventListener('resize', this.boundResize);

    // Destroy all registered entities
    this.entities.forEach((entity) => entity.destroy());
    this.entities = [];

    // Remove canvas from DOM
    this.canvas.remove();
  }

  /** Main game loop using requestAnimationFrame */
  private loop(currentTime: number): void {
    if (!this.running) return;

    // Always render, but only update when not paused
    if (!this.paused) {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap dt to avoid spiral of death
      this.lastTime = currentTime;
      this.update(deltaTime);
    }

    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * Update game logic - called every frame
   * @param dt Delta time in seconds since last frame
   */
  protected abstract update(dt: number): void;

  /**
   * Render the game - called every frame after update
   */
  protected abstract render(): void;

  /**
   * Called when the window is resized
   * Override to reposition game objects
   */
  protected onResize(): void {
    // Default: no-op. Override in subclass if needed.
  }
}
