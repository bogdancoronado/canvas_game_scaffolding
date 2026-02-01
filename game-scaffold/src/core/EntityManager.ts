import type { Entity } from './Entity';
import { isDestroyable } from './Entity';

/**
 * Manages the lifecycle of all entities in a game or scene.
 * 
 * Features:
 * - Add/remove entities dynamically
 * - Automatic cleanup of destroyed entities
 * - Z-sorted rendering (higher z = rendered first = behind)
 * - Type-safe entity querying
 */
export class EntityManager {
  private entities: Entity[] = [];
  private toAdd: Entity[] = [];
  private toRemove: Set<Entity> = new Set();

  /**
   * Add an entity to be managed.
   * Entity is added at the start of the next update cycle to avoid
   * modification during iteration.
   * 
   * @returns The entity for chaining
   */
  add<T extends Entity>(entity: T): T {
    this.toAdd.push(entity);
    return entity;
  }

  /**
   * Mark an entity for removal.
   * Entity is removed at the start of the next update cycle.
   */
  remove(entity: Entity): void {
    this.toRemove.add(entity);
  }

  /**
   * Get all entities, optionally filtered by type.
   * 
   * @example
   * ```typescript
   * const balls = entities.getAll(Ball);
   * const everything = entities.getAll();
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAll<T extends Entity>(type?: new (...args: any[]) => T): T[] {
    if (type) {
      return this.entities.filter((e): e is T => e instanceof type);
    }
    return this.entities as T[];
  }

  /**
   * Get the first entity matching the type, or undefined.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFirst<T extends Entity>(type: new (...args: any[]) => T): T | undefined {
    return this.entities.find((e): e is T => e instanceof type);
  }

  /**
   * Get the count of active entities.
   */
  get count(): number {
    return this.entities.length;
  }

  /**
   * Update all entities and process additions/removals.
   * 
   * Order:
   * 1. Add pending entities
   * 2. Remove pending entities (with cleanup)
   * 3. Update all active entities
   * 4. Mark-and-sweep destroyed entities
   */
  update(dt: number): void {
    // Add pending entities
    if (this.toAdd.length > 0) {
      this.entities.push(...this.toAdd);
      this.toAdd = [];
    }

    // Remove pending entities
    if (this.toRemove.size > 0) {
      this.entities = this.entities.filter((e) => {
        if (this.toRemove.has(e)) {
          if (isDestroyable(e)) {
            e.destroy();
          }
          return false;
        }
        return true;
      });
      this.toRemove.clear();
    }

    // Update all entities
    for (const entity of this.entities) {
      entity.update(dt);
    }

    // Remove destroyed entities
    this.entities = this.entities.filter((e) => {
      if (e.destroyed) {
        if (isDestroyable(e)) {
          e.destroy();
        }
        return false;
      }
      return true;
    });
  }

  /**
   * Render all entities, sorted by z-depth.
   * Higher z values are rendered first (appear behind lower z values).
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Sort by z descending (far objects first, close objects last)
    const sorted = [...this.entities].sort((a, b) => b.position.z - a.position.z);

    for (const entity of sorted) {
      entity.render(ctx);
    }
  }

  /**
   * Remove all entities and call destroy on those that implement it.
   */
  clear(): void {
    for (const entity of this.entities) {
      if (isDestroyable(entity)) {
        entity.destroy();
      }
    }
    this.entities = [];
    this.toAdd = [];
    this.toRemove.clear();
  }
}
