import { Vector2 } from '../utils/math';
import { Vector3 } from '../utils/Vector3';
import type { AABB } from '../utils/math';

export class CubeObstacle {
  position: Vector3;
  size: number = 50; // Size of the cube
  destroyed: boolean = false;
  bounds: AABB; // Unused for interface, custom collision used

  private color: string;

  constructor(x: number, y: number, z: number) {
    this.position = new Vector3(x, y, z);
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };

    // Random neon color
    const colors = ['#f0f', '#0ff', '#ff0', '#0f0'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt: number, speed: number): void {
    // Move towards camera (decrease Z)
    this.position.z -= speed * dt;

    // Destroy if behind camera
    if (this.position.z < 0) {
      this.destroy();
    }
  }

  destroy(): void {
    this.destroyed = true;
  }

  render(ctx: CanvasRenderingContext2D, center: Vector2): void {
    if (this.position.z < 0.1) return; // Don't render if too close/behind

    // 1. Calculate Front Face (at z)
    const frontZ = this.position.z;
    const frontScale = 1 / frontZ;
    const frontW = this.size * frontScale;
    const frontH = this.size * frontScale;

    const frontPos = this.position.project(1, center);

    // 2. Calculate Back Face (at z + depth)
    const backZ = this.position.z + 5; // Fixed depth for visual stability
    const backProjector = new Vector3(this.position.x, this.position.y, backZ);
    const backPos = backProjector.project(1, center);

    // We could calculate back scale, but for "speed tunnel" feel, 
    // simply drawing lines to the vanishing point usually looks good enough.
    // Let's do proper projection for the back face though.
    const backScale = 1 / backZ;
    const backW = this.size * backScale;

    // 3. Draw
    ctx.strokeStyle = this.fadeColor(this.color, frontZ);
    ctx.lineWidth = 2;

    // Front Face Rect
    const fx = frontPos.x - frontW / 2;
    const fy = frontPos.y - frontH / 2;
    ctx.strokeRect(fx, fy, frontW, frontH);

    // Back Face Rect (Optional, maybe just wireframe connections)
    const bx = backPos.x - backW / 2;
    const by = backPos.y - backW / 2;

    // Connecting lines (Wireframe Cube)
    ctx.beginPath();
    ctx.moveTo(fx, fy); ctx.lineTo(bx, by); // Top-Left
    ctx.moveTo(fx + frontW, fy); ctx.lineTo(bx + backW, by); // Top-Right
    ctx.moveTo(fx + frontW, fy + frontH); ctx.lineTo(bx + backW, by + backW); // Bottom-Right
    ctx.moveTo(fx, fy + frontH); ctx.lineTo(bx, by + backW); // Bottom-Left
    ctx.stroke();
  }

  private fadeColor(hex: string, _z: number): string {
    // Fade alpha based on distance
    // Close (z=1) -> Alpha 1
    // Far (z=100) -> Alpha 0
    // (Unused alpha logic for now, keeping simple hex return)
    return hex;
  }
}
