# Sensory Learning Companion — Project Documentation

**Research Project | SLIIT | 4th Year**

---

## 1. Introduction

### 1.1 Project Overview

**Sensory Learning Companion** (also referred to as **EduSense** in the backend) is a research-oriented educational platform designed to support **multi-sensory learning** for students. The system combines a **React-based web client** with a **FastAPI backend** to deliver lessons that engage multiple modalities: **visual**, **audio**, and **haptic**, with the aim of improving comprehension and retention, especially in science education.

The application targets learners (e.g., Grade 6 Science) and provides:

- **Structured lessons** with video, audio, and haptic indicators  
- **Educational Scene & Script Generator**: create scene graphs and narration scripts from textbook images or text  
- **Offline-capable** saved lessons via browser storage  
- **User authentication** and role-based access (student/teacher)  
- **Progress tracking** and a dashboard for completed and in-progress lessons  

This document describes the **frontend (client) application** in detail, with context on how it integrates with the backend for a complete research system.

### 1.2 Technology Clarification

The **client** is a **React web application** built with **Vite**, not a React Native mobile app. It runs in a browser and can be used on desktop and mobile devices through responsive design. The backend is an **EduSense API** (FastAPI) that supports future mobile or other clients.

### 1.3 Research Context

The project fits within research on:

- **Multi-sensory learning** and learning styles  
- **Accessibility** in education (visual, auditory, tactile/haptic)  
- **Technology-enhanced learning** and learning management  
- **Automated content processing** (e.g., scene graphs, narration scripts) for educational content  

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SENSORY LEARNING COMPANION                    │
├─────────────────────────────────────────────────────────────────┤
│  CLIENT (React + Vite)          │  SERVER (FastAPI / EduSense)   │
│  - Login / Register             │  - JWT Auth                     │
│  - Student Dashboard            │  - Users, Lessons, Quizzes      │
│  - Scene & Script Generator     │  - Content processing (ML)      │
│  - Offline lessons (IndexedDB)  │  - Progress, Activities         │
│  - REST API (axios)             │  - MongoDB                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Client–Server Communication

- **Base URL**: Configured via `VITE_API_URL` (e.g. `http://localhost:5001` or the deployed backend URL).  
- **Auth**: JWT sent in `Authorization: Bearer <token>` header.  
- **Storage**: Token and user data stored in `localStorage`; restored on load for persistent sessions.  
- **Error handling**: 401 responses clear auth and redirect to `/login`.

---

## 3. Client Application (Frontend) — Detailed Description

### 3.1 Technology Stack

| Category        | Technology                          |
|----------------|--------------------------------------|
| Framework      | React 19.x                          |
| Build tool     | Vite 7.x                            |
| Routing        | React Router DOM 7.x               |
| HTTP client    | Axios                               |
| Styling        | Tailwind CSS                        |
| Animations     | Framer Motion                       |
| Visualization  | D3.js (scene graphs)                |
| Icons          | Lucide React                        |
| Utilities      | UUID (lesson IDs)                   |

### 3.2 Project Structure (Client)

```
client/
├── src/
│   ├── App.jsx                 # Root app, router, AuthProvider
│   ├── main.jsx                # Entry point
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state, login/logout, role
│   ├── services/
│   │   ├── api.js              # Axios instance, interceptors
│   │   └── IT22551252/
│   │       ├── SceneGeneratorService.ts   # Scene/script generation (mock)
│   │       └── IndexedDBService.ts        # Offline lesson storage
│   ├── pages/
│   │   ├── Login.jsx            # Login & register UI
│   │   ├── Register.jsx         # (if used separately)
│   │   ├── StudentPortal.jsx    # Student routes container
│   │   ├── student/
│   │   │   └── StudentDashboard.jsx
│   │   └── IT22551252/
│   │       ├── InputPage.jsx    # Upload image / enter text
│   │       ├── OutputPage.jsx   # Scene graph + narration script
│   │       └── OfflineModePage.jsx
│   ├── layouts/
│   │   └── StudentLayout.jsx
│   └── components/
│       ├── shared/
│       │   └── Navbar.jsx
│       └── IT22551252/
│           ├── Layout.jsx      # Generator layout + Navigation
│           ├── Navigation.jsx   # Generator nav (Input, Output, Offline)
│           ├── UploadBox.jsx
│           ├── ProgressBar.jsx
│           ├── SceneGraph.jsx  # D3 force-directed graph
│           └── NarrationScript.jsx
├── package.json
├── tailwind.config.js
└── vite.config (or similar)
```

