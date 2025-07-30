import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Color palette and theme personalization are handled via App.css variables for light theme.
 * - Primary: #1976d2
 * - Secondary: #424242
 * - Accent: #ffd600
 */

// --- Utils ---
// Returns a new array filled with 9 nulls representing an empty board
const emptyBoard = () => Array(9).fill(null);

// Calculates the winner and winning line
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  if (squares.every(sq => sq)) { // No nulls == tie
    return { winner: "tie", line: [] };
  }
  return null;
}

// Simple AI: Win, block, center, random corner, random side.
function computeAIMove(board, aiMark, playerMark) {
  // Try to win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = aiMark;
      if (calculateWinner(copy)?.winner === aiMark) return i;
    }
  }
  // Block player win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = playerMark;
      if (calculateWinner(copy)?.winner === playerMark) return i;
    }
  }
  // Take center
  if (!board[4]) return 4;
  // Random corner
  const corners = [0, 2, 6, 8].filter(i => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Random side
  const sides = [1, 3, 5, 7].filter(i => !board[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  // No moves left
  return -1;
}

// --- Components ---

// PUBLIC_INTERFACE
function Square({ value, onClick, highlight }) {
  /**
   * A single clickable square in the grid.
   */
  return (
    <button
      className={`ttt-square${highlight ? " highlight" : ""}`}
      onClick={onClick}
      aria-label={value ? `Filled with ${value}` : "Empty square"}
      disabled={!!value}
      tabIndex={value ? -1 : 0}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function Board({ squares, onClick, winningLine }) {
  /**
   * 3x3 board of squares.
   */
  function renderSquare(i) {
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onClick(i)}
        highlight={winningLine && winningLine.includes(i)}
      />
    );
  }
  return (
    <div className="ttt-board">
      {[0, 1, 2].map(r =>
        <div key={r} className="ttt-row">
          {[0, 1, 2].map(c => renderSquare(r * 3 + c))}
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function ModeSelector({ mode, setMode }) {
  /**
   * Selects between Player vs Player and Player vs AI.
   */
  return (
    <div className="ttt-mode-selector">
      <button
        className={mode === "pvp" ? "selected" : ""}
        onClick={() => setMode("pvp")}
        aria-pressed={mode === "pvp"}
      >
        VS Player
      </button>
      <button
        className={mode === "ai" ? "selected" : ""}
        onClick={() => setMode("ai")}
        aria-pressed={mode === "ai"}
      >
        VS AI
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function InfoBar({ message, onRestart }) {
  /**
   * Displays win/loss/tie messages and restart button.
   */
  return (
    <div className="ttt-info-bar">
      <span className="ttt-message">{message}</span>
      <button className="ttt-restart-btn" onClick={onRestart}>
        Restart
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Main entrypoint for the Tic Tac Toe App
   * - Handles game mode, state, win/lose/tie, and theming framework (delegated to CSS)
   */

  const [mode, setMode] = useState("pvp"); // "pvp" or "ai"
  const [board, setBoard] = useState(emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);
  const [aiTurn, setAITurn] = useState(false);
  const [status, setStatus] = useState({ winner: null, line: [] });

  // Reset game when mode changes
  useEffect(() => {
    setBoard(emptyBoard());
    setXIsNext(true);
    setAiFirstMove();
    setStatus({ winner: null, line: [] });
    // eslint-disable-next-line
  }, [mode]);

  // Helper: AI starts second if user is X, otherwise let AI go first (optional)
  function setAiFirstMove() {
    if (mode === "ai" && !xIsNext) {
      setAITurn(true);
    } else {
      setAITurn(false);
    }
  }

  // Compute status on any board update
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setStatus(result);
    } else {
      setStatus({ winner: null, line: [] });
      // For AI, if it's the AI's turn, make a move
      if (
        mode === "ai" &&
        !status.winner &&
        ((xIsNext && aiMark() === "X") || (!xIsNext && aiMark() === "O"))
      ) {
        setAITurn(true);
      } else {
        setAITurn(false);
      }
    }
    // eslint-disable-next-line
  }, [board]);

  // AI Move
  useEffect(() => {
    if (mode === "ai" && aiTurn && !status.winner) {
      const idx = computeAIMove(
        board,
        aiMark(),
        playerMark()
      );
      if (idx !== -1) {
        const boardCopy = [...board];
        boardCopy[idx] = aiMark();
        setTimeout(() => {
          setBoard(boardCopy);
          setXIsNext((prev) => !prev);
        }, 350); // Small delay for realism
      }
    }
    // eslint-disable-next-line
  }, [aiTurn, board, mode, status.winner]);

  // Helpers to determine marks in AI mode
  function playerMark() {
    return "X";
  }
  function aiMark() {
    return "O";
  }

  // On square click
  function handleClick(i) {
    if (status.winner || board[i]) return; // Block move if already won or occupied
    // PvP: allow moves alternate
    if (mode === "pvp" || (mode === "ai" && xIsNext)) {
      const boardCopy = [...board];
      boardCopy[i] = xIsNext ? "X" : "O";
      setBoard(boardCopy);
      setXIsNext(!xIsNext);
      setAITurn(false);
    }
  }

  // Return current message
  function statusMessage() {
    if (status.winner) {
      if (status.winner === "tie") return "It's a tie!";
      if (mode === "ai") {
        return status.winner === playerMark()
          ? "You win! 🎉"
          : "AI wins! 🤖";
      } else {
        return status.winner === "X"
          ? "Player X wins! 🎉"
          : "Player O wins! 🎉";
      }
    }
    if (mode === "ai") {
      if ((xIsNext && playerMark() === "X") || (!xIsNext && playerMark() === "O")) {
        return "Your move!";
      }
      return "AI is thinking...";
    }
    return `Current Move: ${xIsNext ? "X" : "O"}`;
  }

  // Restart game
  function handleRestart() {
    setBoard(emptyBoard());
    setXIsNext(true);
    setStatus({ winner: null, line: [] });
    setAiFirstMove();
  }

  // Minimalistic branding/header
  return (
    <div className="App ttt-root">
      <header className="ttt-header">
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <p className="ttt-subtitle">Minimal, Responsive, Light UI</p>
      </header>
      <main className="ttt-main">
        <ModeSelector mode={mode} setMode={setMode} />
        <Board squares={board} onClick={handleClick} winningLine={status.line} />
        {status.winner && (
          <InfoBar message={statusMessage()} onRestart={handleRestart} />
        )}
        {!status.winner && (
          <div className="ttt-turn-message">{statusMessage()}</div>
        )}
      </main>
      <footer className="ttt-footer">
        <span>
          <a href="https://reactjs.org" rel="noopener noreferrer" target="_blank">
            React
          </a>{" "}
          Tic Tac Toe &nbsp;|&nbsp; <span style={{ color: "#1976d2" }}>Kavia Demo</span>
        </span>
      </footer>
    </div>
  );
}

export default App;
