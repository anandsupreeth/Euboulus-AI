# AI Interview Preparation API

A beginner-friendly FastAPI service for the React interview-preparation frontend. Interview records are stored in MongoDB. Feedback is still clearly labeled demo feedback.

## Start on Windows PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Before starting FastAPI, make sure MongoDB is running and configure `backend/.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=ai_interview_prep
MONGODB_COLLECTION_INTERVIEWS=interviews
AUTH_SECRET_KEY=replace-with-a-random-secret-at-least-32-characters
AUTH_COOKIE_SECURE=false
AUTH_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Generate a strong local signing key in PowerShell with
`python -c "import secrets; print(secrets.token_urlsafe(48))"`. Keep it in the ignored `backend/.env`; use a secret manager and `AUTH_COOKIE_SECURE=true` behind HTTPS in production. Auth refuses to issue tokens if the key is missing or shorter than 32 characters.

For a local database, install MongoDB Community Server and start its service. The API checks the connection when it starts, so it will stop with a clear startup error if MongoDB is not available. Alternatively, create a MongoDB Atlas cluster and replace `MONGODB_URI` with your Atlas connection string (usually beginning with `mongodb+srv://`). For Atlas, create a database user and allow your development IP in Network Access. URL-encode special characters in the URI password. Keep the real URI private; `backend/.env` is ignored by Git. The checked-in `backend/.env.example` contains safe local defaults only.

The API listens at `http://127.0.0.1:8000`. Interactive API documentation is at `http://127.0.0.1:8000/docs`.

Keep this backend terminal running. In another terminal, start the frontend:

```powershell
cd frontend
npm run dev
```

The Vite development server forwards requests beginning with `/api` to the FastAPI service.

## Routes

- `GET /api/health` â€” confirms the API and MongoDB are available.
- `POST /api/auth/register` and `POST /api/auth/login` â€” create an account or start a session.
- `POST /api/auth/refresh` and `POST /api/auth/logout` â€” rotate or revoke the HttpOnly refresh cookie.
- `GET /api/dashboard` â€” returns dashboard counts from MongoDB plus recommendation placeholders.
- `GET /api/interviews` â€” lists the latest interviews stored in MongoDB.
- `POST /api/interviews` â€” saves an interview and returns demo feedback.
- `GET /api/interviews/{interview_id}` â€” returns one saved interview.

### Subjects, voice interviews and scoring

All of these require `Authorization: Bearer <access token>` and only ever return the signed-in user's data.

- `GET /api/subjects` — every subject grouped by category (Software Engineering, Product Management) with the user's progress.
- `GET /api/subjects/{subject}` — one subject with its topics and per-topic progress.
- `GET /api/subjects/{subject}/topics/{topic}/attempts` — questions the user answered in that topic, newest first, each with score, summary and improvement points.
- `GET /api/subjects/{subject}/topics/{topic}/summary` — improvement-points summary for the topic (regenerated only when new answers exist).
- `POST /api/voice/sessions` — start a voice interview from a catalog topic (`subject_slug` + `topic_slug`) or a free-text `topic` + `subtopic`.
- `POST /api/voice/sessions/{id}/answer` (WAV upload), `POST /api/voice/sessions/{id}/finish`, `GET /api/voice/sessions`, `GET /api/voice/sessions/{id}`, `GET /api/voice/sessions/{id}/audio/{file}`.

Set `OPENAI_API_KEY` in `backend/.env`. Each answer step runs a LangGraph workflow: the answer is transcribed and scored while `gpt-audio-mini` speaks the next question.

MongoDB collections (indexes are created at startup):

| Collection | Purpose | Key indexes |
| --- | --- | --- |
| `subjects` | Catalog subjects (seeded from `app/catalog/data.py`, upserted by slug) | `slug` unique |
| `topics` | Sub topics of each subject | `(subject_slug, slug)` unique |
| `voice_sessions` | One interview session with embedded turns, audio file names and feedback | `(user_id, created_at)` |
| `question_attempts` | One document per answered catalog question: score, strengths, improvements | `(user_id, subject_slug, topic_slug, created_at)`, `(session_id, turn_index)` unique |
| `topic_summaries` | Cached improvement summary per user and topic | `(user_id, subject_slug, topic_slug)` unique |

Recorded audio is stored under `backend/storage/audio/<session id>/` and served only to the session's owner.

Example request body for `POST /api/interviews`:

```json
{
  "topic": "DSA",
  "difficulty": "Medium",
  "transcript": "I would reverse the links one at a time using three pointers.",
  "duration_seconds": 95
}
```

The sample feedback is a deterministic placeholder based on transcript length, not a real AI assessment. Passwords are hashed with Argon2id; its library generates and stores a distinct random salt as part of each encoded hash. Access tokens are short-lived signed JWTs (signed, not encrypted) and are held in frontend memory. Refresh tokens are random opaque values, stored hashed in MongoDB, rotated on use, and sent in an HttpOnly, SameSite=Strict cookie. Reuse of a revoked refresh token revokes its token family.

### Authentication concepts

- A password hash is deliberately expensive to calculate and one-way. Argon2id creates a fresh random salt for every password and stores the salt and work parameters with the hash. A salt is not secret and is not a shared "salt key"; the JWT signing secret is a separate server-only credential.
- A JWT has a header, readable claims, and a signature. The signature proves the claims were issued by a holder of the signing key and were not changed; it does not encrypt them. Keep secrets and sensitive personal data out of its payload.
- The access JWT is short-lived and sent on API requests. The longer-lived refresh token is a random opaque credential, not a JWT; rotation lets the server detect replay and revoke its session family. HttpOnly prevents JavaScript from reading the cookie, while SameSite and Origin checks reduce cross-site request risk.

This auth example does not yet protect the interview/dashboard endpoints or associate records with users. Before using this app with real user data, add authorization and per-user data ownership, CSRF/origin protections appropriate to the deployment, rate limiting, email verification/password recovery, monitoring, and operational secret management. Never commit your `.env` or expose the MongoDB URI in the React frontend.
