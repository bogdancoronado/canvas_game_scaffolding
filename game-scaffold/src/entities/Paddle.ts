import type { AABB } from '../utils/math';

/**
 * Paddle entity - player controlled
 */
export class Paddle {
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  readonly speed: number;
  readonly color: string = '#16213e';
  private targetX: number;

  constructor(x: number, y: number, width: number = 100, height: number = 14) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 800;
    this.targetX = x;
  }

  get bounds(): AABB {
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  get centerX(): number {
    return this.x;
  }

  /**
   * Set target position for smooth movement (mouse/touch)
   */
  setTarget(x: number): void {
    this.targetX = x;
  }

  /**
   * Move paddle by direction (-1 left, 1 right) for keyboard
   */
  move(direction: number, dt: number, screenWidth: number): void {
    this.x += direction * this.speed * dt;
    this.clamp(screenWidth);
    this.targetX = this.x;
  }

  update(dt: number, screenWidth: number): void {
    // Smooth interpolation toward target
    const diff = this.targetX - this.x;
    this.x += diff * Math.min(1, dt * 15);
    this.clamp(screenWidth);
  }

  private clamp(screenWidth: number): void {
    const halfWidth = this.width / 2;
    this.x = Math.max(halfWidth, Math.min(screenWidth - halfWidth, this.x));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.bounds;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 4);
    ctx.fill();
  }
}
