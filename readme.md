# ChitChat — Real-Time Chat Application

**Student:** Muhammad Qasim Akram
**Roll No:** F23BDOCS1E02151(2E)
**Semester Project**

---

## What Is This

ChitChat is a real-time chat application where users can register, log in, create chat rooms, and send messages that appear instantly on everyone's screen without refreshing the page. It uses WebSockets for live messaging and a REST API for everything else like authentication and loading message history.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend Framework | Django 4.2 | Handles routing, database, admin panel |
| REST API | Django REST Framework | Converts data to JSON for the frontend |
| Real-Time | Django Channels | Adds WebSocket support to Django |
| Database | PostgreSQL | Stores users, rooms, messages permanently |
| Message Broker | Redis (Memurai on Windows) | Lets WebSocket connections broadcast to each other |
| ASGI Server | Daphne | Replaces Django's default server, supports WebSockets |
| Authentication | SimpleJWT | Issues JWT tokens for login sessions |
| Frontend | React.js | Single page app, handles UI and routing |
| HTTP Client | Axios | Makes API requests from React to Django |

---

## Project Structure

```
chitchat/
├── backend/
│   ├── config/
│   │   ├── settings.py       # all django settings
│   │   ├── urls.py           # main url routing
│   │   └── asgi.py           # async server entry point (enables websockets)
│   ├── users/
│   │   ├── serializers.py    # validates register/login data
│   │   ├── views.py          # register and profile endpoints
│   │   └── urls.py           # auth url patterns
│   ├── chat/
│   │   ├── models.py         # Room and Message database tables
│   │   ├── serializers.py    # converts models to json
│   │   ├── views.py          # REST API views for rooms and messages
│   │   ├── consumers.py      # WebSocket handler (real-time logic)
│   │   ├── middleware.py     # reads JWT token from websocket url
│   │   ├── routing.py        # websocket url patterns
│   │   └── urls.py           # REST url patterns
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   ├── api.js         # axios instance with base url and auth header
        │   ├── auth.js        # register, login, profile api calls
        │   └── chat.js        # rooms and messages api calls
        ├── context/
        │   └── AuthContext.jsx  # global login state, stored in localStorage
        ├── pages/
        │   ├── LoginPage.jsx    # login and register form
        │   ├── RoomsPage.jsx    # list of chat rooms
        │   └── ChatPage.jsx     # actual chat with websocket connection
        ├── App.jsx              # routing and protected routes
        └── index.js             # react entry point
```

---

## How It Works

### Authentication Flow
1. User registers at `/api/auth/register/` with username, email, password
2. User logs in at `/api/auth/login/` and receives two JWT tokens
   - Access token (valid 60 minutes) — sent with every request
   - Refresh token (valid 7 days) — used to get a new access token
3. React stores tokens in `localStorage` so the session survives page refresh
4. Every API request automatically includes the token via an axios interceptor

### Real-Time Messaging Flow
1. User opens a chat room, React connects to `ws://localhost:8000/ws/chat/<room-slug>/`
2. The JWT token is passed as a query param in the WebSocket URL
3. Backend middleware reads and validates the token, attaches user to the connection
4. When a message is sent, the WebSocket consumer saves it to PostgreSQL
5. The consumer then broadcasts it to the Redis channel group for that room
6. Redis delivers it to every active WebSocket connection in that room
7. All connected browsers receive the message instantly

```
User types message
      ↓
React sends over WebSocket
      ↓
consumers.py receives it
      ↓
Saved to PostgreSQL
      ↓
Broadcast to Redis group
      ↓
Redis delivers to all connections in room
      ↓
Everyone sees it instantly
```

---

## Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ (LTS)
- PostgreSQL
- Memurai (Redis for Windows) — https://www.memurai.com

### Backend Setup

**1. Create the database in PostgreSQL**
```sql
CREATE DATABASE chatapp_db;
```

**2. Create and activate virtual environment**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
```

**3. Install dependencies**
```cmd
pip install -r requirements.txt
```

**4. Configure environment variables**
```cmd
copy .env.example .env
```
Open `.env` and fill in your database password and a random secret key.

**5. Run migrations**
```cmd
python manage.py makemigrations
python manage.py migrate
```

**6. Create admin user**
```cmd
python manage.py createsuperuser
```

**7. Start the backend server**
```cmd
daphne -p 8000 config.asgi:application
```

### Frontend Setup

**1. Install dependencies**
```cmd
cd frontend
npm install
```

**2. Start the frontend**
```cmd
npm start
```

Browser opens automatically at `http://localhost:3000`

---

## Running the App

You need four things running at the same time:

| What | How |
|---|---|
| PostgreSQL | Runs as Windows service automatically |
| Memurai (Redis) | Runs as Windows service automatically |
| Django backend | `daphne -p 8000 config.asgi:application` in backend folder |
| React frontend | `npm start` in frontend folder |

---

## API Endpoints

### Authentication
| Method | URL | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register/ | Create account | No |
| POST | /api/auth/login/ | Get JWT tokens | No |
| POST | /api/auth/refresh/ | Refresh access token | No |
| GET | /api/auth/profile/ | Get current user info | Yes |

### Chat
| Method | URL | Description | Auth |
|---|---|---|---|
| GET | /api/chat/rooms/ | List all rooms | Yes |
| POST | /api/chat/rooms/ | Create a room | Yes |
| GET | /api/chat/rooms/\<slug\>/ | Get room + recent messages | Yes |
| POST | /api/chat/rooms/\<slug\>/join/ | Join a room | Yes |
| GET | /api/chat/rooms/\<slug\>/messages/ | Get message history | Yes |

### WebSocket
```
ws://localhost:8000/ws/chat/<room-slug>/?token=<access-token>
```

**Send a message:**
```json
{"message": "hello"}
```

**Receive events:**
```json
{"type": "message", "message_id": 1, "message": "hello", "username": "qasim", "timestamp": "..."}
{"type": "user_join", "username": "qasim"}
{"type": "user_leave", "username": "qasim"}
```

---

## Key Concepts Covered

- **REST API design** — proper HTTP methods, status codes, serializers
- **JWT Authentication** — stateless auth with access and refresh tokens
- **WebSockets** — persistent bidirectional connections for real-time communication
- **Async programming** — Django Channels runs async consumers, database calls wrapped with `database_sync_to_async`
- **Message broker pattern** — Redis as a pub/sub layer between server processes
- **React state management** — Context API for global auth state
- **Protected routing** — redirect unauthenticated users back to login
- **CORS** — configured to allow React dev server to talk to Django

---

## Admin Panel

Go to `http://localhost:8000/admin` and log in with your superuser credentials to manage users, rooms, and messages directly from the Django admin interface.