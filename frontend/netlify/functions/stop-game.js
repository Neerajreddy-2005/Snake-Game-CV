// Stop game function for Netlify Functions
let gameActive = false;
let gameInterval = null;

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
    // Stop game loop
    gameActive = false;
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "Game stopped" })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
