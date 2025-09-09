// Calibration function for Netlify Functions
let calibrationSettings = {
  gesture_threshold: 0.1,
  gesture_cooldown: 0.3,
  finger_threshold: 0.08,
  detection_confidence: 0.7,
  tracking_confidence: 0.5
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
      body: JSON.stringify({
        settings: calibrationSettings,
        current_direction: "None",
        camera_initialized: false
      })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      
      // Update calibration settings
      if (body.gesture_threshold !== undefined) calibrationSettings.gesture_threshold = parseFloat(body.gesture_threshold);
      if (body.gesture_cooldown !== undefined) calibrationSettings.gesture_cooldown = parseFloat(body.gesture_cooldown);
      if (body.finger_threshold !== undefined) calibrationSettings.finger_threshold = parseFloat(body.finger_threshold);
      if (body.detection_confidence !== undefined) calibrationSettings.detection_confidence = parseFloat(body.detection_confidence);
      if (body.tracking_confidence !== undefined) calibrationSettings.tracking_confidence = parseFloat(body.tracking_confidence);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "success",
          message: "Calibration settings updated",
          settings: calibrationSettings
        })
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
