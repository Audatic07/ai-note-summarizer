# AI Note Summarizer 📝✨

A full-stack mobile application that allows users to create notes, upload PDFs, and generate AI-powered summaries. Built with React Native (Expo) and FastAPI, featuring a sleek dark mode interface and async background processing.

## 🎯 Project Overview

This project demonstrates real-world engineering practices in building a cross-platform mobile application with:
- **Mobile Frontend**: React Native with Expo, TypeScript, and modern hooks (Dark Theme)
- **Backend API**: FastAPI with async background job processing
- **AI Integration**: Groq API (free) or OpenAI GPT for intelligent summarization
- **PDF Processing**: Text extraction from PDF documents

## ✨ Features

- 📝 Create and edit text notes
- 📄 Upload PDFs and extract text automatically
- 🤖 AI-powered summarization with customizable length and style
- 🎨 Beautiful dark mode interface
- 📱 Cross-platform (iOS & Android)
- ⚡ Async background processing for summaries
- 💾 Local caching for offline access
- 🔄 Pull-to-refresh and real-time updates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MOBILE APP (React Native)                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Screens Layer                             │   │
│  │   HomeScreen │ NotesScreen │ NoteEditorScreen │ NoteDetailScreen │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│  ┌────────────────────────────┴─────────────────────────────────────┐   │
│  │                      Custom Hooks Layer                           │   │
│  │        useUser │ useNotes │ useNote │ useSummary │ useApiHealth  │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│  ┌────────────────────────────┴─────────────────────────────────────┐   │
│  │                      Services Layer                               │   │
│  │              API Service (Axios) │ Storage Service                │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Routes Layer                               │   │
│  │      /health │ /users │ /notes │ /summaries                      │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│  ┌────────────────────────────┴─────────────────────────────────────┐   │
│  │                      Services Layer                               │   │
│  │   UserService │ NoteService │ SummaryService │ PDFService        │   │
│  └───────────────────────┬───────────────────────┬──────────────────┘   │
│                          │                       │                       │
│  ┌───────────────────────┴───────┐  ┌───────────┴───────────────────┐   │
│  │        AI Summarizer          │  │      Database Layer            │   │
│  │  OpenAI │ HuggingFace │ Mock │  │  SQLAlchemy ORM │ SQLite       │   │
│  └───────────────────────────────┘  └───────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🧩 Tech Stack

### Frontend (Mobile)
| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile framework |
| Expo | Development toolchain and runtime |
| TypeScript | Type-safe JavaScript |
| Axios | HTTP client for API calls |
| React Navigation | Screen navigation |
| AsyncStorage | Local data persistence |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.10+ | Programming language |
| FastAPI | Modern async web framework |
| SQLAlchemy | ORM for database operations |
| Pydantic | Data validation and serialization |
| SQLite | Development database (PostgreSQL-ready) |

### AI/NLP
| Technology | Purpose |
|------------|---------|
| Groq API | Primary summarization engine (FREE) |
| OpenAI API | Alternative summarization (paid) |
| HuggingFace | Local models option (optional) |
| PyMuPDF | PDF text extraction |

## 📁 Project Structure

```
ai-note-summarizer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration management
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── connection.py    # Database connection setup
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py          # User ORM model
│   │   │   ├── note.py          # Note ORM model
│   │   │   └── summary.py       # Summary ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py          # User Pydantic schemas
│   │   │   ├── note.py          # Note Pydantic schemas
│   │   │   └── summary.py       # Summary Pydantic schemas
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py        # Health check endpoints
│   │   │   ├── users.py         # User management endpoints
│   │   │   ├── notes.py         # Note CRUD endpoints
│   │   │   └── summaries.py     # Summary generation endpoints
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── user_service.py  # User business logic
│   │       ├── note_service.py  # Note business logic
│   │       ├── summary_service.py # Summary orchestration
│   │       ├── summarizer.py    # AI summarization (swappable)
│   │       └── pdf_service.py   # PDF text extraction
│   ├── requirements.txt
│   └── .env.example
│
├── mobile/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── NoteCard.tsx
│   │   │   └── SummaryCard.tsx
│   │   ├── screens/             # Application screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── NotesScreen.tsx
│   │   │   ├── NoteEditorScreen.tsx
│   │   │   └── NoteDetailScreen.tsx
│   │   ├── services/            # API and storage services
│   │   │   ├── api.ts
│   │   │   └── storage.ts
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── index.ts
│   │   ├── types/               # TypeScript definitions
│   │   │   └── index.ts
│   │   └── constants/           # App constants and config
│   │       └── index.ts
│   ├── App.tsx                  # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── app.json                 # Expo configuration
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Expo Go app on your phone (for testing)
- Groq API key (FREE at https://console.groq.com/keys) OR OpenAI API key

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env and add your API key (Groq is FREE and recommended)
# GROQ_API_KEY=your-groq-key-here

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Mobile Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

**Important**: Update the API URL in `src/constants/index.ts` to match your setup:
```typescript
// For Android Emulator:
BASE_URL: 'http://10.0.2.2:8000/api'

