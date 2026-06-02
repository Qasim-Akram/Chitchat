"""
ASGI config -- this replaces the normal wsgi.py

WSGI is the old way, it only handles regular HTTP requests
ASGI is the new way, it handles HTTP AND websockets
Django Channels hooks into ASGI to add websocket support
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# ProtocolTypeRouter splits traffic based on protocol type
# http goes to normal django, websocket goes to channels
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})
