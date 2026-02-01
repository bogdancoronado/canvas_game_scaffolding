import { Vector3 } from '../../utils/Vector3';

/**
 * Represents the viewer's position and orientation in 3D space.
 *
 * The Camera defines where the viewer is located, which direction they're facing,
 * and the field of view for perspective projection:
 *
 * - **Position**: A Vector3 specifying x, y, z coordinates in world space
 * - **Rotation**: Yaw angle in radians (horizontal look direction, around Y axis)
 * - **FOV**: Field of view represented as focal length (higher = less distortion)
 *
 * The Renderer3D uses the Camera to transform world coordinates into view space,
 * then applies perspective projection to create the final 2D screen coordinates.
 *
 * @example
 * ```typescript
 * // Create a camera at origin, looking forward (north)
 * const camera = new Camera(new Vector3(0, 0, 0), 0, 400);
 *
 * // Move forward and turn right
 * camera.position.z += 10;
 * camera.rotation -= Math.PI / 4; // Turn 45° clockwise
 * ```
 *
 * @see Renderer3D for how the camera is used in rendering
 * @see docs/3d_engine_design.md for architectural overview
 */
export class Camera {
  /** Position in world space (x: right, y: down, z: forward) */
  public position: Vector3;

  /** Horizontal rotation angle in radians (yaw). 0 = facing +Z (north) */
  public rotation: number;

  /** Field of view as focal length. Higher values = narrower FOV, less distortion */
  public fov: number;

  /**
   * Create a new camera.
   *
   * @param position - Initial position in world space (default: origin)
   * @param rotation - Initial yaw rotation in radians (default: 0, facing +Z)
   * @param fov - Field of view as focal length (default: 400)
   */
  constructor(position: Vector3 = new Vector3(0, 0, 0), rotation: number = 0, fov: number = 400) {
    this.position = position;
    this.rotation = rotation;
    this.fov = fov;
  }
}