### 3.3 Authentication and Authorization

- **AuthContext** holds: `isAuthenticated`, `user`, `userRole`, `loading`, and methods `login`, `logout`.  
- On load, auth is restored from `localStorage` (`user`, `token`, `userId`).  
- **Login page** supports:
  - **Login**: `POST /api/auth/login` with `username`, `password`; stores `user` and `token`; redirects students to `/student/dashboard`.  
  - **Register**: `POST /api/auth/register` with `username`, `password`, `fullname`, `role: "student"`.  
- **StudentPortal** checks `isAuthenticated` and `userRole === "student"`; otherwise redirects to `/login`.  
- **API service** (`api.js`) attaches the JWT to every request and redirects to `/login` on 401.

### 3.4 Main User Flows

#### 3.4.1 Entry and Dashboard

1. User opens app → root redirects to `/login`.  
2. Optional welcome screen (“Welcome to Sensory Learning Companion”) → click to show login form.  
3. Login or register → on success, redirect to `/student/dashboard`.  
4. **Student Dashboard** shows:
   - Welcome message and user name  
   - Stats: completed lessons, in progress, total lessons  
   - List of lessons with subject, status (completed / in progress / not started), duration, points, and indicators for video, audio, haptics  
   - “Learn Now” button → navigates to `/student/generator/input`  
   - Lesson list is currently **mock data** (not yet fully wired to backend lessons API).

#### 3.4.2 Educational Scene & Script Generator

The generator is a self-contained flow under `/student/generator/*`:

- **Input** (`/student/generator/input`):
  - **Upload**: User selects a textbook image. The client simulates steps (analyzing image, extracting text, generating scene graph, creating narration) and calls `SceneGeneratorService.processImage(file)`.  
  - **Text**: User enters text. Similar flow with `SceneGeneratorService.processText(text)`.  
  - Result: **nodes** (concepts/examples/definitions), **links** (relationships), and **script** (narration text).  
  - Lesson is saved to **IndexedDB** via `IndexedDBService.saveLesson()` with a UUID, then user is redirected to the Output page with the result in location state.

- **Output** (`/student/generator/output`):
  - Displays **Scene Graph** (D3 force-directed graph: nodes and labelled links) and **Narration Script** (paragraph with sentence-level hover).  
  - Actions: **Download JSON** (scene + script), **Preview in LMS** (placeholder).  
  - If no result in state, redirects back to Input.

- **Offline** (`/student/generator/offline`):
  - Lists **saved lessons** from IndexedDB (sorted by timestamp).  
  - User can open a lesson (navigates to Output with that lesson’s data) or delete it.  
  - Banner indicates online/offline status; lessons remain available offline.

#### 3.4.3 Scene Generator Service (Current Implementation)

- **SceneGeneratorService** (TypeScript) is a **client-side placeholder**: it does not call the backend.  
- `processImage(file)` and `processText(text)` simulate delay and return **mock** scene graph + script (e.g. photosynthesis example or simple graph from input text).  
- In a full research setup, this would be replaced by calls to backend content-processing APIs (e.g. OCR + NLP, scene graph generation, script generation).

### 3.5 Key Components

