import { describe, it, expect } from 'vitest';
import { Vector2, aabbCollision, rayIntersectsAABB } from '../math';
import { Vector3 } from '../Vector3';

describe('Vector2', () => {
  it('creates a vector with default values', () => {
    const v = new Vector2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('creates a vector with specified values', () => {
    const v = new Vector2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('adds two vectors', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    const result = a.add(b);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it('scales a vector', () => {
    const v = new Vector2(2, 3);
    const result = v.scale(2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it('clones a vector', () => {
    const v = new Vector2(5, 7);
    const clone = v.clone();
    expect(clone.x).toBe(5);
    expect(clone.y).toBe(7);
    expect(clone).not.toBe(v);
  });
});

describe('Vector3', () => {
  it('creates a vector with default z=1', () => {
    const v = new Vector3(10, 20);
    expect(v.z).toBe(1);
  });

  it('projects to 2D with z=1 (no scaling)', () => {
    const v = new Vector3(100, 50, 1);
    const result = v.project();
    expect(result.x).toBe(100);
    expect(result.y).toBe(50);
  });

  it('projects to 2D with z=2 (half scale)', () => {
    const v = new Vector3(100, 50, 2);
    const result = v.project();
    expect(result.x).toBe(50);
    expect(result.y).toBe(25);
  });

  it('projects with screen center offset', () => {
    const v = new Vector3(100, 50, 2);
    const center = new Vector2(400, 300);
    const result = v.project(1, center);
    expect(result.x).toBe(450); // 400 + 100/2
    expect(result.y).toBe(325); // 300 + 50/2
  });
});

describe('aabbCollision', () => {
  it('detects overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(aabbCollision(a, b)).toBe(true);
  });

  it('detects non-overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(aabbCollision(a, b)).toBe(false);
  });

  it('detects touching boxes as non-colliding (edge case)', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(aabbCollision(a, b)).toBe(false);
  });
});

describe('rayIntersectsAABB', () => {
  it('detects ray hitting a box', () => {
    const origin = new Vector2(0, 5);
    const direction = new Vector2(20, 0);
    const box = { x: 10, y: 0, width: 5, height: 10 };

    const hit = rayIntersectsAABB(origin, direction, box);
    expect(hit).not.toBeNull();
    expect(hit!.contactTime).toBeCloseTo(0.5); // Hit at x=10, halfway through direction
    expect(hit!.contactNormal.x).toBe(-1); // Hit left face
    expect(hit!.contactNormal.y).toBe(0);
  });

  it('returns null when ray misses box', () => {
    const origin = new Vector2(0, 20);
    const direction = new Vector2(20, 0);
    const box = { x: 10, y: 0, width: 5, height: 10 };

    const hit = rayIntersectsAABB(origin, direction, box);
    expect(hit).toBeNull();
  });

  it('returns null when box is behind ray origin', () => {
    const origin = new Vector2(20, 5);
    const direction = new Vector2(10, 0); // Moving right, away from box
    const box = { x: 0, y: 0, width: 5, height: 10 };

    const hit = rayIntersectsAABB(origin, direction, box);
    expect(hit).toBeNull();
  });

  it('returns null when box is too far', () => {
    const origin = new Vector2(0, 5);
    const direction = new Vector2(5, 0); // Only moves 5 units, box is at 10
    const box = { x: 10, y: 0, width: 5, height: 10 };

    const hit = rayIntersectsAABB(origin, direction, box);
    expect(hit).toBeNull();
  });
});
