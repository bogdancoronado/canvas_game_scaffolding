# Framework Architecture Refactor Plan

> **Created:** January 2026  
> **Status:** In Planning

---

## Overview

Major architectural improvements to establish proper separation of concerns. These changes will:
- Abstract input handling to framework level
- Formalize entity management for 2D/3D
- Add scene system for multi-screen games
- Add unit test infrastructure

---

## 1. InputManager System

**Goal:** Abstract all input handling (keyboard, mouse, touch) to framework level.

### Interface Design

```typescript
export class InputManager implements Destroyable {
  // Keyboard
  isKeyDown(key: string): boolean;
  isKeyPressed(key: string): boolean;  // Just pressed this frame
  isKeyReleased(key: string): boolean; // Just released this frame
  
  // Pointer (unified mouse/touch)
  getPointerPosition(): Vector2 | null;
  isPointerDown(): boolean;
  isPointerPressed(): boolean;
  
  // Touch-specific (multi-touch)
  getTouches(): Vector2[];
  
  // Cleanup
  destroy(): void;
}
```

### Files to Create/Modify
- **[NEW]** `src/input/InputManager.ts` — Core implementation
- **[MODIFY]** `src/Game.ts` — Add `input` property, wire up lifecycle
- **[MODIFY]** `src/ArkanoidGame.ts` — Remove manual listeners, use `this.input`

---

## 2. Entity Interface & EntityManager

**Goal:** Formalize entity contract, prepare for 2D/3D with z-depth.

### Interface Design

```typescript
export interface Entity {
  /** Position in world space. z is used for depth/perspective. */
  position: Vector3;
  
  /** Bounding box for collision (2D projection) */
  readonly bounds: AABB;
  
  /** Update logic */
  update(dt: number): void;
  
  /** Render to canvas */
  render(ctx: CanvasRenderingContext2D): void;
  
  /** Whether entity should be removed */
  destroyed: boolean;
}

export class EntityManager {
  add<T extends Entity>(entity: T): T;
  remove(entity: Entity): void;
  
  /** Get all entities, optionally filtered */
  getAll<T extends Entity>(type?: new (...args: any[]) => T): T[];
  
  /** Update all entities, remove destroyed ones */
  update(dt: number): void;
  
  /** Render all entities (sorted by z for depth) */
  render(ctx: CanvasRenderingContext2D): void;
}
```

### Files to Create/Modify
- **[NEW]** `src/core/Entity.ts` — Interface definition
- **[NEW]** `src/core/EntityManager.ts` — Manager implementation
- **[NEW]** `src/utils/Vector3.ts` — 3D vector with perspective projection
- **[MODIFY]** `src/Game.ts` — Add `entities` property
- **[MODIFY]** `src/entities/*.ts` — Implement Entity interface

---

## 3. Scene System

**Goal:** Support multiple screens (menu, gameplay, settings) with clean transitions.

### Interface Design

```typescript
export abstract class Scene {
  protected game: Game;
  
  /** Called when scene becomes active */
  onEnter(): void;
  
  /** Called when scene is deactivated */
  onExit(): void;
  
  /** Per-frame logic */
  abstract update(dt: number): void;
  
  /** Per-frame rendering */
  abstract render(ctx: CanvasRenderingContext2D): void;
}

// In Game class:
export abstract class Game {
  setScene(scene: Scene): void;
  protected scene: Scene | null;
}
```

### Files to Create/Modify
- **[NEW]** `src/core/Scene.ts` — Base scene class
- **[MODIFY]** `src/Game.ts` — Scene management
- **[NEW]** `src/ArkanoidGame/GameplayScene.ts` — Gameplay logic
- **[NEW]** `src/ArkanoidGame/MenuScene.ts` — Optional menu

---

## 4. Unit Test Infrastructure

**Goal:** Establish testing patterns for framework and game code.

### Setup
- Vitest (fast, Vite-native)
- Test math utilities, collision detection, InputManager
- Entity lifecycle tests

### Files to Create
- **[NEW]** `vitest.config.ts`
- **[NEW]** `src/utils/__tests__/math.test.ts`
- **[NEW]** `src/input/__tests__/InputManager.test.ts`
- **[NEW]** `src/core/__tests__/EntityManager.test.ts`

---

## Implementation Order

| # | Item | Complexity | Rationale |
|---|------|------------|-----------|
| 1 | Entity Interface + Vector3 | Low | Foundation for everything |
| 2 | EntityManager | Medium | Needed before scenes |
| 3 | InputManager | Medium | Can be developed in parallel |
| 4 | Scene System | Medium | Depends on #1, #2 |
| 5 | Migrate ArkanoidGame | Medium | Validate all systems |
| 6 | Unit Tests | Low | Validate correctness |

---

## Directory Structure (After)

```
src/
├── core/
│   ├── Game.ts          # Base class (moved)
│   ├── Scene.ts         # Scene abstraction
│   ├── Entity.ts        # Entity interface
│   └── EntityManager.ts # Entity lifecycle
├── input/
│   └── InputManager.ts  # Unified input
├── utils/
│   ├── Vector2.ts       # 2D vector
│   ├── Vector3.ts       # 3D vector with projection
│   ├── math.ts          # Collision utilities
│   └── __tests__/
├── entities/            # Arkanoid entities
├── scenes/              # Arkanoid scenes (optional)
├── ArkanoidGame.ts      # Game entry point
└── main.ts              # Bootstrap
```

---

## Future-Proofing for 3D

The `Vector3` class will include perspective projection:

```typescript
export class Vector3 {
  constructor(public x: number, public y: number, public z: number = 1) {}
  
  /** Project to 2D screen coordinates using perspective division */
  project(focalLength: number = 1): Vector2 {
    const scale = focalLength / this.z;
    return new Vector2(this.x * scale, this.y * scale);
  }
}
```

This enables pseudo-3D rendering while keeping the 2D Canvas API.
