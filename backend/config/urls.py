"""
main urls file
all routes go through here
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),   # login, register, etc
    path('api/chat/', include('chat.urls')),    # rooms, messages
]
