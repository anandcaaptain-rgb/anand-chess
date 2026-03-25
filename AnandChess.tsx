import React, { useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from './store';

export default function AnandChess() {
  const { game, fen, updateGame, mode } = useGameStore();
  const engine = useRef<Worker | null>(null);

  useEffect(() => {
    // This points to the messy file you just pasted in the public folder!
    engine.current = new Worker('/stockfish.js');

    engine.current.onmessage = (e) => {
      const message = e.data;
      if (message.includes('bestmove')) {
        const move = message.split('bestmove ')[1].split(' ')[0];
        handleMove(move);
      }
    };

    return () => engine.current?.terminate();
  }, []);

  const handleMove = (moveStr: any) => {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(moveStr);
      if (result) {
        updateGame(gameCopy);
        // Trigger Engine if it's the Bot's turn
        if (mode === 'bot' && gameCopy.turn() === 'b') {
          engine.current?.postMessage(`position fen ${gameCopy.fen()}`);
          engine.current?.postMessage('go depth 12');
        }
      }
    } catch (err) {
      console.log("Invalid Move");
    }
  };

  return (
    <div className="anand-chess-container">
      <Chessboard 
        position={fen} 
        onPieceDrop={(source, target) => {
          handleMove({ from: source, to: target, promotion: 'q' });
          return true;
        }}
      />
    </div>
  );
}
