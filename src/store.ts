import { create } from 'zustand';
import { Chess } from 'chess.js';

interface GameState {
  game: Chess;
  fen: string;
  history: any[];
  mode: 'menu' | 'bot' | 'pvp';
  updateGame: (game: Chess) => void;
  setMode: (mode: 'menu' | 'bot' | 'pvp') => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: new Chess(),
  fen: 'start',
  history: [],
  mode: 'menu',
  updateGame: (game) => set({ 
    game, 
    fen: game.fen(), 
    history: game.history({ verbose: true }) 
  }),
  setMode: (mode) => set({ mode }),
  resetGame: () => {
    const newGame = new Chess();
    set({ game: newGame, fen: 'start', history: [] });
  }
}));
