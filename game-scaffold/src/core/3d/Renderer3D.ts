import { Vector2, rotateVector2, lerp } from '../../utils/math';
import { Vector3 } from '../../utils/Vector3';
import { Camera } from './Camera';
import { Mesh } from './Mesh';

/**
 * Internal representation of a face ready for rendering.
 *
 * After world and view transforms, faces are stored in this format
 * for sorting and projection. The sortDepth is used for painter's algorithm.
 */
interface RenderableFace {
  /** First vertex in view space */
  p1: Vector3;
  /** Second vertex in view space */
  p2: Vector3;
  /** Fill color */
  color: string;
  /** Depth value for sorting (max of p1.z, p2.z) */
  sortDepth: number;
}

/**
 * 3D rendering engine for "2.5D" dungeon-crawler style graphics.
 *
 * The Renderer3D implements a simplified graphics pipeline optimized for
 * vertical walls (like Wolfenstein 3D or Doom). It uses the HTML5 Canvas
 * 2D context for rasterization.
 *
 * **Pipeline Stages:**
 * 1. **World Transform**: Mesh local coords → World coords (rotation + translation)
 * 2. **View Transform**: World coords → Camera-relative coords
 * 3. **Sorting**: Painter's algorithm (back-to-front by max Z)
 * 4. **Clipping**: Near plane clipping (Z < 1.0 = behind camera)
 * 5. **Projection**: 3D → 2D using perspective division
 * 6. **Rasterization**: Draw filled quads via Canvas path API
 *
 * @example
 * ```typescript
 * const camera = new Camera(new Vector3(0, 0, 0), 0, 400);
 * const renderer = new Renderer3D(ctx, width, height);
 * const scene = [Mesh.createRoom(200, 200, ['#800', '#080'])];
 *
 * // In game loop:
 * renderer.render(scene, camera);
 * ```
 *
 * @see Camera for view position/orientation
 * @see Mesh for geometry definition
 * @see docs/3d_engine_design.md for full architecture details
 */
export class Renderer3D {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  /** Background color for sky (upper half) */
  public skyColor: string = '#000022';

  /** Background color for floor (lower half) */
  public floorColor: string = '#050510';

  /** Color for horizon line */
  public horizonColor: string = '#330066';

  /** Near plane distance - geometry closer than this is clipped */
  private readonly NEAR_PLANE = 1.0;

  /** Y coordinate for ceiling in world units */
  private readonly CEILING_Y = -20;

  /** Y coordinate for floor in world units */
  private readonly FLOOR_Y = 20;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  render(scene: Mesh[], camera: Camera) {
    this.clear();

    const transformedFaces: RenderableFace[] = [];

    // 1. Transform Meshes to View Space
    for (const mesh of scene) {
      for (const face of mesh.faces) {
        // A. Mesh Local -> World Space
        let p1World = this.transformPointToWorld(face.p1, mesh);
        let p2World = this.transformPointToWorld(face.p2, mesh);

        // B. World -> View Space (Camera transform)
        let p1View = this.transformPointToView(p1World, camera);
        let p2View = this.transformPointToView(p2World, camera);

        // Use MAX depth for sorting to handle walls spanning behind camera.
        // If we used Average, a wall from Z=-100 to Z=100 would average to 0, 
        // causing it to draw LATER (on top of) an object at Z=50.
        // Using MAX sort: Wall(100) > Object(50). Wall draws FIRST. Object on TOP.
        transformedFaces.push({
          p1: p1View,
          p2: p2View,
          color: face.color,
          sortDepth: Math.max(p1View.z, p2View.z)
        });
      }
    }

    // 2. Sort (Back-to-Front)
    transformedFaces.sort((a, b) => b.sortDepth - a.sortDepth);


    // 3. Clip & Project & Draw
    const center = new Vector2(this.width / 2, this.height / 2);

    for (const face of transformedFaces) {
      this.drawFace(face, camera.fov, center);
    }
  }

  private clear() {
    const centerY = this.height / 2;

    // Floor
    this.ctx.fillStyle = this.floorColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Sky
    this.ctx.fillStyle = this.skyColor;
    this.ctx.fillRect(0, 0, this.width, centerY);

    // Horizon
    this.ctx.strokeStyle = this.horizonColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);
    this.ctx.lineTo(this.width, centerY);
    this.ctx.stroke();
  }

  private transformPointToWorld(p: Vector3, mesh: Mesh): Vector3 {
    // 1. Rotate
    const rot = rotateVector2(new Vector2(p.x, p.z), mesh.rotation);
    // 2. Translate
    return new Vector3(
      rot.x + mesh.position.x,
      p.y + mesh.position.y,
      rot.y + mesh.position.z
    );
  }

  private transformPointToView(p: Vector3, camera: Camera): Vector3 {
    // 1. Translate (relative to camera)
    const relX = p.x - camera.position.x;
    const relY = p.y - camera.position.y;
    const relZ = p.z - camera.position.z;

    // 2. Rotate (Inverse Camera Rotation)
    // We rotate the world opposite to camera angle
    const angle = -camera.rotation;
    const rot = rotateVector2(new Vector2(relX, relZ), angle);

    return new Vector3(rot.x, relY, rot.y);
  }

  private drawFace(face: RenderableFace, fov: number, center: Vector2) {
    let v1 = face.p1;
    let v2 = face.p2;

    // --- CLIPPING ---
    if (v1.z < this.NEAR_PLANE && v2.z < this.NEAR_PLANE) return;

    if (v1.z < this.NEAR_PLANE || v2.z < this.NEAR_PLANE) {
      const t = (this.NEAR_PLANE - v1.z) / (v2.z - v1.z);
      const newX = lerp(v1.x, v2.x, t);
      const newZ = this.NEAR_PLANE;
      // Interpolate Y as well if we had variable height walls, but for now we assume uniform wall

      const newV = new Vector3(newX, 0, newZ);
      if (v1.z < this.NEAR_PLANE) v1 = newV;
      else v2 = newV;
    }

    // --- PROJECTION ---
    const p1Bottom = new Vector3(v1.x, this.FLOOR_Y, v1.z).project(fov, center);
    const p2Bottom = new Vector3(v2.x, this.FLOOR_Y, v2.z).project(fov, center);

    // Ceiling points (Y is flipped in screen space usually, but our project math handles it)
    const p1Top = new Vector3(v1.x, this.CEILING_Y, v1.z).project(fov, center);
    const p2Top = new Vector3(v2.x, this.CEILING_Y, v2.z).project(fov, center);

    // --- RENDER ---
    this.ctx.fillStyle = face.color;
    this.ctx.strokeStyle = '#000'; // Hardcoded outline for definition
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(p1Top.x, p1Top.y);
    this.ctx.lineTo(p2Top.x, p2Top.y);
    this.ctx.lineTo(p2Bottom.x, p2Bottom.y);
    this.ctx.lineTo(p1Bottom.x, p1Bottom.y);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();
  }
}
