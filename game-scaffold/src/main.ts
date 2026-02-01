import { GameLauncher } from './GameLauncher'

// Initialize the game launcher - shows game selector on startup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GameLauncher();
  });
} else {
  new GameLauncher();
}
