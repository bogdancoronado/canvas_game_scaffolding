# 3D Engine Architecture

This document describes the custom 3D engine implemented in `src/core/3d`. The engine provides a lightweight, retro-style 3D rendering capability using the HTML5 Canvas 2D context.

## Core Concepts

The engine uses a standard rasterization pipeline simplified for 2.5D dungeon crawlers (similar to Wolfenstein 3D logic but with full 3D vertices).

### 1. Camera (`src/core/3d/Camera.ts`)
Represents the viewer in the world.
- **Position**: `Vector3` (x, y, z).
- **Rotation**: Yaw angle in radians.
- **FOV**: Field of View (represented as focal length).

### 2. Mesh (`src/core/3d/Mesh.ts`)
A collection of 3D faces (polygons) that make up an object.
- **Faces**: defined by 2 bottom points (`p1`, `p2`). The engine assumes vertical walls.
- **Transforms**: Position, Rotation, Scale.
- **Static Helpers**: `createCube`, `createRoom`.

### 3. Renderer3D (`src/core/3d/Renderer3D.ts`)
The main rendering pipeline.

#### Pipeline Stages:
1.  **World Transform**: Converts Mesh Local coordinates -> World coordinates.
2.  **View Transform**: Converts World coordinates -> Camera local coordinates.
    *   translates world relative to camera position.
    *   rotates world opposite to camera rotation.
3.  **Back-Face Culling**: (Implicitly via sorting, future optimization).
4.  **Sorting**: Uses Painter's Algorithm (sorts faces by average depth, far to near).
5.  **Clipping**: Clips geometry against the Near Plane (`Z = 1.0`) to prevent division by zero or behind-camera rendering.
6.  **Projection**: Projects 3D points to 2D screen space.
    *   `x_screen = (x / z) * fov + center_x`
    *   `y_screen = (y / z) * fov + center_y`
7.  **Rasterization**: Draws filled polygons using `Canvas2D` paths.

## Coordinate System
- **X**: Right (+) / Left (-)
- **Y**: Down (+) / Up (-) [World Y=0 is center]
- **Z**: Forward (+) / Backward (-)

## Usage Example

```typescript
// 1. Initialize
const camera = new Camera(new Vector3(0, 0, 0));
const renderer = new Renderer3D(ctx, width, height);

// 2. Create Content
const cube = Mesh.createCube(50, '#00ff00');
const scene = [cube];

// 3. Render Loop
function render() {
  renderer.render(scene, camera);
}
```
