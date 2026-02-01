import { CosmicGame } from './CosmicGame'

// Initialize the game - handle both cases: DOM already ready or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CosmicGame());
} else {
  new CosmicGame();
}
