# Game Framework Refactor Plan

> **Created:** January 2026  
> **Status:** Pending Review

---

## Overview

Improvements identified during architectural review. Each item is self-contained and should be implemented in order.

---

## 1. Fix Canvas Context Transform Stacking

**Problem:** `ctx.scale(dpr, dpr)` in `resize()` is called on every window resize. Canvas transforms are multiplicative—after N resizes, scale becomes `dpr^N`.

**Fix:** Replace `ctx.scale()` with `ctx.setTransform()` which resets and sets atomically.

**File:** [Game.ts](file:///Users/bgdan/projects/experimental/canvas_game/game-scaffold/src/Game.ts)

```diff
- this.ctx.scale(dpr, dpr);
+ this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

**Risk:** Low. One-line change.

---

## 2. Event Listener Cleanup in `stop()`

**Problem:** `Game.ts` and `ArkanoidGame.ts` add event listeners but never remove them. If a game is stopped and recreated, listeners stack.

**Fix:** 
- Store listener references as bound methods
- Remove all listeners in `stop()`

**Files:** 
- [Game.ts](file:///Users/bgdan/projects/experimental/canvas_game/game-scaffold/src/Game.ts)
- [ArkanoidGame.ts](file:///Users/bgdan/projects/experimental/canvas_game/game-scaffold/src/ArkanoidGame.ts)

**Implementation pattern:**
```typescript
// Store bound handlers
private boundResize = this.resize.bind(this);

constructor() {
  window.addEventListener('resize', this.boundResize);
}

public stop(): void {
  this.running = false;
  window.removeEventListener('resize', this.boundResize);
}
```

**Risk:** Low. Mechanical refactor.

---

## 3. Entity Lifecycle / Destroyable Interface

**Problem:** No pattern for entity cleanup. Entities with event listeners or external resources can't clean up on game stop.

**Fix:** Add optional `Destroyable` interface at framework level.

**Files:**
- [Game.ts](file:///Users/bgdan/projects/experimental/canvas_game/game-scaffold/src/Game.ts) — add interface and entity registry
- Entity files — implement `destroy()` where needed

**New interface:**
```typescript
export interface Destroyable {
  destroy(): void;
}
```

**Base class additions:**
```typescript
protected entities: Destroyable[] = [];

protected registerEntity<T extends Destroyable>(entity: T): T {
  this.entities.push(entity);
  return entity;
}

public stop(): void {
  this.running = false;
  this.entities.forEach(e => e.destroy());
  this.entities = [];
  // ... listener cleanup from item 2
}
```

**Risk:** Low. Additive, non-breaking.

---

## 4. Swept AABB Collision Detection (CCD)

**Problem:** Fast-moving objects can tunnel through thin targets if `velocity * dt > target thickness`.

**Fix:** Add swept ray-vs-AABB collision to `utils/math.ts`. Use for ball-vs-brick when high precision needed.

**File:** [utils/math.ts](file:///Users/bgdan/projects/experimental/canvas_game/game-scaffold/src/utils/math.ts)

**Implementation:**

```typescript
export interface RaycastHit {
  /** Time of collision along the ray, 0..1 normalized to distance traveled */
  contactTime: number;
  /** Contact point where the ray intersects the box */
  contactPoint: Vector2;
  /** Normal vector pointing away from the hit surface */
  contactNormal: Vector2;
}

/**
 * Test if a ray intersects an AABB, returning the first contact point.
 * Used for continuous collision detection to prevent tunneling.
 * 
 * @param rayOrigin - Starting point of the ray
 * @param rayDirection - Direction vector (does not need to be normalized)
 * @param box - The axis-aligned bounding box to test against
 * @returns Hit information if intersection occurs, null otherwise
 */
export function rayIntersectsAABB(
  rayOrigin: Vector2,
  rayDirection: Vector2,
  box: AABB
): RaycastHit | null {
  // Compute inverse direction to avoid division in the loop
  // Handle zero direction components to avoid infinity
  const inverseDirectionX = rayDirection.x !== 0 ? 1 / rayDirection.x : Infinity;
  const inverseDirectionY = rayDirection.y !== 0 ? 1 / rayDirection.y : Infinity;

  // Calculate intersection times with the near and far planes of the box
  // For X axis: when does the ray cross the left edge? The right edge?
  const timeToLeftEdge = (box.x - rayOrigin.x) * inverseDirectionX;
  const timeToRightEdge = (box.x + box.width - rayOrigin.x) * inverseDirectionX;
  const timeToTopEdge = (box.y - rayOrigin.y) * inverseDirectionY;
  const timeToBottomEdge = (box.y + box.height - rayOrigin.y) * inverseDirectionY;

  // Determine which times are entry vs exit for each axis
  const timeEnterX = Math.min(timeToLeftEdge, timeToRightEdge);
  const timeExitX = Math.max(timeToLeftEdge, timeToRightEdge);
  const timeEnterY = Math.min(timeToTopEdge, timeToBottomEdge);
  const timeExitY = Math.max(timeToTopEdge, timeToBottomEdge);

  // The ray enters the box when it has entered BOTH slabs
  // The ray exits the box when it has exited EITHER slab
  const timeEnterBox = Math.max(timeEnterX, timeEnterY);
  const timeExitBox = Math.min(timeExitX, timeExitY);

  // No intersection if:
  // - Ray exits before it enters (no overlap)
  // - Ray exits behind the origin (box is behind us)
  // - Ray enters after traveling full distance (box is too far)
  if (timeExitBox < 0 || timeEnterBox > timeExitBox || timeEnterBox > 1) {
    return null;
  }

  // Use entry time unless we started inside the box
  const contactTime = timeEnterBox < 0 ? timeExitBox : timeEnterBox;

  // Calculate the contact point
  const contactPoint = new Vector2(
    rayOrigin.x + rayDirection.x * contactTime,
    rayOrigin.y + rayDirection.y * contactTime
  );

  // Determine which face was hit based on which axis we entered last
  let contactNormal: Vector2;
  if (timeEnterX > timeEnterY) {
    // Hit a vertical face (left or right)
    contactNormal = new Vector2(rayDirection.x > 0 ? -1 : 1, 0);
  } else {
    // Hit a horizontal face (top or bottom)
    contactNormal = new Vector2(0, rayDirection.y > 0 ? -1 : 1);
  }

  return { contactTime, contactPoint, contactNormal };
}
```

**Usage in ArkanoidGame:**
```typescript
// Instead of checking overlap after movement:
const previousPosition = this.ball.position;
const movement = this.ball.velocity.scale(dt);

for (const brick of this.bricks.filter(b => b.alive)) {
  const hit = rayIntersectsAABB(previousPosition, movement, brick.bounds);
  if (hit) {
    // Move ball to contact point, reflect using hit.contactNormal
    this.ball.position = hit.contactPoint;
    if (hit.contactNormal.x !== 0) this.ball.reflectX();
    else this.ball.reflectY();
    brick.hit();
    break;
  }
}
```

**Risk:** Medium. New collision code path. Requires testing.

---

## 5. Fixed Timestep Game Loop (Deferred)

**Status:** Understood but deferred. Will implement when determinism is needed (multiplayer, replays, or testing).

**Pattern stored for reference:**
```typescript
private accumulator: number = 0;
private readonly PHYSICS_TIMESTEP: number = 1 / 60;

private loop(currentTime: number): void {
  const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
  this.lastTime = currentTime;
  this.accumulator += frameTime;

  while (this.accumulator >= this.PHYSICS_TIMESTEP) {
    this.update(this.PHYSICS_TIMESTEP);
    this.accumulator -= this.PHYSICS_TIMESTEP;
  }

  this.render();
  requestAnimationFrame((t) => this.loop(t));
}
```

---

## Implementation Order

| # | Item | Complexity | Dependencies |
|---|------|------------|--------------|
| 1 | Canvas transform fix | Trivial | None |
| 2 | Listener cleanup | Low | None |
| 3 | Destroyable interface | Low | Builds on #2 |
| 4 | Swept AABB / CCD | Medium | None |

---

## Not Addressed (Deferred)

- **Fixed timestep:** Implement when determinism needed
- **Dirty rendering:** Implement if mobile battery becomes concern
- **Audio:** Out of scope for now
- **Testing:** Separate initiative
- **Safari support:** Not required (Chrome + iOS + Android only)
