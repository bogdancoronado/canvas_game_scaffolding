import { describe, it, expect } from 'vitest';
import { Vector2, rotateVector2, intersectLineLine, lerp } from '../math';

describe('Math Extensions', () => {
  describe('rotateVector2', () => {
    it('rotates a vector by 90 degrees', () => {
      const v = new Vector2(1, 0);
      const rotated = rotateVector2(v, Math.PI / 2);
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(1);
    });

    it('rotates a vector by 180 degrees', () => {
      const v = new Vector2(1, 0);
      const rotated = rotateVector2(v, Math.PI);
      expect(rotated.x).toBeCloseTo(-1);
      expect(rotated.y).toBeCloseTo(0);
    });
  });

  describe('intersectLineLine', () => {
    it('finds intersection of perpendicular lines', () => {
      const p1 = new Vector2(0, 1);
      const p2 = new Vector2(0, -1);
      const p3 = new Vector2(-1, 0);
      const p4 = new Vector2(1, 0);

      const intersection = intersectLineLine(p1, p2, p3, p4);
      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBeCloseTo(0);
      expect(intersection!.y).toBeCloseTo(0);
    });

    it('returns null for parallel lines', () => {
      const p1 = new Vector2(0, 0);
      const p2 = new Vector2(1, 0);
      const p3 = new Vector2(0, 1);
      const p4 = new Vector2(1, 1);

      const intersection = intersectLineLine(p1, p2, p3, p4);
      expect(intersection).toBeNull();
    });
  });

  describe('lerp', () => {
    it('interpolates between values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0.25)).toBe(2.5);
      expect(lerp(100, 200, 0.5)).toBe(150);
    });
  });
});
