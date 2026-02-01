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

/**
 * Result of a raycast intersection test
 */
export interface RaycastHit {
  /**
   * Normalized time of collision along the ray (0 = at origin, 1 = at full distance).
   * Values between 0 and 1 indicate a hit within the ray's travel distance.
   */
  contactTime: number;

  /** The exact point where the ray first touches the box */
  contactPoint: Vector2;

  /**
   * Normal vector pointing away from the hit surface.
   * Use this to reflect the moving object: velocity = velocity - 2 * (velocity · normal) * normal
   * Or simply: if normal.x !== 0, flip velocity.x; if normal.y !== 0, flip velocity.y
   */
  contactNormal: Vector2;
}

/**
 * Test if a ray intersects an Axis-Aligned Bounding Box using the slab method.
 * 
 * This is used for Continuous Collision Detection (CCD) to prevent fast-moving
 * objects from tunneling through thin targets. Instead of checking if boxes
 * overlap AFTER movement, this checks if the movement PATH crosses the box.
 * 
 * The "slab method" treats the box as the intersection of two axis-aligned slabs
 * (one for X, one for Y). A ray intersects the box if and only if the X and Y
 * intersection intervals overlap.
 * 
 * @param rayOrigin - Starting point of the ray (object's position before movement)
 * @param rayDirection - Movement vector for this frame (velocity × dt, not normalized)
 * @param box - The axis-aligned bounding box to test against
 * @returns Hit information if intersection occurs within ray length, null otherwise
 * 
 * @example
 * ```typescript
 * const movement = ball.velocity.scale(dt);
 * const hit = rayIntersectsAABB(ball.position, movement, brick.bounds);
 * if (hit) {
 *   ball.position = hit.contactPoint;
 *   if (hit.contactNormal.x !== 0) ball.reflectX();
 *   else ball.reflectY();
 * }
 * ```
 */
export function rayIntersectsAABB(
  rayOrigin: Vector2,
  rayDirection: Vector2,
  box: AABB
): RaycastHit | null {
  // Avoid division by zero: use Infinity for axis-aligned rays
  // (if direction.x is 0, the ray never crosses vertical edges)
  const inverseDirectionX = rayDirection.x !== 0 ? 1 / rayDirection.x : Infinity;
  const inverseDirectionY = rayDirection.y !== 0 ? 1 / rayDirection.y : Infinity;

  // Calculate the "time" (0..1 normalized) when the ray crosses each edge of the box.
  // Time = distance / speed, but we express it as a fraction of the total movement.
  //
  // For example, if box.x = 100 and rayOrigin.x = 50 with rayDirection.x = 200:
  //   timeToLeftEdge = (100 - 50) / 200 = 0.25 (ray crosses left edge at 25% of movement)
  const timeToBoxLeftEdge = (box.x - rayOrigin.x) * inverseDirectionX;
  const timeToBoxRightEdge = (box.x + box.width - rayOrigin.x) * inverseDirectionX;
  const timeToBoxTopEdge = (box.y - rayOrigin.y) * inverseDirectionY;
  const timeToBoxBottomEdge = (box.y + box.height - rayOrigin.y) * inverseDirectionY;

  // Determine entry and exit times for each axis.
  // "Entry" is when we first enter the slab, "exit" is when we leave it.
  // Which edge is entry vs exit depends on ray direction.
  const timeEnterXSlab = Math.min(timeToBoxLeftEdge, timeToBoxRightEdge);
  const timeExitXSlab = Math.max(timeToBoxLeftEdge, timeToBoxRightEdge);
  const timeEnterYSlab = Math.min(timeToBoxTopEdge, timeToBoxBottomEdge);
  const timeExitYSlab = Math.max(timeToBoxTopEdge, timeToBoxBottomEdge);

  // The ray is inside the box only when it's inside BOTH slabs simultaneously.
  // Entry into box = when we've entered BOTH slabs (max of entry times)
  // Exit from box = when we've left EITHER slab (min of exit times)
  const timeEnterBox = Math.max(timeEnterXSlab, timeEnterYSlab);
  const timeExitBox = Math.min(timeExitXSlab, timeExitYSlab);

  // No intersection cases:
  // 1. timeExitBox < 0: Box is entirely behind the ray origin
  // 2. timeEnterBox > timeExitBox: Ray misses the box (slabs don't overlap)
  // 3. timeEnterBox > 1: Box is beyond the ray's travel distance this frame
  if (timeExitBox < 0 || timeEnterBox > timeExitBox || timeEnterBox > 1) {
    return null;
  }

  // Use entry time, unless ray started inside the box (negative entry time)
  const contactTime = timeEnterBox < 0 ? timeExitBox : timeEnterBox;

  // If contact time is > 1, the hit is beyond this frame's movement
  if (contactTime > 1) {
    return null;
  }

  // Calculate the exact contact point
  const contactPoint = new Vector2(
    rayOrigin.x + rayDirection.x * contactTime,
    rayOrigin.y + rayDirection.y * contactTime
  );

  // Determine which face was hit based on which slab we entered last.
  // The "last entered" slab is the one that determines the entry point.
  let contactNormal: Vector2;
  if (timeEnterXSlab > timeEnterYSlab) {
    // Hit a vertical face (left or right side of box)
    // Normal points opposite to ray direction on that axis
    contactNormal = new Vector2(rayDirection.x > 0 ? -1 : 1, 0);
  } else {
    // Hit a horizontal face (top or bottom of box)
    contactNormal = new Vector2(0, rayDirection.y > 0 ? -1 : 1);
  }

  return { contactTime, contactPoint, contactNormal };
}
