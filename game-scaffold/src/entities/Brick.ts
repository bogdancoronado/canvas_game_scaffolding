import type { Entity } from '../core/Entity';
import { Vector3 } from '../utils/Vector3';
import type { BoundingBox } from '../utils/math';

/**
 * Brick colors by row for visual variety
 */
const ROW_COLORS = [
  '#e94560', // Red
  '#ff6b6b', // Light red
  '#feca57', // Yellow
  '#48dbfb', // Cyan
  '#1dd1a1', // Green
  '#5f27cd', // Purple
];

/**
 * Brick entity - destroyed when hit by ball
 * Implements Entity interface for EntityManager compatibility.
 */
export class Brick implements Entity {
  position: Vector3;
  destroyed = false;
  readonly width: number;
  readonly height: number;
  readonly color: string;

  constructor(x: number, y: number, width: number, height: number, rowIndex: number = 0) {
    this.position = new Vector3(x, y, 1);
    this.width = width;
    this.height = height;
    this.color = ROW_COLORS[rowIndex % ROW_COLORS.length];
  }

  /** Convenience getters for compatibility */
  get x(): number { return this.position.x; }
  get y(): number { return this.position.y; }

  get bounds(): BoundingBox {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  /** Whether the brick is still active */
  get alive(): boolean {
    return !this.destroyed;
  }

  hit(): void {
    this.destroyed = true;
  }

  update(_dt: number): void {
    // Bricks don't move
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.destroyed) return;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(this.position.x, this.position.y, this.width, this.height, 3);
    ctx.fill();

    // Subtle highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(this.position.x + 2, this.position.y + 2, this.width - 4, 4);
  }
}

/**
 * Create a grid of bricks
 */
export function createBrickGrid(
  screenWidth: number,
  rows: number = 5,
  cols: number = 8,
  topOffset: number = 60,
  padding: number = 8
): Brick[] {
  const bricks: Brick[] = [];
  const totalPadding = padding * (cols + 1);
  const brickWidth = (screenWidth - totalPadding) / cols;
  const brickHeight = 24;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = padding + col * (brickWidth + padding);
      const y = topOffset + row * (brickHeight + padding);
      bricks.push(new Brick(x, y, brickWidth, brickHeight, row));
    }
  }

  return bricks;
}
