import { Vector3 } from '../utils/Vector3';

/**
 * A wall segment in the dungeon.
 *
 * Walls are defined by two floor points (p1, p2) and a color.
 * The renderer automatically extrudes these into vertical surfaces.
 */
export interface Wall {
  /** First endpoint of the wall base */
  p1: Vector3;
  /** Second endpoint of the wall base */
  p2: Vector3;
  /** Fill color (CSS color string) */
  color: string;
}

/**
 * Procedural level generator for dungeon-crawler games.
 *
 * Currently provides a test level with a main room, pillars, and
 * nested inner rooms. Future versions could procedurally generate
 * full dungeon layouts with hallways and rooms.
 *
 * @see SimpleDoomGame for usage
 * @see docs/simple_doom_design.md for design details
 */
export class DungeonGenerator {
  /**
   * Generate a simple test room with some pillars.
   */
  static generateTestLevel(): Wall[] {
    const walls: Wall[] = [];

    // Helper to add a wall
    const addWall = (x1: number, z1: number, x2: number, z2: number, color: string) => {
      walls.push({
        p1: new Vector3(x1, 0, z1),
        p2: new Vector3(x2, 0, z2),
        color
      });
    };

    const SIZE = 200;

    // Outer walls - Deep Indigo/Purple
    const WALL_COLOR_1 = '#4b0082'; // Indigo
    const WALL_COLOR_2 = '#8a2be2'; // BlueViolet

    addWall(-SIZE, -SIZE, SIZE, -SIZE, WALL_COLOR_1); // North
    addWall(SIZE, -SIZE, SIZE, SIZE, WALL_COLOR_2);   // East
    addWall(SIZE, SIZE, -SIZE, SIZE, WALL_COLOR_1);   // South
    addWall(-SIZE, SIZE, -SIZE, -SIZE, WALL_COLOR_2); // West

    // Helper to add a cube (4 walls)
    const addCube = (cx: number, cz: number, size: number, color: string) => {
      const half = size / 2;
      // Front (South face)
      addWall(cx - half, cz + half, cx + half, cz + half, color);
      // Right (East face)
      addWall(cx + half, cz + half, cx + half, cz - half, color);
      // Back (North face)
      addWall(cx + half, cz - half, cx - half, cz - half, color);
      // Left (West face)
      addWall(cx - half, cz - half, cx - half, cz + half, color);
    };

    // Place Cubes - NEON PALETTE
    addCube(0, 100, 50, '#00ffff');    // Cyan (Center)
    addCube(-100, 100, 50, '#ff00ff'); // Magenta (Left)
    addCube(100, 100, 50, '#00ff00');  // Lime (Right)

    // Pillars - Bright Orange
    const pillarColor = '#ffaa00';
    addWall(-50, -50, -50, -100, pillarColor);
    addWall(-50, -100, -100, -100, pillarColor);
    addWall(-100, -100, -100, -50, pillarColor);
    addWall(-100, -50, -50, -50, pillarColor);

    // Blue room walls - Electric Blue
    const blueWall = '#0088ff';
    addWall(50, 50, 100, 50, blueWall);
    addWall(100, 50, 100, 100, blueWall);
    addWall(100, 100, 50, 100, blueWall);
    addWall(50, 100, 50, 50, blueWall);

    return walls;
  }
}
