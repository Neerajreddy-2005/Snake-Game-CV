// Game state management for Netlify Functions
let gameState = {
  snake: [[250, 250], [240, 250], [230, 250]],
  apple: [120, 120],
  score: 0,
  game_over: false,
  current_direction: "None",
  button_direction: 1
};

let gameActive = false;
let gameInterval = null;

// Game constants
const BOARD_SIZE = 500;
const CELL_SIZE = 10;
const GRID_SIZE = BOARD_SIZE / CELL_SIZE;

// Game logic functions
function collisionWithApple(applePosition, score) {
  const newApple = [
    Math.floor(Math.random() * 49) * 10 + 10,
    Math.floor(Math.random() * 49) * 10 + 10
  ];
  return { apple: newApple, score: score + 1 };
}

function collisionWithSelf(snakePosition) {
  const head = snakePosition[0];
  return snakePosition.slice(1).some(segment => 
    segment[0] === head[0] && segment[1] === head[1]
  );
}

function updateGame() {
  if (!gameActive || gameState.game_over) return;

  const head = [...gameState.snake[0]];
  
  // Update position based on direction
  switch (gameState.button_direction) {
    case 0: head[0] -= 10; break; // Left
    case 1: head[0] += 10; break; // Right
    case 2: head[1] -= 10; break; // Up
    case 3: head[1] += 10; break; // Down
  }

  // Wrap around edges
  if (head[0] >= BOARD_SIZE) head[0] = 0;
  else if (head[0] < 0) head[0] = BOARD_SIZE - 10;
  if (head[1] >= BOARD_SIZE) head[1] = 0;
  else if (head[1] < 0) head[1] = BOARD_SIZE - 10;

  // Check apple collision
  if (head[0] === gameState.apple[0] && head[1] === gameState.apple[1]) {
    const result = collisionWithApple(gameState.apple, gameState.score);
    gameState.apple = result.apple;
    gameState.score = result.score;
    gameState.snake.unshift(head);
  } else {
    gameState.snake.unshift(head);
    gameState.snake.pop();
  }

  // Check self collision
  if (collisionWithSelf(gameState.snake)) {
    gameState.game_over = true;
  }
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(gameState)
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
