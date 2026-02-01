import type { BoundingBox } from '../utils/math';
import { Vector3 } from '../utils/Vector3';

/**
 * Base interface for all game entities.
 * 
 * Entities are objects that exist in the game world with:
 * - A position in 3D space (z for depth/layering)
 * - A bounding box for collision detection
 * - Update and render lifecycle methods
 * 
 * The EntityManager handles calling update/render on all entities
 * and removing destroyed entities.
 */
export interface Entity {
  /**
   * Position in world space.
   * - x, y: 2D position
   * - z: Depth for layering/perspective (z=1 is the default plane)
   */
  position: Vector3;

  /**
   * Axis-aligned bounding box for collision detection.
   * This should be the 2D projection of the entity's hitbox.
   */
  readonly bounds: BoundingBox;

  /**
   * Update the entity's state.
   * Called every frame by the EntityManager.
   * 
   * @param dt - Delta time in seconds since last frame
   */
  update(dt: number): void;

  /**
   * Render the entity to the canvas.
   * Called every frame by the EntityManager, sorted by z-depth.
   * 
   * @param ctx - The 2D rendering context
   */
  render(ctx: CanvasRenderingContext2D): void;

  /**
   * Whether this entity should be removed from the game.
   * Set to true to have EntityManager remove it on next update.
   */
  destroyed: boolean;
}

/**
 * Optional interface for entities that need cleanup when removed.
 * Entities implementing this will have destroy() called when removed
 * from the EntityManager or when the game stops.
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * Type guard to check if an entity implements Destroyable.
 */
export function isDestroyable(entity: Entity): entity is Entity & Destroyable {
  return 'destroy' in entity && typeof (entity as Destroyable).destroy === 'function';
}
