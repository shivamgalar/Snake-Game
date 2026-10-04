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

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

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
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement('div');
    block.classList.add('block');
    blocks[`${row},${col}`] = block;
    board.appendChild(block);
  }
}

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
  while (!valid) {
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
  if (newDir === 'up' && direction !== 'down') nextDirection = 'up';
  if (newDir === 'down' && direction !== 'up') nextDirection = 'down';
  if (newDir === 'left' && direction !== 'right') nextDirection = 'left';
  if (newDir === 'right' && direction !== 'left') nextDirection = 'right';
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') setDirection('up');
  if (e.key === 'ArrowDown' || e.key === 's') setDirection('down');
  if (e.key === 'ArrowLeft' || e.key === 'a') setDirection('left');
  if (e.key === 'ArrowRight' || e.key === 'd') setDirection('right');
});

// Touch controls
document.getElementById('up')?.addEventListener('click', () => setDirection('up'));
document.getElementById('down')?.addEventListener('click', () => setDirection('down'));
document.getElementById('left')?.addEventListener('click', () => setDirection('left'));
document.getElementById('right')?.addEventListener('click', () => setDirection('right'));

// Restart buttons
restartBtn.addEventListener('click', initGame);
modalRestartBtn.addEventListener('click', initGame);

function handleGameOver() {
  clearInterval(gameInterval);
  stopTimer();

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
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.innerText = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.innerText = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }
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

// Start game on load
initGame();