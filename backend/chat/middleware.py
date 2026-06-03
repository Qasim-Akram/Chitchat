"""
custom middleware for websocket authentication

the problem: normal HTTP requests send the JWT token in the Authorization header
but WebSocket connections cant set custom headers from the browser

the solution: pass the token as a query param in the URL
ws://localhost:8000/ws/chat/general/?token=eyJ...

this middleware reads that token, validates it, and attaches the user
to scope['user'] just like Django's normal auth does for HTTP
"""

from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    try:
        # validate the token using simplejwt
        token = AccessToken(token_str)
        user_id = token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        # any error means invalid token
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # grab token from query string
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_list = params.get('token', [])

        if token_list:
            scope['user'] = await get_user_from_token(token_list[0])
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)