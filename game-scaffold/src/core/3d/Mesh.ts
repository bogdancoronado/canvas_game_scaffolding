import { Vector3 } from '../../utils/Vector3';

/**
 * A single face (wall segment) in a 3D mesh.
 *
 * Faces are defined by two floor points (p1, p2) which form the base of a
 * vertical wall. The renderer automatically extends these points up to create
 * a full quad (rectangle) representing the wall surface.
 *
 * This "2.5D" approach simplifies geometry definition - you only specify where
 * walls are on the ground plane, and the engine handles vertical projection.
 */
export interface Face {
  /** First floor point defining the wall base (x, y=0, z) */
  p1: Vector3;
  /** Second floor point defining the wall base (x, y=0, z) */
  p2: Vector3;
  /** Fill color for the face (CSS color string) */
  color: string;
}

/**
 * A collection of 3D faces (polygons) that form a renderable object.
 *
 * Meshes represent 3D geometry in the engine. Each mesh has:
 * - **Position**: Location in world space (translation)
 * - **Rotation**: Yaw rotation around the Y axis
 * - **Scale**: Size multiplier (not fully implemented in current renderer)
 * - **Faces**: Array of wall segments that make up the mesh
 *
 * The engine provides factory methods for common shapes:
 * - `Mesh.createCube()` - A 4-walled cube/pillar
 * - `Mesh.createRoom()` - A 4-walled room (inward-facing walls)
 *
 * @example
 * ```typescript
 * // Create a green cube at position (100, 0, 200)
 * const cube = Mesh.createCube(50, '#00ff00');
 * cube.position = new Vector3(100, 0, 200);
 *
 * // Add to scene for rendering
 * scene.push(cube);
 * ```
 *
 * @see Renderer3D for how meshes are rendered
 * @see docs/3d_engine_design.md for architectural overview
 */
export class Mesh {
  /** Position in world space */
  public position: Vector3;

  /** Rotation around Y axis in radians (yaw) */
  public rotation: number;

  /** Scale multiplier for mesh dimensions */
  public scale: Vector3;

  /** Array of faces that make up this mesh's geometry */
  public faces: Face[];

  /**
   * Create a new empty mesh at the given position.
   * @param position - Initial position in world space (default: origin)
   */
  constructor(position: Vector3 = new Vector3(0, 0, 0)) {
    this.position = position;
    this.rotation = 0;
    this.scale = new Vector3(1, 1, 1);
    this.faces = [];
  }

  /**
   * Add a face (wall segment) to this mesh.
   * @param p1 - First floor point
   * @param p2 - Second floor point
   * @param color - Fill color (CSS color string)
   */
  addFace(p1: Vector3, p2: Vector3, color: string): void {
    this.faces.push({ p1, p2, color });
  }

  /**
   * Create a cube mesh centered at origin in local space.
   *
   * The cube has 4 walls (no floor/ceiling) forming a pillar shape.
   * Position can be set after creation.
   *
   * @param size - Width/depth of the cube in world units
   * @param color - Fill color for all faces
   * @returns A new Mesh representing the cube
   */
  static createCube(size: number, color: string): Mesh {
    const mesh = new Mesh();
    const half = size / 2;

    // Front (South)
    mesh.addFace(new Vector3(-half, 0, half), new Vector3(half, 0, half), color);
    // Right (East)
    mesh.addFace(new Vector3(half, 0, half), new Vector3(half, 0, -half), color);
    // Back (North)
    mesh.addFace(new Vector3(half, 0, -half), new Vector3(-half, 0, -half), color);
    // Left (West)
    mesh.addFace(new Vector3(-half, 0, -half), new Vector3(-half, 0, half), color);

    return mesh;
  }

  /**
   * Create a room mesh (inward-facing walls) centered at origin.
   *
   * Unlike a cube where walls face outward, room walls face inward
   * so they're visible from inside the room.
   *
   * @param width - Width of the room (X axis)
   * @param depth - Depth of the room (Z axis)
   * @param wallColors - Array of 1-4 colors for walls [N, E, S, W]
   * @returns A new Mesh representing the room
   */
  static createRoom(width: number, depth: number, wallColors: string[]): Mesh {
    const mesh = new Mesh();
    const halfW = width / 2;
    const halfD = depth / 2;

    const c1 = wallColors[0] || '#888';
    const c2 = wallColors[1] || c1;
    const c3 = wallColors[2] || c1;
    const c4 = wallColors[3] || c1;

    // North Wall (Back)
    mesh.addFace(new Vector3(-halfW, 0, -halfD), new Vector3(halfW, 0, -halfD), c1);
    // East Wall (Right)
    mesh.addFace(new Vector3(halfW, 0, -halfD), new Vector3(halfW, 0, halfD), c2);
    // South Wall (Front)
    mesh.addFace(new Vector3(halfW, 0, halfD), new Vector3(-halfW, 0, halfD), c3);
    // West Wall (Left)
    mesh.addFace(new Vector3(-halfW, 0, halfD), new Vector3(-halfW, 0, -halfD), c4);

    return mesh;
  }
}

