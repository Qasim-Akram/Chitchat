import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application

# call this first, it loads all the apps
django_asgi_app = get_asgi_application()

# only import channels stuff AFTER django is loaded
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})