import { InputManager } from './input/InputManager';
import { ArkanoidGame } from './ArkanoidGame';
import { CosmicGame } from './CosmicGame';
import { SimpleDoomGame } from './SimpleDoomGame';
import { Game } from './Game';

/**
 * Game type identifiers for the launcher.
 */
export type GameType = 'arkanoid' | 'cosmic' | 'doom';

/**
 * Game metadata for the selector screen.
 */
interface GameInfo {
  type: GameType;
  title: string;
  description: string;
  color: string;
}

/**
 * Available games with their display information.
 */
const GAMES: GameInfo[] = [
  {
    type: 'arkanoid',
    title: 'Arkanoid',
    description: 'Classic brick-breaker game',
    color: '#e94560',
  },
  {
    type: 'cosmic',
    title: 'Cosmic Runner',
    description: 'Dodge cubes in space',
    color: '#00ffff',
  },
  {
    type: 'doom',
    title: 'SimpleDoom',
    description: 'First-person dungeon crawler',
    color: '#ff00ff',
  },
];

/**
 * Game Launcher - Main entry point for the game framework.
 *
 * Manages the game lifecycle:
 * - Shows a game selection screen on startup
 * - Launches selected games
 * - Handles return-to-menu requests from games
 *
 * @example
 * ```typescript
 * const launcher = new GameLauncher();
 * // User sees game selector, clicks a game to play
 * // ESC -> Pause menu -> "Return to Menu" brings back to selector
 * ```
 */
export class GameLauncher {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private currentGame: Game | null = null;
  private running: boolean = true;
  private hoveredIndex: number = -1;
  private selectedIndex: number = 0;

  constructor() {
    // Create input manager
    this.input = new InputManager();

    // Create canvas for selector screen
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-launcher';
    document.body.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));

    // Start selector loop
    this.selectorLoop();
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private get width(): number {
    return window.innerWidth;
  }

  private get height(): number {
    return window.innerHeight;
  }

  /**
   * Main selector screen loop.
   */
  private selectorLoop(): void {
    if (!this.running || this.currentGame) return;

    this.handleSelectorInput();
    this.renderSelector();
    this.input.endFrame();

    requestAnimationFrame(() => this.selectorLoop());
  }

  private handleSelectorInput(): void {
    // Keyboard navigation
    if (this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('w')) {
      this.selectedIndex = (this.selectedIndex - 1 + GAMES.length) % GAMES.length;
    }
    if (this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('s')) {
      this.selectedIndex = (this.selectedIndex + 1) % GAMES.length;
    }
    if (this.input.isKeyPressed('Enter') || this.input.isKeyPressed(' ')) {
      this.launchGame(GAMES[this.selectedIndex].type);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const cardHeight = 100;
    const gap = 20;
    const totalHeight = GAMES.length * cardHeight + (GAMES.length - 1) * gap;
    const startY = (this.height - totalHeight) / 2;
    const cardWidth = Math.min(400, this.width - 40);
    const startX = (this.width - cardWidth) / 2;

    const x = e.clientX;
    const y = e.clientY;

    this.hoveredIndex = -1;
    for (let i = 0; i < GAMES.length; i++) {
      const cardY = startY + i * (cardHeight + gap);
      if (x >= startX && x <= startX + cardWidth &&
        y >= cardY && y <= cardY + cardHeight) {
        this.hoveredIndex = i;
        this.selectedIndex = i;
        break;
      }
    }
  }

  private onClick(_e: MouseEvent): void {
    if (this.hoveredIndex >= 0) {
      this.launchGame(GAMES[this.hoveredIndex].type);
    }
  }

  /**
   * Render the game selector screen.
   */
  private renderSelector(): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Select Game', this.width / 2, 80);

    // Game cards
    const cardHeight = 100;
    const gap = 20;
    const totalHeight = GAMES.length * cardHeight + (GAMES.length - 1) * gap;
    const startY = (this.height - totalHeight) / 2;
    const cardWidth = Math.min(400, this.width - 40);
    const startX = (this.width - cardWidth) / 2;

    GAMES.forEach((game, i) => {
      const y = startY + i * (cardHeight + gap);
      const isSelected = i === this.selectedIndex;

      // Card background
      ctx.fillStyle = isSelected ? game.color + '40' : '#1a1a2e';
      ctx.strokeStyle = isSelected ? game.color : '#333';
      ctx.lineWidth = isSelected ? 3 : 1;

      ctx.beginPath();
      ctx.roundRect(startX, y, cardWidth, cardHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.fillStyle = isSelected ? game.color : '#fff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(game.title, startX + 20, y + 35);

      // Description
      ctx.fillStyle = '#888';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(game.description, startX + 20, y + 65);

      // Selection indicator
      if (isSelected) {
        ctx.fillStyle = game.color;
        ctx.beginPath();
        ctx.moveTo(startX + cardWidth - 30, y + cardHeight / 2);
        ctx.lineTo(startX + cardWidth - 45, y + cardHeight / 2 - 10);
        ctx.lineTo(startX + cardWidth - 45, y + cardHeight / 2 + 10);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Use ↑↓ or mouse to select, Enter or click to play', this.width / 2, this.height - 40);
  }

  /**
   * Launch a specific game.
   */
  launchGame(type: GameType): void {
    // Hide selector canvas
    this.canvas.style.display = 'none';
    this.input.destroy();

    // Create the game with return callback
    const returnToMenu = () => this.returnToMenu();

    switch (type) {
      case 'arkanoid':
        this.currentGame = new ArkanoidGame(returnToMenu);
        break;
      case 'cosmic':
        this.currentGame = new CosmicGame(returnToMenu);
        break;
      case 'doom':
        this.currentGame = new SimpleDoomGame(returnToMenu);
        break;
    }
  }

  /**
   * Return to the game selector from a running game.
   */
  returnToMenu(): void {
    // Stop and cleanup current game
    if (this.currentGame) {
      this.currentGame.stop();
      this.currentGame = null;
    }

    // Show selector canvas again
    this.canvas.style.display = 'block';
    this.input = new InputManager();

    // Restart selector loop
    this.selectorLoop();
  }
}
