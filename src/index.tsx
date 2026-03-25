import React from 'react';
import ReactDOM from 'react-dom/client';
import AnandChess from './AnandChess';
import './AnandChess.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AnandChess />
  </React.StrictMode>
);
