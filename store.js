import { create } from 'zustand';
import { Chess } from 'chess.js';

export const useGameStore = create((set) => ({
  // The actual Chess engine instance
  game: new Chess(),
  
  // Game State Variables
  mode: 'menu',      // Current mode: 'menu', 'bot', or 'pvp'
  fen: 'start',      // The string representing the board position
  turn: 'w',         // Whose turn: 'w' or 'b'
  check: false,      // Is the king in check?
  history: [],       // List of moves for the "Move Review" sidebar
  
  // Actions to change the state
  setMode: (mode) => set({ mode }),
  
  updateGame: (gameInstance) => set({
    game: gameInstance,
    fen: gameInstance.fen(),
    turn: gameInstance.turn(),
    check: gameInstance.isCheck(),
    history: gameInstance.history({ verbose: true }),
  }),
  
  resetGame: () => {
    const newGame = new Chess();
    set({ 
      game: newGame, 
      fen: 'start', 
      turn: 'w', 
      history: [], 
      check: false 
    });
  }
}));
