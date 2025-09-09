// Gesture info function for Netlify Functions
let gestureInfo = {
  current_direction: "None",
  button_direction: 1,
  gesture_threshold: 0.1,
  gesture_cooldown: 0.3,
  finger_threshold: 0.08,
  last_gesture_time: 0,
  camera_initialized: false
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

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(gestureInfo)
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      
      // Update gesture info
      if (body.current_direction) gestureInfo.current_direction = body.current_direction;
      if (body.button_direction !== undefined) gestureInfo.button_direction = body.button_direction;
      if (body.gesture_threshold !== undefined) gestureInfo.gesture_threshold = body.gesture_threshold;
      if (body.gesture_cooldown !== undefined) gestureInfo.gesture_cooldown = body.gesture_cooldown;
      if (body.finger_threshold !== undefined) gestureInfo.finger_threshold = body.finger_threshold;
      if (body.last_gesture_time !== undefined) gestureInfo.last_gesture_time = body.last_gesture_time;
      if (body.camera_initialized !== undefined) gestureInfo.camera_initialized = body.camera_initialized;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: "Gesture info updated", data: gestureInfo })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON" })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