| Component        | Purpose                                                                 |
|-----------------|-------------------------------------------------------------------------|
| **AuthProvider**| Global auth state and persistence                                      |
| **StudentDashboard** | Overview of lessons, progress, and entry to generator            |
| **InputPage**   | File upload + text input; progress bar; calls SceneGeneratorService    |
| **OutputPage**  | Scene graph (D3) + narration script; download JSON                   |
| **OfflineModePage** | List, open, delete IndexedDB lessons                              |
| **SceneGraph**  | D3 force simulation: nodes (colored by type), links with labels, zoom, drag |
| **NarrationScript** | Renders script with sentence hover (for future node highlighting) |
| **UploadBox**   | Drag-and-drop or paste for image; text area for raw text              |
| **ProgressBar** | Progress percentage and status text during “processing”              |
| **Navigation**  | Generator sub-nav: Input, Output, Offline; “Back to Dashboard”        |
| **Layout**      | Wraps generator routes with Navigation and Outlet                     |

### 3.6 Offline and Data Persistence

- **IndexedDB** (via `IndexedDBService`):
  - Database name: `educationalSceneGenerator`.  
  - Object store: `lessons`; each lesson has `id`, `title`, `timestamp`, `nodes`, `links`, `script`.  
  - Methods: `saveLesson`, `getLessons`, `getLesson`, `deleteLesson`.  
- Saved lessons are available without network; the Offline page and Output (when opened from Offline) work offline.

### 3.7 API Usage (Client)

The client uses these backend endpoints (from codebase):

- `POST /api/auth/register` — Register (username, password, fullname, role).  
- `POST /api/auth/login` — Login (username, password); returns `user`, `token`.  
- `GET /api/auth/users/:id` — Fetch user by id (dashboard).  

Other backend modules (lessons, quizzes, activities, content, progress, uploads) are available on the server for future integration (e.g. real lessons list, quiz, progress sync).

---

## 4. Backend (EduSense API) — Summary

- **Framework**: FastAPI.  
- **Database**: MongoDB (e.g. Beanie ODM).  
- **Auth**: JWT (e.g. python-jose).  
- **Features**: User auth, lessons CRUD, activities, quiz generation/submit/results, and placeholders for content processing, progress, uploads.  
- **Docs**: Swagger at `/docs`, ReDoc at `/redoc`.  
- **Run**: e.g. `uvicorn app.main:app --reload` (default port 8000).  

The client’s `VITE_API_URL` must point to this backend (e.g. `http://localhost:8000` if same host, or the correct host/port).

---

## 5. Research-Oriented Features

- **Multi-sensory design**: UI exposes video, audio, and haptic dimensions per lesson (backend can drive actual assets).  
- **Scene graph + narration**: Structured representation of concepts and relationships plus script for narration (suitable for accessibility and different modalities).  
- **Offline-first**: IndexedDB allows use without connectivity and supports studies in low-connectivity settings.  
- **Role-based access**: Separation of student (and future teacher) flows for experiments on different user roles.  
- **Extensibility**: Backend content processing and ML pipelines can be connected to replace the client-side mock generator for real OCR/NLP and scene/script generation.

---

## 6. How to Run the Client (Development)

1. Install dependencies: `cd client && npm install`  
2. Set backend URL: create `.env` with `VITE_API_URL=http://localhost:8000` (or your server URL).  
3. Start dev server: `npm run dev`  
4. Build: `npm run build`; preview: `npm run start`  

Ensure the EduSense backend is running and CORS allows the client origin.

---

## 7. Document Summary

This document describes the **Sensory Learning Companion** research project with focus on the **React (web) client**: introduction, architecture, authentication, main flows (dashboard, scene/script generator, offline), main components, offline storage, and API usage. The backend (EduSense) is summarized for context. The system is positioned as a **multi-sensory educational platform** suitable for research in learning technologies and accessibility.

---

*Generated for the Sensory Learning Companion project. For backend details, see `server/README.md`.*
