# EduSense Backend

Backend API for **EduSense** — a neuro-adaptive multisensory learning system for Grade 6 science.

## Overview

EduSense is a **brain-informed adaptive learning platform** that optimizes memory encoding, cognitive load, and arousal using multisensory stimulation (haptic, audio, visual) and behaviorally adaptive quizzes. The design is grounded in established learning and neuroscience theory; see [RESEARCH_FRAMEWORK.md](RESEARCH_FRAMEWORK.md) for the theory–feature mapping and panel-ready explanations.

**Research framing:** The system uses **behavioral proxies** for cognitive load and engagement (e.g. quiz performance, response times, answer changes). It does not measure brain waves or direct neurological activity.

| Theory | What it controls | Our feature |
|--------|------------------|-------------|
| **Cognitive Load (Sweller)** | Working memory | Quiz adaptation; behavioral prediction of load |
| **Dual Coding (Paivio)** | Visual + verbal encoding | Animation + narration; synchronized modalities |
| **Embodied Cognition** | Concept grounding in body | Haptic mapping (e.g. gravity → downward pattern) |
| **Yerkes–Dodson** | Arousal level | (Design) Stimulation intensity control |
| **Hebbian Learning** | Neural strengthening | Synchronized visual, audio, haptic for key concepts |
| **Sensory gating** | Attention filtering | Selective multimodal bursts; avoid constant stimulation |

## Features

- 🔐 User Authentication & Authorization (JWT)
- 📚 Lesson Management (CRUD operations)
- 🤖 ML-Powered Content Processing
  - Text Analysis
  - Concept Extraction
  - Visual Generation
  - Audio Script Generation
  - Haptic Pattern Design
- 📝 Quiz Generation from Content
- 📊 Progress Tracking
- 📁 File Upload Handling

## Technology Stack

- **Framework**: FastAPI
- **Database**: MongoDB (with Beanie ODM)
- **Authentication**: JWT (python-jose)
- **ML**: scikit-learn, transformers, PyTorch
- **Server**: Uvicorn

## Project Structure

```
edusense-backend/
├── app/
│   ├── api/              # API routes
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── ml/              # ML components
│   ├── storage/         # File storage
│   └── utils/           # Utilities
├── tests/               # Test files
├── scripts/             # Utility scripts
└── requirements.txt     # Dependencies
```

## Setup

### Prerequisites

- Python 3.10+
- MongoDB (local or Atlas)
- pip

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd edusense-backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB:**
   ```bash
   # Using Docker Compose
   docker-compose up -d
   
   # Or use local MongoDB instance
   ```

6. **Run the application:**
   ```bash
   python -m app.main
   # Or
   uvicorn app.main:app --reload
   ```

7. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `MONGODB_URL`: MongoDB connection string
- `MONGODB_DB_NAME`: Database name
- `SECRET_KEY`: JWT secret key (change in production!)
- `CORS_ORIGINS`: Allowed CORS origins

## Development

### Running Tests

```bash
pytest
```

### Training ML Models

```bash
python scripts/train_models.py
```

### Seeding Database

```bash
python scripts/seed_data.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Lessons
- `GET /api/lessons` - List lessons
- `POST /api/lessons` - Create lesson
- `GET /api/lessons/{id}` - Get lesson
- `PUT /api/lessons/{id}` - Update lesson
- `DELETE /api/lessons/{id}` - Delete lesson

### Content Processing
- `POST /api/content/process` - Process text content
- `GET /api/content/status/{job_id}` - Check processing status

### Quizzes
- `POST /api/quizzes/generate` - Generate quiz
- `GET /api/quizzes/{id}` - Get quiz
- `POST /api/quizzes/{id}/submit` - Submit quiz

### Progress
- `GET /api/progress` - Get progress
- `POST /api/progress/update` - Update progress

## ML Models

Trained models should be placed in `app/ml/models/`:
- `concept_extractor.pkl` - Concept extraction model
- `quiz_generator.pkl` - Quiz generation model
- `audio_generator.pkl` - Audio script generation model
- `haptic_designer.pkl` - Haptic pattern design model

## License

[Your License Here]

## Contributing

[Contributing Guidelines]

