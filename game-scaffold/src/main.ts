import './style.css'
import { ArkanoidGame } from './ArkanoidGame'

// Initialize the game - handle both cases: DOM already ready or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ArkanoidGame());
} else {
  new ArkanoidGame();
}
