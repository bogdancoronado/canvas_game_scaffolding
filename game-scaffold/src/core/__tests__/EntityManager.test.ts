import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager } from '../EntityManager';
import type { Entity } from '../Entity';
import { Vector3 } from '../../utils/Vector3';

// Mock entity for testing
class MockEntity implements Entity {
  position: Vector3;
  destroyed = false;

  get bounds() {
    return { x: this.position.x, y: this.position.y, width: 10, height: 10 };
  }

  update = vi.fn();
  render = vi.fn();

  constructor(x = 0, y = 0, z = 1) {
    this.position = new Vector3(x, y, z);
  }
}

describe('EntityManager', () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  it('adds entities', () => {
    const entity = new MockEntity();
    manager.add(entity);
    manager.update(0); // Process pending additions

    expect(manager.count).toBe(1);
  });

  it('returns the added entity for chaining', () => {
    const entity = new MockEntity();
    const returned = manager.add(entity);

    expect(returned).toBe(entity);
  });

  it('updates all entities', () => {
    const e1 = new MockEntity();
    const e2 = new MockEntity();
    manager.add(e1);
    manager.add(e2);
    manager.update(0.016);

    expect(e1.update).toHaveBeenCalledWith(0.016);
    expect(e2.update).toHaveBeenCalledWith(0.016);
  });

  it('removes destroyed entities after update', () => {
    const entity = new MockEntity();
    manager.add(entity);
    manager.update(0);
    expect(manager.count).toBe(1);

    entity.destroyed = true;
    manager.update(0);
    expect(manager.count).toBe(0);
  });

  it('renders entities sorted by z (far to near)', () => {
    const ctx = {} as CanvasRenderingContext2D;
    const far = new MockEntity(0, 0, 10);
    const near = new MockEntity(0, 0, 1);
    const middle = new MockEntity(0, 0, 5);

    manager.add(near);
    manager.add(far);
    manager.add(middle);
    manager.update(0);
    manager.render(ctx);

    // Check render order: far -> middle -> near
    const farOrder = far.render.mock.invocationCallOrder[0];
    const middleOrder = middle.render.mock.invocationCallOrder[0];
    const nearOrder = near.render.mock.invocationCallOrder[0];

    expect(farOrder).toBeLessThan(middleOrder);
    expect(middleOrder).toBeLessThan(nearOrder);
  });

  it('getAll returns all entities', () => {
    manager.add(new MockEntity());
    manager.add(new MockEntity());
    manager.update(0);

    expect(manager.getAll().length).toBe(2);
  });

  it('getFirst returns the first matching entity', () => {
    const first = new MockEntity(1, 1);
    const second = new MockEntity(2, 2);
    manager.add(first);
    manager.add(second);
    manager.update(0);

    const found = manager.getFirst(MockEntity);
    expect(found).toBe(first);
  });

  it('clear removes all entities', () => {
    manager.add(new MockEntity());
    manager.add(new MockEntity());
    manager.update(0);
    expect(manager.count).toBe(2);

    manager.clear();
    expect(manager.count).toBe(0);
  });
});
