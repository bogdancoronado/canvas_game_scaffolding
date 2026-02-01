import { Vector2 } from '../utils/math';
import { Vector3 } from '../utils/Vector3';
import { InputManager } from '../input/InputManager';
import type { AABB } from '../utils/math';

export class SpaceShip {
  position: Vector3;
  velocity: Vector2;
  readonly bounds: AABB; // Logical simple bounds for interface compliance
  // Real collision checks will be custom 3D logic

  private speed: number = 200; // X-axis movement speed
  private leanAngle: number = 0; // Visual banking
  // Width not strictly used for logic here (handled in Game), but good to have as prop if needed later.
  // Removing to silence lint for now.

  constructor() {
    // Player is fixed at Z=1 (screen plane), Y=150 (bottom-ish)
    this.position = new Vector3(0, 150, 1);
    this.velocity = new Vector2(0, 0);
    this.bounds = { x: 0, y: 0, width: 0, height: 0 }; // Placeholder
  }

  update(dt: number, input: InputManager, _screenWidth: number): void {
    // 1. Handle Input
    const moveDir = (input.isKeyDown('ArrowRight') || input.isKeyDown('d') ? 1 : 0) -
      (input.isKeyDown('ArrowLeft') || input.isKeyDown('a') ? 1 : 0);

    // 2. Move X
    this.position.x += moveDir * this.speed * dt;

    // 3. Clamp to screen edges (approximate world limits)
    // At z=1, screen width is roughly the pixel width. 
    // Let's assume a "tunnel" width of +/- 400 world units for gameplay balance.
    const limit = 350;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));

    // 4. Visual Bank (Lean)
    const targetLean = moveDir * -0.3; // Lean into turn
    this.leanAngle += (targetLean - this.leanAngle) * 10 * dt;
  }

  render(ctx: CanvasRenderingContext2D, center: Vector2): void {
    // Project position to screen
    // screenCenter is passed from Game
    const screenPos = this.position.project(1, center);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(this.leanAngle);

    // Draw Ship (Simple Triangle)
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;

    // Wireframe look
    ctx.beginPath();
    ctx.moveTo(0, -20); // Nose
    ctx.lineTo(15, 20); // Right wing
    ctx.lineTo(0, 10);  // Engine center
    ctx.lineTo(-15, 20); // Left wing
    ctx.closePath();
    ctx.stroke();

    // Engine glow
    ctx.fillStyle = '#f0f';
    ctx.beginPath();
    ctx.arc(0, 12, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
