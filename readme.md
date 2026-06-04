# ChatRoom — Real-Time Chat Application

**Student:** Muhammad Qasim Akram  
**Roll No:** F23BDOCS1E02151(2E)  
**Semester Project**

---

## What Is This

ChatRoom is a real-time chat application where users can register, log in, create chat rooms, and send messages that appear instantly on everyone's screen without refreshing the page. Users can also react to messages with emojis and receive notifications when someone sends a message in a room they are part of. The app uses WebSockets for live messaging and a REST API for everything else like authentication and loading message history.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend Framework | Django 4.2 | Handles routing, database, admin panel |
| REST API | Django REST Framework | Converts data to JSON for the frontend |
| Real-Time | Django Channels | Adds WebSocket support to Django |
| Database | PostgreSQL | Stores users, rooms, messages permanently |
| Message Broker | Redis / Memurai | Lets WebSocket connections broadcast to each other |
| ASGI Server | Daphne | Replaces Django's default server, supports WebSockets |
| Authentication | SimpleJWT | Issues JWT tokens for login sessions |
| Frontend | React.js | Single page app, handles UI and routing |
| HTTP Client | Axios | Makes API requests from React to Django |

---

## Database Models

The application has 5 database models:

| Model | Description |
|---|---|
| UserProfile | Extends the built-in User with bio, avatar, and online status |
| Room | A chat room with a name, slug, and list of members |
| Message | A message sent in a room by a user |
| MessageReaction | An emoji reaction on a message by a user |
| Notification | An alert created for room members when a new message arrives |

---

## Project Structure

```
ChatRoom/
├── backend/
│   ├── config/
│   │   ├── settings.py         # all django settings
│   │   ├── urls.py             # main url routing
│   │   └── asgi.py             # async server entry point (enables websockets)
│   ├── users/
│   │   ├── serializers.py      # validates register/login data
│   │   ├── views.py            # register and profile endpoints
│   │   ├── signals.py          # auto creates UserProfile on register
│   │   ├── apps.py             # loads signals on startup
│   │   └── urls.py             # auth url patterns
│   ├── chat/
│   │   ├── models.py           # all 5 database models
│   │   ├── serializers.py      # converts models to json
│   │   ├── views.py            # REST API views
│   │   ├── consumers.py        # WebSocket handler (real-time logic)
│   │   ├── middleware.py       # reads JWT token from websocket url
│   │   ├── routing.py          # websocket url patterns
│   │   ├── admin.py            # registers models in django admin
│   │   └── urls.py             # REST url patterns
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   ├── api.js            # axios instance with base url and auth header
        │   ├── auth.js           # register, login, profile api calls
        │   └── chat.js           # rooms, messages, reactions, notifications
        ├── context/
        │   └── AuthContext.jsx   # global login state, stored in localStorage
        ├── pages/
        │   ├── LoginPage.jsx     # login and register form
        │   ├── RoomsPage.jsx     # room list with notification bell
        │   └── ChatPage.jsx      # chat with websocket + emoji reactions
        ├── App.jsx               # routing and protected routes
        └── index.js              # react entry point
```

---

## How It Works

### Authentication Flow
1. User registers at `/api/auth/register/` — a UserProfile is auto-created via Django signals
2. User logs in at `/api/auth/login/` and receives two JWT tokens
   - Access token (valid 60 minutes) — sent with every API request
   - Refresh token (valid 7 days) — used to get a new access token when old one expires
3. React stores tokens in `localStorage` so the session survives page refresh
4. Every API request automatically includes the token via an axios interceptor

### Real-Time Messaging Flow
1. User opens a chat room, React connects to `ws://localhost:8000/ws/chat/<room-slug>/`
2. JWT token is passed as a query param since browsers cannot set custom headers on WebSockets
3. Custom middleware reads and validates the token, attaches user to the connection
4. User is marked as online in their UserProfile
5. When a message is sent, the consumer saves it to PostgreSQL
6. Notifications are created for all other room members
7. Message is broadcast to the Redis channel group for that room
8. Redis delivers it to every active connection in that room instantly

### Reactions Flow
1. User hovers over a message and clicks the emoji button
2. Emoji picker appears, user selects an emoji
3. Reaction is sent over the WebSocket (not HTTP)
4. Consumer toggles the reaction in the database
5. Reaction update is broadcast to everyone in the room in real time
6. Clicking the same emoji again removes the reaction

