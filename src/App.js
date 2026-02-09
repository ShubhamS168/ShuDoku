// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
import React, { useState, useEffect } from 'react';
import { Trophy, Heart, Clock, RotateCcw, Play, History, X } from 'lucide-react';

// Sudoku Generator & Solver
const generateSudoku = (difficulty) => {
  // Create a valid solved puzzle
  const puzzle = Array(9).fill(null).map(() => Array(9).fill(0));
  
  const isValid = (board, row, col, num) => {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  };
  
  const fillPuzzle = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (let num of numbers) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (fillPuzzle(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  fillPuzzle(puzzle);
  const solution = puzzle.map(row => [...row]);
  
  // Remove cells based on difficulty
  const cellsToRemove = difficulty === 'Easy' ? 35 : difficulty === 'Medium' ? 45 : 55;
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }
  
  return { puzzle, solution };
};

// Main Sudoku Component
const SudokuGame = () => {
  const [difficulty, setDifficulty] = useState('Easy');
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [wrongCells, setWrongCells] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sudokuHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
    
    const savedStreak = localStorage.getItem('sudokuCurrentStreak');
    const savedBestStreak = localStorage.getItem('sudokuBestStreak');
    if (savedStreak) setCurrentStreak(parseInt(savedStreak));
    if (savedBestStreak) setBestStreak(parseInt(savedBestStreak));
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (isRunning && !gameOver && !gameWon) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver, gameWon]);

  // Initialize game
  useEffect(() => {
    startNewPuzzle();
  }, [difficulty, level]);

  const startNewPuzzle = () => {
    const { puzzle, solution: sol } = generateSudoku(difficulty);
    setBoard(puzzle.map(row => [...row]));
    setInitialBoard(puzzle.map(row => [...row]));
    setSolution(sol);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setSelectedCell(null);
    setSelectedNumber(null);
    setTimer(0);
    setIsRunning(true);
    setWrongCells(new Set());
  };

  const handleCellClick = (row, col) => {
    if (gameOver || gameWon || initialBoard[row][col] !== 0) return;
    setSelectedCell({ row, col });
  };

  const handleNumberClick = (num) => {
    setSelectedNumber(num);
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);

    // Check if correct
    if (solution[row][col] !== num) {
      setWrongCells(new Set([...wrongCells, `${row}-${col}`]));
      const newLives = lives - 1;
      setLives(newLives);
      
      setTimeout(() => {
        setWrongCells(new Set());
      }, 500);

      if (newLives === 0) {
        setGameOver(true);
        setIsRunning(false);
        
        // Reset streak on loss
        setCurrentStreak(0);
        localStorage.setItem('sudokuCurrentStreak', '0');
        
        saveGameHistory('Lose');
      }
    } else {
      // Check if puzzle is complete
      const isComplete = newBoard.every((row, i) => 
        row.every((cell, j) => cell === solution[i][j])
      );
      
      if (isComplete) {
        setGameWon(true);
        setIsRunning(false);
        
        // Update streak
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        localStorage.setItem('sudokuCurrentStreak', newStreak.toString());
        
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          localStorage.setItem('sudokuBestStreak', newStreak.toString());
        }
        
        saveGameHistory('Win');
      }
    }
  };

  const saveGameHistory = (result) => {
    const newEntry = {
      difficulty,
      level,
      result,
      time: formatTime(timer),
      date: new Date().toLocaleString(),
      id: Date.now()
    };
    const updated = [newEntry, ...history].slice(0, 50); // Keep last 50 games
    setHistory(updated);
    localStorage.setItem('sudokuHistory', JSON.stringify(updated));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sudokuHistory');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: '"Urbanist", system-ui, sans-serif',
      padding: '20px',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 30px',
        textAlign: 'center'
      }}>
        {/* <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          letterSpacing: '-0.02em'
        }}>
          <img
            src="/ShuDokuLogo.png"
            alt="ShuDoku logo"
            style={{
              width: '42px',
              height: '42px'
            }}
          />
          ShUDoku
        </h1> */}
        <h1
          style={{
            display: 'flex',              // 🔥 KEY
            alignItems: 'center',          // 🔥 KEY
            justifyContent: 'center',      // center in header
            gap: '12px',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '800',
            lineHeight: 1,                // 🔥 prevents vertical drift
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px',
            letterSpacing: '-0.02em'
          }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/ShuDokuLogo.png`}
            alt="ShuDoku logo"
            style={{
              width: '42px',
              height: '42px',
              display: 'block'            // 🔥 prevents baseline issues
            }}
          />
          ShuDoku
        </h1>
        
        {/* Difficulty & Level Selector - Always visible */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}>
            {['Easy', 'Medium', 'Hard'].map(diff => (
              <button
                key={diff}
                onClick={() => {
                  setDifficulty(diff);
                  setLevel(1);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: difficulty === diff 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  transform: difficulty === diff ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setLevel(Math.max(1, level - 1))}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ←
            </button>
            <span style={{
              fontSize: '18px',
              fontWeight: '600',
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px'
            }}>
              Level {level}
            </span>
            <button
              onClick={() => setLevel(level + 1)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          background: 'rgba(255,255,255,0.05)',
          padding: '15px 20px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>
              {difficulty}
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              Lvl {level}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timer)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={20}
                fill={i < lives ? '#ff6b9d' : 'transparent'}
                color={i < lives ? '#ff6b9d' : 'rgba(255,255,255,0.2)'}
                style={{ transition: 'all 0.3s' }}
              />
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(102, 126, 234, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{currentStreak}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>streak</span>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      {/* Game Board */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Sudoku Grid */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '0',
            aspectRatio: '1',
            background: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {board.map((row, i) => 
              row.map((cell, j) => {
                const isSelected = selectedCell?.row === i && selectedCell?.col === j;
                const isInitial = initialBoard[i][j] !== 0;
                const isWrong = wrongCells.has(`${i}-${j}`);
                const rightBorder = (j + 1) % 3 === 0 && j < 8;
                const bottomBorder = (i + 1) % 3 === 0 && i < 8;
                
                return (
                  <div
                    key={`${i}-${j}`}
                    onClick={() => handleCellClick(i, j)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(18px, 3vw, 24px)',
                      fontWeight: isInitial ? '700' : '600',
                      cursor: isInitial || gameOver || gameWon ? 'default' : 'pointer',
                      background: isSelected 
                        ? 'rgba(102, 126, 234, 0.3)'
                        : isWrong
                        ? 'rgba(255, 107, 157, 0.3)'
                        : isInitial 
                        ? 'rgba(0,0,0,0.02)' 
                        : '#fff',
                      color: isInitial ? '#0f0f1e' : '#667eea',
                      borderRight: rightBorder ? '3px solid #0f0f1e' : '1px solid #e0e0e0',
                      borderBottom: bottomBorder ? '3px solid #0f0f1e' : '1px solid #e0e0e0',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                      transform: isWrong ? 'scale(0.9)' : 'scale(1)',
                      animation: isWrong ? 'shake 0.3s' : 'none'
                    }}
                  >
                    {cell !== 0 ? cell : ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Number Input Slab */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '10px',
          padding: '20px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={gameOver || gameWon}
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                border: 'none',
                background: selectedNumber === num
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: '700',
                cursor: gameOver || gameWon ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                transform: selectedNumber === num ? 'scale(1.1)' : 'scale(1)',
                opacity: gameOver || gameWon ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!gameOver && !gameWon) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNumber !== num) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={startNewPuzzle}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={18} />
            New Puzzle
          </button>
        </div>
        {/* Made with love by Shubham Sourav 🤏🏼😎✌🏼 */}
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#9ca3af',
            marginTop: '30px'
          }}
        >
          Made with approx 1000 lines of code by
          {/* <img
            src="/heart.png"
            alt="love"
            style={{ width: '14px', height: '14px' }}
          /> */}
          {/* by */}
          <a
            href="https://github.com/ShubhamS168"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#a78bfa',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            <img
              src="/githubLogo.webp"   // or GitHub / profile icon
              alt="Shubham Sourav"
              style={{ width: '16px', height: '16px' }}
            />
            {/* Shubham Sourav */}
          </a>
        </p>

      </div>

      {/* Game Over Modal */}
      {(gameOver || gameWon) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '40px',
            borderRadius: '24px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%',
            border: '2px solid rgba(255,255,255,0.1)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {gameWon ? (
              <>
                <Trophy size={64} color="#ffd700" style={{ marginBottom: '20px' }} />
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Victory!
                </h2>
                <p style={{ fontSize: '18px', marginBottom: '10px', opacity: 0.8 }}>
                  Time: {formatTime(timer)}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#667eea' }}>
                      {currentStreak}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Current Streak 🔥</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffd700' }}>
                      {bestStreak}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Best Streak ⭐</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '20px'
                }}>
                  💀
                </div>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  marginBottom: '10px',
                  color: '#ff6b9d'
                }}>
                  Game Over
                </h2>
                <p style={{ fontSize: '18px', marginBottom: '20px', opacity: 0.8 }}>
                  No lives remaining
                </p>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={startNewPuzzle}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                {gameWon ? 'Next Level' : 'Retry'}
              </button>
              <button
                onClick={() => {
                  setGameOver(false);
                  setGameWon(false);
                  setIsRunning(false);
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowHistory(false)}
        >
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '30px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid rgba(255,255,255,0.1)',
            animation: 'slideUp 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '800',
                margin: 0
              }}>
                Game History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Streak Stats */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{
                flex: 1,
                padding: '15px',
                background: 'rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>
                  {currentStreak}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  Current Streak 🔥
                </div>
              </div>
              <div style={{
                flex: 1,
                padding: '15px',
                background: 'rgba(255, 215, 0, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#ffd700' }}>
                  {bestStreak}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  Best Streak ⭐
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.6, padding: '40px 0' }}>
                No games played yet
              </p>
            ) : (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <button
                    onClick={clearHistory}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,107,157,0.2)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  >
                    Clear History
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {history.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '15px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: entry.result === 'Win' ? '#4ade80' : '#ff6b9d'
                        }}>
                          {entry.result === 'Win' ? '🏆 Win' : '💀 Loss'}
                        </span>
                        <span style={{ fontSize: '14px', opacity: 0.7 }}>
                          {entry.time}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        opacity: 0.8
                      }}>
                        <span>{entry.difficulty} - Level {entry.level}</span>
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800&display=swap');
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default SudokuGame;