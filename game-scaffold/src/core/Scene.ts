import type { Game } from '../Game';
import { EntityManager } from './EntityManager';

/**
 * Abstract base class for game scenes.
 * 
 * Scenes represent distinct game states like menus, gameplay, settings, etc.
 * Each scene has its own entity manager and lifecycle methods.
 * 
 * Usage:
 * ```typescript
 * class GameplayScene extends Scene {
 *   onEnter() {
 *     this.entities.add(new Player(...));
 *     this.entities.add(new Enemy(...));
 *   }
 * 
 *   update(dt: number) {
 *     this.entities.update(dt);
 *     // Custom game logic
 *   }
 * 
 *   render(ctx: CanvasRenderingContext2D) {
 *     this.entities.render(ctx);
 *   }
 * }
 * ```
 */
export abstract class Scene {
  /** Reference to the parent game */
  protected game!: Game;

  /** Entity manager for this scene */
  protected entities: EntityManager = new EntityManager();

  /**
   * Called by the Game when this scene becomes active.
   * Do NOT call directly - use game.setScene() instead.
   * 
   * @internal
   */
  _setGame(game: Game): void {
    this.game = game;
  }

  /**
   * Called when this scene becomes the active scene.
   * Use this to initialize entities, reset state, etc.
   */
  onEnter(): void {
    // Override in subclass if needed
  }

  /**
   * Called when this scene is replaced by another scene.
   * Use this to clean up resources.
   */
  onExit(): void {
    // Override in subclass if needed
    this.entities.clear();
  }

  /**
   * Called when the game is paused.
   */
  onPause(): void {
    // Override in subclass if needed
  }

  /**
   * Called when the game is resumed from pause.
   */
  onResume(): void {
    // Override in subclass if needed
  }

  /**
   * Update scene logic. Called every frame.
   * 
   * @param dt - Delta time in seconds since last frame
   */
  abstract update(dt: number): void;

  /**
   * Render the scene. Called every frame after update.
   * 
   * @param ctx - The 2D rendering context
   */
  abstract render(ctx: CanvasRenderingContext2D): void;
}
