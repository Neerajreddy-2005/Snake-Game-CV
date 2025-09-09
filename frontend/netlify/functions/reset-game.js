// Reset game function for Netlify Functions
let gameState = {
  snake: [[250, 250], [240, 250], [230, 250]],
  apple: [120, 120],
  score: 0,
  game_over: false,
  current_direction: "None",
  button_direction: 1
};

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

  if (event.httpMethod === 'GET' || event.httpMethod === 'POST') {
    // Reset game state
    gameState = {
      snake: [[250, 250], [240, 250], [230, 250]],
      apple: [
        Math.floor(Math.random() * 49) * 10 + 10,
        Math.floor(Math.random() * 49) * 10 + 10
      ],
      score: 0,
      game_over: false,
      current_direction: "None",
      button_direction: 1
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "Game reset" })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
