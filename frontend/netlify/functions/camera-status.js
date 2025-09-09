// Camera status function for Netlify Functions
let cameraStatus = {
  camera_available: false,
  camera_initialized: false,
  frame_size: "640x480",
  fps: 30
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
      body: JSON.stringify(cameraStatus)
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      
      // Update camera status
      if (body.camera_available !== undefined) cameraStatus.camera_available = body.camera_available;
      if (body.camera_initialized !== undefined) cameraStatus.camera_initialized = body.camera_initialized;
      if (body.frame_size) cameraStatus.frame_size = body.frame_size;
      if (body.fps !== undefined) cameraStatus.fps = body.fps;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: "Camera status updated", data: cameraStatus })
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
