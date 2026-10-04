const board = document.querySelector('.board');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const timerEl = document.getElementById('timer');

const gameOverModal = document.getElementById('game-over-modal');
const modalScoreEl = document.getElementById('modal-score');
const modalTimeEl = document.getElementById('modal-time');
const restartBtn = document.getElementById('restart-btn');
const modalRestartBtn = document.getElementById('modal-restart-btn');

const blockWidth = window.innerWidth < 600 ? 25 : 35;
const blockHeight = blockWidth;

let cols = Math.floor(board.clientWidth / blockWidth) || 20;
let rows = Math.floor(board.clientHeight / blockHeight) || 20;

board.style.setProperty('--cols', cols);
board.style.setProperty('--rows', rows);

const blocks = {};
let snake = [];
let direction = 'right';
let nextDirection = 'right';
let food = null;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

let gameInterval = null;
let timerInterval = null;
let secondsElapsed = 0;

highScoreEl.innerText = highScore;

// Generate Grid
function createGrid() {
  board.innerHTML = '';
  for (let key in blocks) delete blocks[key];

  cols = Math.floor(board.clientWidth / blockWidth) || 20;
  rows = Math.floor(board.clientHeight / blockHeight) || 20;

  board.style.setProperty('--cols', cols);
  board.style.setProperty('--rows', rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const block = document.createElement('div');
      block.classList.add('block');
      blocks[`${row},${col}`] = block;
      board.appendChild(block);
    }
  }
}

createGrid();

function formatTime(sec) {
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function startTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  timerEl.innerText = '00:00';
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timerEl.innerText = formatTime(secondsElapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function initGame() {
  clearInterval(gameInterval);
  stopTimer();
  gameOverModal.classList.add('hidden');

  score = 0;
  scoreEl.innerText = score;
  direction = 'right';
  nextDirection = 'right';

  const startRow = Math.floor(rows / 2);
  const startCol = Math.floor(cols / 2);

  snake = [
    { x: startRow, y: startCol },
    { x: startRow, y: startCol - 1 },
    { x: startRow, y: startCol - 2 }
  ];

  spawnFood();
  startTimer();
  render();
  gameInterval = setInterval(gameStep, 150);
}

function spawnFood() {
  let valid = false;
  let attempts = 0;
  while (!valid && attempts < 1000) {
    attempts++;
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const inSnake = snake.some(segment => segment.x === r && segment.y === c);
    if (!inSnake) {
      food = { x: r, y: c };
      valid = true;
    }
  }
}

function setDirection(newDir) {
  // Prevent immediate 180-degree reverse into neck
  if (snake.length > 1) {
    const head = snake[0];
    const neck = snake[1];
    if (newDir === 'up' && head.x - 1 === neck.x && head.y === neck.y) return;
    if (newDir === 'down' && head.x + 1 === neck.x && head.y === neck.y) return;
    if (newDir === 'left' && head.x === neck.x && head.y - 1 === neck.y) return;
    if (newDir === 'right' && head.x === neck.x && head.y + 1 === neck.y) return;
  } else {
    if (newDir === 'up' && direction !== 'down') nextDirection = 'up';
    if (newDir === 'down' && direction !== 'up') nextDirection = 'down';
    if (newDir === 'left' && direction !== 'right') nextDirection = 'left';
    if (newDir === 'right' && direction !== 'left') nextDirection = 'right';
    return;
  }
  nextDirection = newDir;
}

// Keyboard controls (Computer)
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setDirection('up');
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setDirection('down');
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDirection('left');
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDirection('right');
});

// Mobile Touch Controls (Instant response on touchstart & pointerdown)
const controlButtons = [
  { id: 'up', dir: 'up' },
  { id: 'down', dir: 'down' },
  { id: 'left', dir: 'left' },
  { id: 'right', dir: 'right' }
];

controlButtons.forEach(({ id, dir }) => {
  const btn = document.getElementById(id);
  if (!btn) return;

  const handleTouch = (e) => {
    if (e.cancelable) e.preventDefault();
    setDirection(dir);
    btn.classList.add('active');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleRelease = () => {
    btn.classList.remove('active');
  };

  btn.addEventListener('touchstart', handleTouch, { passive: false });
  btn.addEventListener('touchend', handleRelease, { passive: true });
  btn.addEventListener('pointerdown', handleTouch);
  btn.addEventListener('pointerup', handleRelease);
  btn.addEventListener('pointerleave', handleRelease);
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    setDirection(dir);
  });
});

// Mobile Swipe Gestures on the Board
let touchStartX = 0;
let touchStartY = 0;

board.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

board.addEventListener('touchmove', (e) => {
  if (e.cancelable) e.preventDefault();
}, { passive: false });

board.addEventListener('touchend', (e) => {
  if (e.changedTouches.length === 1) {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    const minDistance = 20;

    if (Math.hypot(diffX, diffY) > minDistance) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setDirection(diffX > 0 ? 'right' : 'left');
      } else {
        setDirection(diffY > 0 ? 'down' : 'up');
      }
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }
}, { passive: true });

// Restart buttons
restartBtn.addEventListener('click', initGame);
modalRestartBtn.addEventListener('click', initGame);

function handleGameOver() {
  clearInterval(gameInterval);
  stopTimer();

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  modalScoreEl.innerText = score;
  modalTimeEl.innerText = formatTime(secondsElapsed);
  gameOverModal.classList.remove('hidden');
}

function gameStep() {
  direction = nextDirection;
  const head = { ...snake[0] };

  if (direction === 'up') head.x -= 1;
  if (direction === 'down') head.x += 1;
  if (direction === 'left') head.y -= 1;
  if (direction === 'right') head.y += 1;

  // Wall collision check
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    handleGameOver();
    return;
  }

  // Self collision check
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    handleGameOver();
    return;
  }

  snake.unshift(head);

  // Food collision check
  if (food && head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.innerText = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.innerText = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }
    if (navigator.vibrate) navigator.vibrate(15);
    spawnFood();
  } else {
    snake.pop();
  }

  render();
}

function render() {
  document.querySelectorAll('.block.fill').forEach(el => el.classList.remove('fill'));
  document.querySelectorAll('.block.food').forEach(el => el.classList.remove('food'));

  // Draw snake
  snake.forEach(segment => {
    const key = `${segment.x},${segment.y}`;
    if (blocks[key]) blocks[key].classList.add('fill');
  });

  // Draw food
  if (food) {
    const foodKey = `${food.x},${food.y}`;
    if (blocks[foodKey]) blocks[foodKey].classList.add('food');
  }
}

// Re-adjust grid if screen orientation/size changes
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newCols = Math.floor(board.clientWidth / blockWidth) || 20;
    const newRows = Math.floor(board.clientHeight / blockHeight) || 20;
    if (newCols !== cols || newRows !== rows) {
      createGrid();
      initGame();
    }
  }, 250);
});

// Start game on load
initGame();