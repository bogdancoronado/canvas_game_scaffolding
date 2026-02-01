# SimpleDoom Design Document

## 1. Overview
SimpleDoom is a first-person procedural dungeon crawler. It uses a "2.5D" rendering engine where the world is 3D, but geometry is restricted to vertical walls and horizontal floors to simplify rendering and collision.

## 2. Core Architecture

### 2.1 Coordinate Systems
We use the standard engine systems but strictly interpret them for 1st person:
*   **World Space**: $x, z$ are the ground plane. $y$ is height (up).
*   **Camera Space**: The world relative to the player's position and rotation.
*   **Screen Space**: The final 2D projection.

### 2.2 The World Data Structure
The world is a collection of **Walls**.
A `Wall` is a line segment in 2D space $(x1, z1)$ to $(x2, z2)$ with a constant height.
There are NO arbitrary polygons, only vertical quads (walls).

```typescript
interface Wall {
  p1: Vector3; // Start point
  p2: Vector3; // End point
  color: string;
}
```

### 2.3 The Rendering Pipeline

1.  **Translation**: Translate all walls so the Camera is at $(0,0,0)$.
    $$ P' = P - Camera_{pos} $$
2.  **Rotation**: Rotate all walls around $y$ axis by $-Camera_{angle}$.
    $$ x_{rot} = x \cdot \cos(\theta) - z \cdot \sin(\theta) $$
    $$ z_{rot} = x \cdot \sin(\theta) + z \cdot \cos(\theta) $$
3.  **Clipping**: (CRITICAL)
    If a wall is partially behind the player ($z < 0$), we must clip it to the near plane ($z > 0.1$). failing to do so results in "divide by zero" or "infinity" artifacts.
    *   Find intersection of Wall Line and Near Plane Line ($z=0.1$).
    *   Replace the point behind camera with the intersection point.
4.  **Projection**: Use existing `Vector3.project()`.
5.  **Rasterization**:
    *   We have 4 points on screen: Top-Left, Top-Right, Bottom-Right, Bottom-Left.
    *   Use `ctx.beginPath(); ctx.moveTo(...); ctx.lineTo(...); ctx.fill();` to draw the quad.

### 2.4 Control Scheme
*   **Up/Down**: Move Forward/Backward (local Z).
*   **Left/Right**: Rotate Camera (Yaw).
*   **Strafe**: None (classic simplified controls).

## 3. Procedural Generation
*   **Algorithm**: Recursive Backtracker or Simple Grid.
*   **Output**: A list of `Wall` objects.
*   **Constraint**: Ensure rooms are enclosed.

## 4. Technical Constraints
*   **Performance**: Sorting walls back-to-front (Painter's Algo) is $O(N \log N)$. With $< 1000$ walls, this is fine for JS.
*   **Vanish Point**: Always center of screen.
