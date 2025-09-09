# Snake Game CV - Deployment Guide

## Overview
This guide covers deploying both the Flask backend to Render and the React frontend to Netlify, with proper environment configuration for both localhost and production.

## Backend Deployment (Render)

### 1. Prepare Backend for Production

Create a `render.yaml` file in the backend directory:

```yaml
services:
  - type: web
    name: snake-game-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PORT
        value: 10000
```

### 2. Update Backend for Render

Modify `backend/app.py` to use Render's PORT:

```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

### 3. Deploy to Render

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Create a new Web Service
4. Select your repository
5. Use these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Environment**: Python 3
6. Deploy

### 4. Get Your Render URL

After deployment, you'll get a URL like: `https://snake-game-backend.onrender.com`

## Frontend Deployment (Netlify)

### 1. Environment Variables

Create a `.env.production` file in the frontend directory:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

Replace `your-render-backend-url` with your actual Render URL.

### 2. Build Configuration

Create `netlify.toml` in the frontend directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 3. Deploy to Netlify

#### Option A: Netlify CLI
```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

#### Option B: Netlify Web Interface
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_BASE_URL=https://your-render-backend-url.onrender.com`
5. Deploy

## Local Development Setup

### 1. Backend (Local)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py
```

### 2. Frontend (Local)
```bash
cd frontend
npm install
npm run dev
```

## Environment Configuration

### Development
- Frontend uses Vite proxy to `http://localhost:5000`
- No environment variables needed

### Production
- Frontend uses `VITE_API_BASE_URL` environment variable
- Backend runs on Render's assigned port

## CORS Configuration

Add CORS support to your Flask backend:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://your-netlify-site.netlify.app"])
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure CORS is configured in Flask
2. **Environment Variables**: Ensure `VITE_API_BASE_URL` is set correctly
3. **Build Failures**: Check Node.js version (use 18+)
4. **Camera Issues**: Render doesn't support camera access - this is expected

### Testing Production

1. Test backend: `https://your-backend.onrender.com/game_state`
2. Test frontend: `https://your-frontend.netlify.app`
3. Check browser console for errors

## Important Notes

- **Camera Access**: Render doesn't support camera access, so gesture detection won't work in production
- **WebSocket**: If you add real-time features, consider using Render's WebSocket support
- **Database**: For persistent data, add a PostgreSQL database in Render
- **Environment**: Always use environment variables for sensitive data

## File Structure After Deployment

```
backend/
├── app.py
├── requirements.txt
├── render.yaml
└── venv/

frontend/
├── src/
├── dist/ (generated)
├── .env.production
├── netlify.toml
└── package.json
```

## Next Steps

1. Deploy backend to Render
2. Get the Render URL
3. Update frontend environment variables
4. Deploy frontend to Netlify
5. Test both environments
6. Update documentation with your actual URLs
