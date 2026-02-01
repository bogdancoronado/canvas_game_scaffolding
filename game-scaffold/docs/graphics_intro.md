# Introduction to Computer Graphics

> **Prerequisites:** Basic algebra, familiarity with Cartesian coordinates.  
> **Goal:** Understand how we fool the brain into seeing 3D depth on a flat 2D screen.

---

## 1. Foundations: The 2D World

In 2D game development, we work with a **Cartesian Coordinate System**. Every object's location is defined by two numbers: $x$ (horizontal) and $y$ (vertical).

-   **Origin (0,0)**: Usually the top-left or center of the screen.
-   **Translation**: Changing $(x, y)$ moves the object.
-   **Rendering**: We simply draw the object at pixel $(x, y)$.

This is simple and effective, but flat. It implies that everything exists on a single sheet of paper.

## 2. The Third Dimension: Depth (Z)

To create a 3D world, we add a third axis: **$z$ (Depth)**.

-   **$x$**: Left / Right
-   **$y$**: Up / Down
-   **$z$**: Forward / Backward

In our framework (and many standard systems), we define:
-   **+z**: Points **into** the screen (away from the viewer).
-   **-z**: Points **out** of the screen (towards the viewer).

So, a point at $(100, 50, 5)$ is 100 units right, 50 units down, and 5 units *deep* into the screen.

## 3. The Core Problem: Projection

We have a 3D world $(x, y, z)$, but our physical screen is a 2D surface $(x_{screen}, y_{screen})$.

**Projection** is the mathematical process of flattening 3D coordinates onto a 2D plane.

There are two main types:
1.  **Orthographic**: Ignore $z$. Objects are the same size regardless of distance. (Used in engineering blueprints, 2D UI).
2.  **Perspective**: Divide by $z$. Objects get smaller as they get further away. (Used in 3D games, mimics human vision).

---

## 4. Perspective Projection: The Deep Dive

You asked about this specific formula:

$$
x_{screen} = \frac{x_{world}}{z_{depth}}
$$

Why does dividing by $x$ by $z$ create a 3D effect?

### The Geometry: Similar Triangles

To understand *why* this works, imagine looking at a scene from the side (Top-Down view).

-   **The Eye (Camera)**: Located at $(0, 0)$.
-   **The Screen**: A transparent window placed at distance $d$ (focal length) in front of the eye.
-   **The Object**: A tree located at generic distance $z$ with actual height $x$.

We want to know: **Where does the light from the tree hit the screen?**

```mermaid
graph TD
    %% Custom styling to mimic a geometry diagram
    subgraph "Top-Down View (XZ Plane)"
    Eye((Eye)) --- Ray[Line of Sight]
    Ray -.-> Object((Object x, z))
    
    style Eye fill:#fff,stroke:#333
    style Object fill:#f00,stroke:#333
    
    ScreenLine[Screen Plane (at z=d)]
    
    %% Implicit Similar Triangles
    %% Triangle 1: Eye -> ScreenPoint -> Axis
    %% Triangle 2: Eye -> Object -> Axis
    end
```

Let's look at the geometry of the **Similar Triangles** formed by the line of sight.

**Triangle A (Small)**: From Eye to Screen.
-   Base: $d$ (distance to screen)
-   Height: $x_{screen}$ (position on screen)

**Triangle B (Large)**: From Eye to Object.
-   Base: $z$ (distance to object)
-   Height: $x_{world}$ (actual object position)

Because these triangles share the same angle at the Eye, the ratio of their sides must be equal:

$$
\frac{\text{Height}_A}{\text{Base}_A} = \frac{\text{Height}_B}{\text{Base}_B}
$$

$$
\frac{x_{screen}}{d} = \frac{x_{world}}{z}
$$

Now, solve for $x_{screen}$:

$$
x_{screen} = d \cdot \frac{x_{world}}{z}
$$

If we assume the screen is at distance $d=1$ (a common simplification), the formula becomes:

$$
x_{screen} = \frac{x}{z}
$$

### The Intuition

1.  **If $z$ is huge (far away)**: The denominator is large. $x/z$ becomes tiny. The object moves towards the center (0,0).
2.  **If $z$ is small (close up)**: The denominator is small. $x/z$ is large. The object moves away from the center.
3.  **If $z = d$**: The object works out to exactly its original size.

This simple division creates the **Vanishing Point** effect, where all parallel lines appear to converge at the center of the screen as they go deep into the distance.

---

## 5. Visualizing the Effect

Using this formula, we get two automatic features of 3D graphics:

### Scaling (Size Diminishing)

Since we define an object's size by its vertex positions, dividing those positions by $z$ automatically shrinks the object.

$$
\text{Apparent Width} = \frac{\text{Actual Width}}{z}
$$

### Parallax (Movement Speed)

If the camera moves, nearby objects ($small \ z$) shift position rapidly, while distant objects ($large \ z$) barely move.

-   **Tree at z=2**: Moves $1/2$ pixel for every 1 unit of camera move.
-   **Mountain at z=100**: Moves $1/100$ pixel for every 1 unit of camera move.

This creates the sensation of depth through motion.

---

## 6. Implementation References

In our codebase, this logic lives in the `Vector3` class.

**File:** [src/utils/Vector3.ts](file:///Users/bgdan/projects/experimental/canvas_game/game-scaffold/src/utils/Vector3.ts)

```typescript
// project() method in Vector3.ts
project(focalLength: number = 1, screenCenter: Vector2): Vector2 {
  // 1. Prevent division by zero
  const safeZ = Math.max(this.z, 0.001);
  
  // 2. Calculate the scaling factor (d / z)
  const scale = focalLength / safeZ;

  // 3. Apply projection and offset to screen center
  return new Vector2(
    screenCenter.x + this.x * scale,
    screenCenter.y + this.y * scale
  );
}
```

We add `screenCenter` because in computer graphics, $(0,0)$ is usually the top-left corner. We want the "Vanishing Point" $(0,0)$ to be in the middle of the screen, so we offset the result.
