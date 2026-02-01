import { describe, it, expect } from 'vitest';
import { Camera } from '../Camera';
import { Vector3 } from '../../../utils/Vector3';

describe('Camera', () => {
  it('initializes with default values', () => {
    const cam = new Camera();
    expect(cam.position.x).toBe(0);
    expect(cam.position.y).toBe(0);
    expect(cam.position.z).toBe(0);
    expect(cam.rotation).toBe(0);
    expect(cam.fov).toBe(400);
  });

  it('initializes with custom values', () => {
    const pos = new Vector3(10, 20, 30);
    const cam = new Camera(pos, Math.PI, 500);

    expect(cam.position.x).toBe(10);
    expect(cam.position.y).toBe(20);
    expect(cam.position.z).toBe(30);
    expect(cam.rotation).toBe(Math.PI);
    expect(cam.fov).toBe(500);
  });
});
