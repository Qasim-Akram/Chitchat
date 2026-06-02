# Real-Time Chat App - Backend

**Student:** Muhammad Qasim Akram  
**Roll No:** F23BDOCS1E02151(2E)  
**Project:** Semester Project - Real-Time Chat Application

---

## What This Is

A chat backend built with Django. It has two ways of communicating:

1. **REST API** (HTTP) - for login, registration, fetching message history, creating rooms
2. **WebSockets** - for real-time messaging (you type something, everyone in the room sees it instantly)

---

## Tech Used and Why

| Technology | What It Does |
|---|---|
| Django | Main web framework |
| Django REST Framework | Makes building REST APIs easier |
| Django Channels | Adds WebSocket support to Django |
| PostgreSQL | Database (stores users, rooms, messages) |
| Redis | Message broker - lets different server processes communicate |
| SimpleJWT | Handles login tokens |
| Daphne | ASGI server that replaces Django's default dev server |

### Why Redis?
When user A and user B connect to the chat server, they might land on different server processes. Redis acts as a "post office" -- when A sends a message, it goes to Redis, and Redis delivers it to B's connection. Without Redis, only users on the same process could communicate.

---

## Project Structure

```
backend/
├── config/
│   ├── settings.py      # all django settings
│   ├── urls.py          # main url file
│   └── asgi.py          # async server config (enables websockets)
├── users/
│   ├── serializers.py   # register/login data validation
│   ├── views.py         # register and profile endpoints
│   └── urls.py          # auth url patterns
├── chat/
│   ├── models.py        # Room and Message database tables
│   ├── serializers.py   # convert models to json
│   ├── views.py         # REST API views
│   ├── consumers.py     # WebSocket handler (the real-time part)
│   ├── routing.py       # WebSocket URL patterns
│   ├── urls.py          # REST URL patterns
│   └── admin.py         # django admin config
└── requirements.txt
```

---

## Setup Instructions

### Step 1 - Install PostgreSQL and Redis

On Ubuntu/WSL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server
```

On Windows: Download installers from official sites.  
On Mac: `brew install postgresql redis`

### Step 2 - Create the Database

```bash
# open postgres shell
sudo -u postgres psql

# inside psql, run these:
CREATE DATABASE chatapp_db;
CREATE USER postgres WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE chatapp_db TO postgres;
\q
```

### Step 3 - Set Up Python Environment

```bash
cd backend/

# create virtual environment
python -m venv venv

# activate it
source venv/bin/activate       # linux/mac
venv\Scripts\activate          # windows

# install dependencies
pip install -r requirements.txt
```

### Step 4 - Configure Environment Variables

```bash
cp .env.example .env
# now open .env and fill in your actual database password and secret key
```

For the SECRET_KEY, just generate a random string, something like:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 5 - Run Migrations

Migrations are Django's way of creating/updating database tables based on your models.

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 6 - Create Admin User (optional but useful)

```bash
python manage.py createsuperuser
```

### Step 7 - Start Redis

```bash
redis-server
```

### Step 8 - Run the Server

```bash
# we use daphne instead of runserver because it supports websockets
daphne -p 8000 config.asgi:application

# or if you just want to test REST APIs without websockets:
python manage.py runserver
```

---

## API Endpoints

### Auth

| Method | URL | Description | Auth Required |
|---|---|---|---|
| POST | /api/auth/register/ | Create account | No |
| POST | /api/auth/login/ | Get JWT tokens | No |
| POST | /api/auth/refresh/ | Refresh access token | No |
| GET | /api/auth/profile/ | Get current user info | Yes |

### Chat

| Method | URL | Description |
|---|---|---|
| GET | /api/chat/rooms/ | List all rooms |
| POST | /api/chat/rooms/ | Create a room |
| GET | /api/chat/rooms/<slug>/ | Get room + recent messages |
| POST | /api/chat/rooms/<slug>/join/ | Join a room |
| GET | /api/chat/rooms/<slug>/messages/ | Get message history |

### WebSocket

Connect to: `ws://localhost:8000/ws/chat/<room-slug>/`

You need to pass the JWT token. How to do this is handled in the frontend.

**Messages you send:**
```json
{"message": "hello world"}
```

**Messages you receive:**
```json
{"type": "message", "message_id": 5, "message": "hello world", "username": "qasim", "timestamp": "2024-..."}
{"type": "user_join", "username": "qasim"}
{"type": "user_leave", "username": "qasim"}
```

---

## How the Real-Time Flow Works

```
User types message
       ↓
Browser sends over WebSocket
       ↓
ChatConsumer.receive() gets called
       ↓
Message saved to PostgreSQL
       ↓
consumer.channel_layer.group_send() sends to Redis
       ↓
Redis broadcasts to all connections in that room
       ↓
Each connection's chat_message() method sends to client
       ↓
All users see message instantly
```

---

## Testing the API

You can use Postman or curl.

**Register:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"qasim","email":"q@test.com","password":"pass123","password2":"pass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"qasim","password":"pass123"}'
```
This returns `access` and `refresh` tokens. Copy the access token.

**Create a Room:**
```bash
curl -X POST http://localhost:8000/api/chat/rooms/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{"name":"General"}'
```
