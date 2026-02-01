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
      expect(input.isKeyDown('KeyA')).toBe(false);

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      expect(input.isKeyDown('KeyA')).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
      expect(input.isKeyDown('KeyA')).toBe(false);
    });

    it('tracks key pressed (first frame only)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' }));
      expect(input.isKeyPressed('KeyB')).toBe(true);

      input.endFrame();
      expect(input.isKeyPressed('KeyB')).toBe(false);
      expect(input.isKeyDown('KeyB')).toBe(true); // Still down
    });

    it('tracks key released (first frame only)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC' }));
      input.endFrame();

      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyC' }));
      expect(input.isKeyReleased('KeyC')).toBe(true);

      input.endFrame();
      expect(input.isKeyReleased('KeyC')).toBe(false);
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
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }));
      expect(input.isKeyDown('KeyX')).toBe(false);
    });
  });
});
