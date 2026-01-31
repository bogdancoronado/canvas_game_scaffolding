/**
 * 2D Vector utility class for positions and velocities.
 * Immutable - all operations return new Vector2 instances.
 */
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) { }

  /**
   * Add another vector to this one.
   * @param v The vector to add
   * @returns A new Vector2 with the sum
   */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * Scale this vector by a scalar value.
   * @param scalar The multiplier
   * @returns A new Vector2 scaled by the scalar
   */
  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * Create a copy of this vector.
   * @returns A new Vector2 with the same x and y values
   */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

/**
 * Axis-Aligned Bounding Box (AABB)
 * 
 * A rectangular collision shape that is always aligned with the coordinate axes
 * (never rotated). This is the most common and efficient collision shape for 2D games.
 * 
 * The box is defined by its top-left corner (x, y) and its dimensions (width, height):
 * 
 *     x
 *     ├──── width ────┤
 *     ┌───────────────┐ ─┬─ y
 *     │               │  │
 *     │     AABB      │  height
 *     │               │  │
 *     └───────────────┘ ─┴─
 * 
 * Why AABB?
 * - Very fast collision detection (only 4 comparisons)
 * - Simple to implement and debug
 * - Memory efficient (only 4 numbers)
 * - Sufficient accuracy for most arcade-style games
 */
export interface AABB {
  /** Left edge X position */
  x: number;
  /** Top edge Y position */
  y: number;
  /** Horizontal size */
  width: number;
  /** Vertical size */
  height: number;
}

/**
 * Check if two Axis-Aligned Bounding Boxes are overlapping.
 * 
 * This is the fastest possible rectangle intersection test, requiring only
 * 4 comparisons. Two AABBs overlap if and only if they overlap on BOTH axes.
 * 
 * The test checks:
 * 1. A's left edge is left of B's right edge
 * 2. A's right edge is right of B's left edge
 * 3. A's top edge is above B's bottom edge
 * 4. A's bottom edge is below B's top edge
 * 
 * @param a First bounding box
 * @param b Second bounding box
 * @returns true if the boxes overlap, false otherwise
 */
export function aabbCollision(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&      // A's left < B's right
    a.x + a.width > b.x &&      // A's right > B's left
    a.y < b.y + b.height &&     // A's top < B's bottom
    a.y + a.height > b.y        // A's bottom > B's top
  );
}

/**
 * Determine which side of the target box was hit by a moving box.
 * 
 * This function is essential for proper collision response - knowing which
 * side was hit tells us how to reflect the moving object (flip X or Y velocity).
 * 
 * Algorithm:
 * 1. Calculate the overlap depth on all four sides
 * 2. Find the axis with minimum overlap (that's where penetration started)
 * 3. Use velocity direction to disambiguate (e.g., moving right = hit left side)
 * 
 * @param ball The moving object's bounding box
 * @param target The stationary object's bounding box
 * @param ballVelocity The moving object's velocity (used to determine approach direction)
 * @returns 'top', 'bottom', 'left', 'right', or null if no collision
 */
export function getCollisionSide(
  ball: AABB,
  target: AABB,
  ballVelocity: Vector2
): 'top' | 'bottom' | 'left' | 'right' | null {
  if (!aabbCollision(ball, target)) return null;

  // Calculate how deep the overlap is on each side
  const overlapLeft = ball.x + ball.width - target.x;
  const overlapRight = target.x + target.width - ball.x;
  const overlapTop = ball.y + ball.height - target.y;
  const overlapBottom = target.y + target.height - ball.y;

  // Find minimum overlap on each axis
  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  // The axis with smaller overlap is where the collision occurred
  // Velocity helps disambiguate when overlaps are equal:
  // - If moving right (vx > 0) and hit something, we hit its LEFT side
  // - If moving down (vy > 0) and hit something, we hit its TOP
  if (minOverlapX < minOverlapY) {
    return ballVelocity.x > 0 ? 'left' : 'right';
  } else {
    return ballVelocity.y > 0 ? 'top' : 'bottom';
  }
}
