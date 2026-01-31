import type { AABB } from '../utils/math';

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
 */
export class Brick {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  alive: boolean = true;

  constructor(x: number, y: number, width: number, height: number, rowIndex: number = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = ROW_COLORS[rowIndex % ROW_COLORS.length];
  }

  get bounds(): AABB {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  hit(): void {
    this.alive = false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.fill();

    // Subtle highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 4);
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