// For iOS Simulator:
BASE_URL: 'http://localhost:8000/api'

// For Physical Device (use your computer's local IP):
BASE_URL: 'http://192.168.x.x:8000/api'
```

Find your local IP:
- Windows: `ipconfig` (look for IPv4 Address)
- macOS/Linux: `ifconfig` or `ip addr`

## 📡 API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Basic health check |
| GET | `/api/health/db` | Database connectivity check |
| GET | `/api/health/ready` | Full readiness check |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a new user (guest or registered) |
| GET | `/api/users/{user_id}` | Get user by ID |
| GET | `/api/users/guest/{guest_id}` | Get user by guest UUID |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes (with pagination) |
| POST | `/api/notes` | Create a new text note |
| POST | `/api/notes/upload/pdf` | Upload PDF and create note |
| GET | `/api/notes/{note_id}` | Get a specific note |
| PUT | `/api/notes/{note_id}` | Update a note |
| DELETE | `/api/notes/{note_id}` | Delete a note |

### Summaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/summaries/notes/{note_id}` | Generate summary (sync) |
| POST | `/api/summaries/notes/{note_id}/async` | Generate summary (async with polling) |
| GET | `/api/summaries/jobs/{job_id}` | Check async job status |
| GET | `/api/summaries/notes/{note_id}` | Get all summaries for a note |
| GET | `/api/summaries/{summary_id}` | Get a specific summary |
| DELETE | `/api/summaries/{summary_id}` | Delete a summary |

## 🎨 Design Decisions

### Architecture Choices

1. **Layered Architecture (Backend)**
   - Clear separation between routes, services, and data layers
   - Business logic isolated in services for testability
   - Routes only handle HTTP concerns

2. **Custom Hooks Pattern (Frontend)**
   - Encapsulate state management and side effects
   - Reusable across components
   - Clean separation of concerns

3. **Swappable AI Provider**
   - Factory pattern allows runtime provider selection
   - Easy to switch between OpenAI, HuggingFace, or mock
   - Future-proof for new AI services

4. **Guest-First Authentication**
   - No registration barrier to use the app
   - UUID-based guest identification
   - Seamless upgrade path to full accounts

### Why These Technologies?

- **FastAPI**: Async support, automatic OpenAPI docs, type hints
- **React Native + Expo**: Cross-platform with excellent DX
- **SQLite → PostgreSQL**: Easy development, production-ready structure
- **Pydantic**: Runtime validation, serialization, great IDE support

## 🔮 Future Improvements

- [ ] User authentication (OAuth with Google/Apple)
- [ ] Cloud sync across devices
- [ ] Export summaries to PDF/Markdown
- [ ] Voice note input
- [ ] Collaborative note sharing
- [ ] Offline-first with background sync

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

## 🔒 Security Notes

- **Never commit `.env` files** - they contain API keys
- The `.env.example` file is safe to commit (contains only placeholders)
- API keys are loaded from environment variables at runtime
- Guest users get UUID-based anonymous access

## 📝 Environment Variables

### Backend (.env)
```bash
# Application Settings
APP_NAME="AI Note Summarizer"
DEBUG=true

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./notes.db

# AI Provider: 'groq' (free), 'openai', or 'mock'
AI_PROVIDER=groq

# Groq API (FREE - get key at https://console.groq.com/keys)
GROQ_API_KEY=your-groq-api-key

# OpenAI API (optional, paid)
OPENAI_API_KEY=your-openai-api-key

# Processing Limits
MAX_TEXT_LENGTH=50000
MAX_PDF_SIZE_MB=10
CHUNK_SIZE=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for providing free, fast AI inference
- [Expo](https://expo.dev/) for the amazing React Native toolchain
- [FastAPI](https://fastapi.tiangolo.com/) for the modern Python web framework

---

Built with ❤️ using React Native, FastAPI, and AI