### Notifications Flow
1. When a message is sent, the backend creates a Notification for every room member except the sender
2. The bell icon on the rooms page shows the unread count
3. Clicking the bell fetches and displays recent notifications
4. Opening the bell marks all notifications as read

```
User types message
      ↓
React sends over WebSocket
      ↓
consumers.py receives it
      ↓
Saved to PostgreSQL
      ↓
Notifications created for other members
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
"C:\Program Files\Python313\python.exe" -m venv venv
venv\Scripts\activate
```

**3. Install dependencies**
```cmd
venv\Scripts\pip.exe install setuptools
venv\Scripts\pip.exe install -r requirements.txt
```

**4. Configure environment variables**
```cmd
copy .env.example .env
```
Open `.env` and fill in your database password and a random secret key.

**5. Run migrations**
```cmd
venv\Scripts\python.exe manage.py makemigrations
venv\Scripts\python.exe manage.py migrate
```

**6. Create admin user**
```cmd
venv\Scripts\python.exe manage.py createsuperuser
```

**7. Start the backend server**
```cmd
venv\Scripts\python.exe -m daphne -p 8000 config.asgi:application
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

Four things need to be running at the same time:

| What | How |
|---|---|
| PostgreSQL | Runs as Windows service automatically on boot |
| Memurai (Redis) | Runs as Windows service automatically on boot |
| Django backend | `venv\Scripts\python.exe -m daphne -p 8000 config.asgi:application` |
| React frontend | `npm start` in frontend folder |

---

## API Endpoints

### Authentication
| Method | URL | Description | Auth Required |
|---|---|---|---|
| POST | /api/auth/register/ | Create account | No |
| POST | /api/auth/login/ | Get JWT tokens | No |
| POST | /api/auth/refresh/ | Refresh access token | No |
| GET | /api/auth/profile/ | Get current user info | Yes |

### Chat
| Method | URL | Description | Auth Required |
|---|---|---|---|
| GET | /api/chat/rooms/ | List all rooms | Yes |
| POST | /api/chat/rooms/ | Create a room | Yes |
| GET | /api/chat/rooms/\<slug\>/ | Get room + recent messages | Yes |
| POST | /api/chat/rooms/\<slug\>/join/ | Join a room | Yes |
| GET | /api/chat/rooms/\<slug\>/messages/ | Get paginated message history | Yes |
| POST | /api/chat/messages/\<id\>/react/ | Add or remove emoji reaction | Yes |
| GET | /api/chat/notifications/ | Get all notifications | Yes |
| POST | /api/chat/notifications/read/ | Mark all notifications as read | Yes |
| GET | /api/chat/notifications/unread-count/ | Get unread notification count | Yes |
| GET | /api/chat/profile/\<username\>/ | Get user profile | Yes |
| PATCH | /api/chat/profile/\<username\>/ | Update your profile | Yes |

### WebSocket
```
ws://localhost:8000/ws/chat/<room-slug>/?token=<access-token>
```

**Send a message:**
```json
{"type": "message", "message": "hello"}
```

**Send a reaction:**
```json
{"type": "reaction", "message_id": 5, "emoji": "👍"}
```

**Receive events:**
```json
{"type": "message", "message_id": 1, "message": "hello", "username": "qasim", "timestamp": "..."}
{"type": "reaction", "message_id": 1, "emoji": "👍", "username": "qasim", "action": "added"}
{"type": "user_join", "username": "qasim"}
{"type": "user_leave", "username": "qasim"}
```

---

## Key Concepts Covered

- **REST API design** — proper HTTP methods, status codes, serializers, pagination
- **JWT Authentication** — stateless auth with access and refresh tokens
- **Django Signals** — auto creating UserProfile when a user registers
- **WebSockets** — persistent bidirectional connections for real-time communication
- **Async programming** — Django Channels runs async consumers, database calls wrapped with `database_sync_to_async`
- **Message broker pattern** — Redis as a pub/sub layer between server processes
- **React state management** — Context API for global auth state
- **Protected routing** — redirect unauthenticated users back to login
- **CORS** — configured to allow React dev server to talk to Django

---

## Admin Panel

Go to `http://localhost:8000/admin` and log in with your superuser credentials to manage all models — Users, UserProfiles, Rooms, Messages, MessageReactions, and Notifications.