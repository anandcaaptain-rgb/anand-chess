import React, { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Bot, Users, Zap, Shield, History, Copy, Check, BarChart3, RefreshCcw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from './store';
import Peer from 'peerjs';

// --- CONFIG & ASSETS ---
const REVIEW_THEME = {
  brilliant: { color: '#00ebff', label: '!!', bg: 'rgba(0, 235, 255, 0.2)' },
  best: { color: '#96bc4b', label: '★', bg: 'rgba(150, 188, 75, 0.2)' },
  blunder: { color: '#ff4b2b', label: '??', bg: 'rgba(255, 75, 43, 0.2)' },
  book: { color: '#d5a47d', label: '📖', bg: 'rgba(213, 164, 125, 0.2)' }
};

export default function AnandChess() {
  const { game, fen, mode, turn, check, history, setMode, updateGame, resetGame } = useGameStore();
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [evalScore, setEvalScore] = useState(0.0);
  const [conn, setConn] = useState(null);
  
  const sfWorker = useRef(null);
  const peerRef = useRef(null);

  // --- INITIALIZE ENGINES ---
  useEffect(() => {
    // 1. Stockfish Setup (Assuming stockfish.js in /public)
    sfWorker.current = new Worker('/stockfish.js');
    sfWorker.current.onmessage = (e) => {
      const msg = e.data;
      if (msg.includes('score cp')) {
        const cp = parseInt(msg.split('score cp ')[1]);
        setEvalScore((cp / 100).toFixed(1));
      }
      if (msg.includes('bestmove') && mode === 'bot' && turn === 'b') {
        const bestMove = msg.split('bestmove ')[1].split(' ')[0];
        setTimeout(() => executeMove(bestMove), 600);
      }
    };

    // 2. PeerJS Setup
    const peer = new Peer(`ANAND-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    peer.on('open', setPeerId);
    peer.on('connection', (c) => {
      setConn(c);
      setMode('pvp');
      c.on('data', (d) => updateGame(new Chess(d)));
    });
    peerRef.current = peer;

    return () => {
      sfWorker.current?.terminate();
      peer.destroy();
    };
  }, [mode, turn]);

  // --- CORE GAME ACTIONS ---
  const executeMove = (move) => {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      if (result) {
        updateGame(gameCopy);
        if (conn) conn.send(gameCopy.fen());
        
        // Analyze Move for Review UI
        if (result.san.includes('#')) confetti({ particleCount: 200, spread: 80 });
        
        // Engine Analysis
        sfWorker.current.postMessage(`position fen ${gameCopy.fen()}`);
        sfWorker.current.postMessage('go depth 15');
        return true;
      }
    } catch (e) { return false; }
  };

  const onDrop = (source, target) => {
    return executeMove({ from: source, to: target, promotion: 'q' });
  };

  const connectToPeer = () => {
    const c = peerRef.current.connect(remoteId);
    setConn(c);
    setMode('pvp');
    c.on('data', (d) => updateGame(new Chess(d)));
  };

  // --- RENDER UI ---
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-4 font-['Outfit']">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-[380px_1fr_350px] gap-6 h-[90vh]">
        
        {/* LEFT: DASHBOARD */}
        <motion.aside initial={{ x: -50 }} animate={{ x: 0 }} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <Crown className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Anand<span className="text-indigo-400">Chess</span></h1>
          </div>

          <div className="space-y-3">
            <button onClick={() => setMode('bot')} className={`w-full py-4 rounded-2xl flex items-center gap-4 px-6 transition-all ${mode === 'bot' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
              <Bot size={22} /> <span className="font-bold">Vs. Stockfish 16</span>
            </button>
            <button onClick={() => setMode('pvp')} className={`w-full py-4 rounded-2xl flex items-center gap-4 px-6 transition-all ${mode === 'pvp' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
              <Users size={22} /> <span className="font-bold">Multiplayer P2P</span>
            </button>
          </div>

          <div className="mt-auto p-5 bg-black/40 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-400 font-medium">Evaluation</span>
              <span className={`text-lg font-mono font-bold ${evalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {evalScore > 0 ? `+${evalScore}` : evalScore}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${50 + (evalScore * 5)}%` }} className="h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            </div>
          </div>
        </motion.aside>

        {/* CENTER: BOARD AREA */}
        <main className="flex flex-col items-center justify-center gap-6">
          <div className="w-full max-w-[650px] relative">
            <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full" />
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 border-8 border-slate-800">
              <Chessboard 
                position={fen} 
                onPieceDrop={onDrop}
                customDarkSquareStyle={{ backgroundColor: '#1e293b' }}
                customLightSquareStyle={{ backgroundColor: '#475569' }}
                animationDuration={250}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
             <button onClick={resetGame} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><RefreshCcw size={24}/></button>
             <button className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Trophy size={24}/></button>
          </div>
        </main>

        {/* RIGHT: ANALYSIS & LOG */}
        <motion.aside initial={{ x: 50 }} animate={{ x: 0 }} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <BarChart3 size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Move Review</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {history.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-xs">{i + 1}.</span>
                  <span className="font-bold text-lg">{m.san}</span>
                </div>
                {/* Simulated Review Badge */}
                <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter" style={{ 
                  backgroundColor: i % 7 === 0 ? REVIEW_THEME.brilliant.bg : REVIEW_THEME.best.bg,
                  color: i % 7 === 0 ? REVIEW_THEME.brilliant.color : REVIEW_THEME.best.color,
                }}>
                  {i % 7 === 0 ? 'Brilliant' : 'Best'}
                </div>
              </div>
            ))}
          </div>

          {mode === 'pvp' && (
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">Your Connection ID</div>
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                <code className="text-indigo-300 text-xs">{peerId}</code>
                <Copy size={14} className="cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(peerId)} />
              </div>
              <input 
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Paste Friend ID..."
                value={remoteId}
                onChange={(e) => setRemoteId(e.target.value)}
              />
              <button onClick={connectToPeer} className="w-full py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-colors">Link Session</button>
            </div>
          )}
        </motion.aside>

      </div>
    </div>
  );
}
