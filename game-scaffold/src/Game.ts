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
    window.addEventListener('resize', () => this.resize());

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

    // Scale the context to account for the DPR
    this.ctx.scale(dpr, dpr);

    // Notify subclass of resize
    this.onResize();
  }

  /** Start the game loop */
  protected start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  /** Stop the game loop */
  public stop(): void {
    this.running = false;
  }

  /** Main game loop using requestAnimationFrame */
  private loop(currentTime: number): void {
    if (!this.running) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap dt to avoid spiral of death
    this.lastTime = currentTime;

    this.update(deltaTime);
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
