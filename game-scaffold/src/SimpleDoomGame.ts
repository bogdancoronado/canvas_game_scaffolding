import { Game } from './Game';
import { Vector2 } from './utils/math';
import { Vector3 } from './utils/Vector3';
import { DungeonGenerator } from './procgen/DungeonGenerator';
import { Camera } from './core/3d/Camera';
import { Mesh } from './core/3d/Mesh';
import { Renderer3D } from './core/3d/Renderer3D';

/**
 * SimpleDoom - A first-person dungeon crawler demo.
 *
 * Demonstrates the 3D engine with procedurally generated rooms,
 * WASD + arrow key controls, and the complete rendering pipeline.
 * This serves as a reference implementation for first-person games.
 *
 * Features:
 * - First-person camera with yaw rotation
 * - WASD movement with arrow key rotation
 * - Procedurally generated level geometry
 * - Debug click-to-teleport for development
 *
 * @extends Game
 * @see Renderer3D for the 3D rendering pipeline
 * @see DungeonGenerator for level generation
 * @see docs/simple_doom_design.md for full design documentation
 */
export class SimpleDoomGame extends Game {
  // 3D Engine Components
  private camera: Camera;
  private renderer: Renderer3D;
  private worldMeshes: Mesh[] = [];

  // Constants
  private readonly MOVEMENT_SPEED = 100;
  private readonly ROTATION_SPEED = 2.0;

  constructor(onReturnToMenu?: () => void) {
    super('simple-doom-canvas', onReturnToMenu);

    // Initialize Engine
    this.camera = new Camera(new Vector3(0, 0, 0), 0, 400);
    this.renderer = new Renderer3D(this.ctx, this.width, this.height);

    // Load Level
    const walls = DungeonGenerator.generateTestLevel();
    const levelMesh = new Mesh();

    // Convert Walls to Mesh Faces
    walls.forEach(wall => {
      levelMesh.addFace(wall.p1, wall.p2, wall.color);
    });

    this.worldMeshes.push(levelMesh);

    // DEBUG: Click to teleport
    this.canvas.addEventListener('mousedown', (e) => this.handleDebugClick(e));
  }

  private handleDebugClick(e: MouseEvent): void {
    // Only handle clicks if they are in the top-left HUD area (roughly)
    if (e.clientY > 100 || e.clientX > 300) return;

    // Pause game to allow input
    const wasPaused = this.isPaused;
    if (!wasPaused) this.pause();

    const currentPos = `${this.camera.position.x.toFixed(0)}, ${this.camera.position.z.toFixed(0)}`;
    const currentRot = (this.camera.rotation * 180 / Math.PI).toFixed(0);

    const input = window.prompt(
      `Set Camera [X, Z, RotDeg]\nCurrent: ${currentPos}, ${currentRot}°`,
      `${currentPos}, ${currentRot}`
    );

    if (input) {
      const parts = input.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2) {
        this.camera.position.x = parts[0];
        this.camera.position.z = parts[1];
      }
      if (parts.length >= 3) {
        // Convert Deg -> Rad
        this.camera.rotation = parts[2] * (Math.PI / 180);
      }
    }

    if (!wasPaused) this.resume();
  }

  protected update(dt: number): void {
    // Rotation
    // Right Arrow should turn Right (Clockwise). In standard math, that means decreasing angle?
    // Let's test: Start 0 (South). Turn Right -> West.
    // 0 -> -90. sin(-90)=-1 (West). Correct.
    if (this.input.isKeyDown('ArrowLeft')) {
      this.camera.rotation += this.ROTATION_SPEED * dt; // Turn Left (CCW)
    }
    if (this.input.isKeyDown('ArrowRight')) {
      this.camera.rotation -= this.ROTATION_SPEED * dt; // Turn Right (CW)
    }

    // Movement
    // Rot=0 (North) -> (0, 1) [+Z].
    // Rot=90 (West) -> (-1, 0) [-X].
    // Current: sin, cos -> (1, 0) at 90. X is inverted.
    const forward = new Vector2(-Math.sin(this.camera.rotation), Math.cos(this.camera.rotation));
    const right = new Vector2(forward.y, -forward.x); // Perpendicular (1, 0) at rot=0

    let moveDir = new Vector2(0, 0);

    // Forward/Back
    if (this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('KeyW')) {
      moveDir = moveDir.add(forward);
    }
    if (this.input.isKeyDown('ArrowDown') || this.input.isKeyDown('KeyS')) {
      moveDir = moveDir.add(forward.scale(-1));
    }

    // Strafe logic
    // Forward (0, 1) [+Z]. Right (1, 0) [+X].
    // Strafe Right (D) should go +X (East).
    if (this.input.isKeyDown('KeyA')) {
      moveDir = moveDir.add(right.scale(-1)); // Strafe Left
    }
    if (this.input.isKeyDown('KeyD')) {
      moveDir = moveDir.add(right); // Strafe Right
    }

    // Apply movement
    if (moveDir.x !== 0 || moveDir.y !== 0) {
      this.camera.position.x += moveDir.x * this.MOVEMENT_SPEED * dt;
      this.camera.position.z += moveDir.y * this.MOVEMENT_SPEED * dt;
    }

    // Handle Resize (if window changed)
    if (this.width !== this.renderer['width'] || this.height !== this.renderer['height']) {
      this.renderer.resize(this.width, this.height);
    }
  }

  protected render(): void {
    // Handle pause toggle
    if (this.input.isKeyPressed('Escape')) {
      if (!this.isPaused) {
        this.pause();
      }
      // When paused, ESC is handled by base class pause menu
    }

    // If paused, render pause menu and return
    if (this.isPaused) {
      // Still render the game underneath
      this.renderer.render(this.worldMeshes, this.camera);
      this.renderPauseMenu();
      return;
    }

    // 3D Rendering
    this.renderer.render(this.worldMeshes, this.camera);

    // 2D Debug HUD (Overlaid)
    // Simple translucent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(10, 10, 200, 60);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';

    const cam = this.camera;

    // Minimal Info
    this.ctx.fillText(`Pos: ${cam.position.x.toFixed(0)}, ${cam.position.z.toFixed(0)}`, 20, 30);
    this.ctx.fillText(`Rot: ${Math.round(cam.rotation * 180 / Math.PI)}°`, 20, 50);
  }
}
