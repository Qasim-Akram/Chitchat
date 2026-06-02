"""
views for user registration and profile
login/logout is handled by simplejwt so we dont need views for that
"""

from rest_framework import generics, permissions
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    anyone can hit this endpoint, no token needed obviously
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # public endpoint


class ProfileView(generics.RetrieveAPIView):
    """
    GET /api/auth/profile/
    returns info about the currently logged in user
    the request.user comes from the JWT token automatically
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # just return the user making the request
        return self.request.user
