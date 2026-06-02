"""
REST API views for chat rooms and messages
these handle the HTTP requests (not websocket, thats in consumers.py)

quick overview:
- RoomListView: list all rooms / create new room
- RoomDetailView: get one room with its messages
- JoinRoomView: add yourself to a room
- MessageListView: get paginated message history for a room
"""

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room, Message
from .serializers import RoomSerializer, RoomDetailSerializer, MessageSerializer


class RoomListView(generics.ListCreateAPIView):
    """
    GET  /api/chat/rooms/        -> list all rooms
    POST /api/chat/rooms/        -> create a new room
    """
    queryset = Room.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # use different serializer for list vs create
        return RoomSerializer

    def perform_create(self, serializer):
        # when creating a room, automatically add the creator as a member
        room = serializer.save()
        room.members.add(self.request.user)


class RoomDetailView(generics.RetrieveAPIView):
    """
    GET /api/chat/rooms/<slug>/   -> get room info + recent messages
    """
    queryset = Room.objects.all()
    serializer_class = RoomDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'  # look up by slug not pk


class JoinRoomView(APIView):
    """
    POST /api/chat/rooms/<slug>/join/   -> join a room
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            room = Room.objects.get(slug=slug)
        except Room.DoesNotExist:
            return Response({'error': 'room not found'}, status=status.HTTP_404_NOT_FOUND)

        # add user to members, if already a member this does nothing
        room.members.add(request.user)
        return Response({'message': f'joined {room.name}'}, status=status.HTTP_200_OK)


class MessageListView(generics.ListAPIView):
    """
    GET /api/chat/rooms/<slug>/messages/   -> get message history
    supports ?before=<message_id> for pagination (load older messages)
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        slug = self.kwargs['slug']
        queryset = Message.objects.filter(room__slug=slug).order_by('-timestamp')

        # simple cursor pagination: load messages before a certain id
        before_id = self.request.query_params.get('before')
        if before_id:
            queryset = queryset.filter(id__lt=before_id)

        # return 30 messages at a time
        return queryset[:30]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(reversed(list(queryset)), many=True)
        return Response(serializer.data)
