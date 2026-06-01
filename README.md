# SecureFlow

SecureFlow is a visual threat modeling and secure design tool. It provides a drag-and-drop architecture canvas, real-time threat analysis, OWASP/STRIDE mapping, and exportable reports.

## Features

- Drag-and-drop architecture modeling
- Threat detection with OWASP Top 10 mapping
- STRIDE classification
- Save/load projects in MongoDB
- JWT authentication
- PDF export
- Optional real-time collaboration via WebSockets
- Starter templates (e-commerce, banking)

## Prerequisites

- Node.js 18+
- Python 3.10+
- SQLite (local file database, no separate server required)

## Backend Setup (Flask)

1. Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

2. Create a `.env` file in `backend` (copy from `.env.example`) and set values.

3. Run the API server:

```bash
python app.py
```

The backend runs on `http://localhost:5000`.

## Frontend Setup (React + Vite)

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create a `.env` file in `frontend` (copy from `.env.example`) if needed.

3. Start the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Notes

- The PDF export captures the main dashboard layout.
- Use the Properties panel to toggle encryption, authentication, and external input for connections.
- Use the Analyze button to force a new threat scan.

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/analyze`
- `GET /api/templates`
