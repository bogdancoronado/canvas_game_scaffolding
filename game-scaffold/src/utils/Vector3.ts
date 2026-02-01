import { Vector2 } from './math';

/**
 * 3D Vector class for positions in world space.
 * 
 * The z component represents depth:
 * - z = 1: Objects at the screen plane (no scaling)
 * - z > 1: Objects farther away (appear smaller)
 * - z < 1: Objects closer (appear larger)
 * 
 * This enables pseudo-3D rendering on a 2D canvas using perspective projection.
 */
export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 1
  ) { }

  /**
   * Add another vector to this one.
   */
  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  /**
   * Subtract another vector from this one.
   */
  subtract(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  /**
   * Scale this vector by a scalar value.
   */
  scale(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /**
   * Get the length (magnitude) of this vector.
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Return a normalized (unit length) version of this vector.
   */
  normalize(): Vector3 {
    const mag = this.magnitude();
    if (mag === 0) return new Vector3(0, 0, 0);
    return this.scale(1 / mag);
  }

  /**
   * Create a copy of this vector.
   */
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * Project this 3D point to 2D screen coordinates using perspective division.
   * 
   * The formula x_2d = x/z, y_2d = y/z creates a perspective effect where
   * objects with larger z appear smaller (farther away).
   * 
   * @param focalLength - Controls the "field of view". Higher = less distortion.
   *                      Default of 1 means direct division by z.
   * @param screenCenter - The center point of the screen (where z-axis intersects).
   *                       Projection is relative to this point.
   * @returns 2D screen coordinates
   * 
   * @example
   * ```typescript
   * const worldPos = new Vector3(100, 50, 2); // Point at z=2
   * const screenPos = worldPos.project(1, new Vector2(400, 300));
   * // Result: (450, 325) - point appears at half scale from center
   * ```
   */
  project(focalLength: number = 1, screenCenter: Vector2 = new Vector2(0, 0)): Vector2 {
    // Avoid division by zero or negative z
    const safeZ = Math.max(this.z, 0.001);
    const scale = focalLength / safeZ;

    // Project relative to screen center
    return new Vector2(
      screenCenter.x + this.x * scale,
      screenCenter.y + this.y * scale
    );
  }

  /**
   * Get the 2D position (ignoring z). Useful when z is just for sorting.
   */
  toVector2(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * Create a Vector3 from a Vector2, with optional z value.
   */
  static fromVector2(v: Vector2, z: number = 1): Vector3 {
    return new Vector3(v.x, v.y, z);
  }
}
