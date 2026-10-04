// 1. Select DOM elements FIRST
const board = document.querySelector('.board');
const startBtn = document.querySelector('.btn-start');
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const restartButton = document.querySelector('.btn-restart');

const highScoreElement = document.querySelector('#high-score');
const ScoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#Time'); // Fixed: capitalized 'T' to match index.html

const blockWidth = 50;
const blockHeight = 50;

let highScore = localStorage.getItem("highScore") || 0;
let score = 0;
let secondsCount = 0;

highScoreElement.innerText = highScore;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let IntervalId = null;
let timeIntervalId = null;

// Grid indexing: row (0 to rows-1), col (0 to cols-1)
let food = { row: Math.floor(Math.random() * rows), col: Math.floor(Math.random() * cols) };

const blocks = {};
let snake = [
    { row: 1, col: 5 },
    { row: 1, col: 4 },
    { row: 1, col: 3 }
];

let direction = 'right';

// Build grid
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add("block");
        board.appendChild(block);
        blocks[`${row},${col}`] = block;
    }
}

function render() {
    let head = { ...snake[0] };

    if (direction === "left") head.col -= 1;
    else if (direction === "right") head.col += 1;
    else if (direction === "up") head.row -= 1;
    else if (direction === "down") head.row += 1;

    // Wall collision logic
    if (head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols) {
        clearInterval(IntervalId);
        clearInterval(timeIntervalId);
        modal.style.display = "flex";
        startGameModal.style.display = "none";
        gameOverModal.style.display = "flex";
        return;
    }

    // Draw Food
    if (blocks[`${food.row},${food.col}`]) {
        blocks[`${food.row},${food.col}`].classList.add("food");
    }

    // Food consume logic
    if (head.row === food.row && head.col === food.col) {
        blocks[`${food.row},${food.col}`].classList.remove("food");
        food = { row: Math.floor(Math.random() * rows), col: Math.floor(Math.random() * cols) };

        score += 10;
        ScoreElement.innerText = score;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore.toString());
            highScoreElement.innerText = highScore;
        }
    } else {
        // Clear tail if no food eaten
        const tail = snake.pop();
        if (blocks[`${tail.row},${tail.col}`]) {
            blocks[`${tail.row},${tail.col}`].classList.remove("fill");
        }
    }

    snake.unshift(head);

    // Draw Snake
    snake.forEach(segment => {
        if (blocks[`${segment.row},${segment.col}`]) {
            blocks[`${segment.row},${segment.col}`].classList.add("fill");
        }
    });
}

function startTimer() {
    secondsCount = 0;
    timeIntervalId = setInterval(() => {
        secondsCount++;
        let mins = String(Math.floor(secondsCount / 60)).padStart(2, '0');
        let secs = String(secondsCount % 60).padStart(2, '0');
        timeElement.innerText = `${mins}-${secs}`;
    }, 1000);
}

startBtn.addEventListener('click', () => {
    modal.style.display = "none";
    clearInterval(IntervalId);
    clearInterval(timeIntervalId);
    IntervalId = setInterval(render, 200);
    startTimer();
});

restartButton.addEventListener('click', resetGame);

function resetGame() {
    // Clear old food and snake classes
    if (blocks[`${food.row},${food.col}`]) {
        blocks[`${food.row},${food.col}`].classList.remove("food");
    }
    snake.forEach(segment => {
        if (blocks[`${segment.row},${segment.col}`]) {
            blocks[`${segment.row},${segment.col}`].classList.remove("fill");
        }
    });

    score = 0;
    ScoreElement.innerText = score;
    timeElement.innerText = "00-00";

    direction = "right";
    snake = [
        { row: 1, col: 5 },
        { row: 1, col: 4 },
        { row: 1, col: 3 }
    ];
    food = { row: Math.floor(Math.random() * rows), col: Math.floor(Math.random() * cols) };

    modal.style.display = "none";
    clearInterval(IntervalId);
    clearInterval(timeIntervalId);
    IntervalId = setInterval(render, 200);
    startTimer();
}

addEventListener('keydown', (event) => {
    if (event.key === "ArrowUp" && direction !== "down") {
        direction = "up";
    } else if (event.key === "ArrowDown" && direction !== "up") {
        direction = "down";
    } else if (event.key === "ArrowLeft" && direction !== "right") {
        direction = "left";
    } else if (event.key === "ArrowRight" && direction !== "left") {
        direction = "right";
    }
});