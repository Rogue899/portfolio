import { useState } from 'react';
import './TicTacToe.css';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
    } else if (newBoard.every(square => square !== null)) {
      setWinner('Draw');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  const renderSquare = (index) => {
    const isWinningSquare = winningLine && winningLine.includes(index);
    return (
      <button 
        className={`square ${isWinningSquare ? 'winning' : ''}`}
        onClick={() => handleClick(index)}
        disabled={!!winner}
      >
        {board[index]}
      </button>
    );
  };

  const getWinningLineClass = () => {
    if (!winningLine) return '';
    const [a, b, c] = winningLine;
    if (a === 0 && b === 1 && c === 2) return 'line-horizontal line-top';
    if (a === 3 && b === 4 && c === 5) return 'line-horizontal line-middle';
    if (a === 6 && b === 7 && c === 8) return 'line-horizontal line-bottom';
    if (a === 0 && b === 3 && c === 6) return 'line-vertical line-left';
    if (a === 1 && b === 4 && c === 7) return 'line-vertical line-center';
    if (a === 2 && b === 5 && c === 8) return 'line-vertical line-right';
    if (a === 0 && b === 4 && c === 8) return 'line-diagonal line-diagonal-1';
    if (a === 2 && b === 4 && c === 6) return 'line-diagonal line-diagonal-2';
    return '';
  };

  const status = winner 
    ? winner === 'Draw' 
      ? 'Game Draw!' 
      : `Winner: ${winner}!`
    : `Next player: ${isXNext ? 'X' : 'O'}`;

  return (
    <div className="tic-tac-toe">
      <div className="game-header">
        <h2>Tic Tac Toe</h2>
        <button className="reset-button" onClick={resetGame}>New Game</button>
      </div>
      <div className={`game-status ${winner ? 'winner' : ''}`}>{status}</div>
      <div className="board-container">
        <div className={`board ${getWinningLineClass()}`}>
          <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
          </div>
          <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
          </div>
          <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
