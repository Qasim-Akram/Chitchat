"""
auth endpoints:
- POST /api/auth/register/   -> create account
- POST /api/auth/login/      -> get jwt tokens
- POST /api/auth/refresh/    -> get new access token using refresh token
- GET  /api/auth/profile/    -> get logged in user info
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),  # simplejwt handles this
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
