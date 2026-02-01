import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../InputManager';

describe('InputManager', () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
  });

  afterEach(() => {
    input.destroy();
  });

  describe('keyboard', () => {
    it('tracks key down state', () => {
      expect(input.isKeyDown('a')).toBe(false);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(input.isKeyDown('a')).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      expect(input.isKeyDown('a')).toBe(false);
    });

    it('tracks key pressed (first frame only)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      expect(input.isKeyPressed('b')).toBe(true);

      input.endFrame();
      expect(input.isKeyPressed('b')).toBe(false);
      expect(input.isKeyDown('b')).toBe(true); // Still down
    });

    it('tracks key released (first frame only)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      input.endFrame();

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'c' }));
      expect(input.isKeyReleased('c')).toBe(true);

      input.endFrame();
      expect(input.isKeyReleased('c')).toBe(false);
    });
  });

  describe('pointer', () => {
    it('tracks mouse position', () => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));

      expect(input.pointerPosition).not.toBeNull();
      expect(input.pointerPosition!.x).toBe(100);
      expect(input.pointerPosition!.y).toBe(200);
    });

    it('tracks mouse down state', () => {
      expect(input.isPointerDown()).toBe(false);

      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(input.isPointerDown()).toBe(true);

      window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
      expect(input.isPointerDown()).toBe(false);
    });

    it('tracks pointer pressed (first frame only)', () => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(input.isPointerPressed()).toBe(true);

      input.endFrame();
      expect(input.isPointerPressed()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes listeners on destroy', () => {
      input.destroy();

      // Key events should no longer work
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      expect(input.isKeyDown('x')).toBe(false);
    });
  });
});
