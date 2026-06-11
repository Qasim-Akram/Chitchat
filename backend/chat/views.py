from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room, Message, MessageReaction, Notification, UserProfile
from .serializers import (RoomSerializer, RoomDetailSerializer, MessageSerializer,
                          MessageReactionSerializer, NotificationSerializer, UserProfileSerializer)


class RoomListView(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoomSerializer

    def perform_create(self, serializer):
        room = serializer.save()
        room.members.add(self.request.user)


class RoomDetailView(generics.RetrieveAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'


class JoinRoomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            room = Room.objects.get(slug=slug)
        except Room.DoesNotExist:
            return Response({'error': 'room not found'}, status=status.HTTP_404_NOT_FOUND)
        room.members.add(request.user)
        return Response({'message': f'joined {room.name}'}, status=status.HTTP_200_OK)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        slug = self.kwargs['slug']
        queryset = Message.objects.filter(room__slug=slug).order_by('-timestamp')
        before_id = self.request.query_params.get('before')
        if before_id:
            queryset = queryset.filter(id__lt=before_id)
        return queryset[:30]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(reversed(list(queryset)), many=True)
        return Response(serializer.data)


class MessageReactionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        emoji = request.data.get('emoji')
        if not emoji:
            return Response({'error': 'emoji is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'message not found'}, status=status.HTTP_404_NOT_FOUND)

        
        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=request.user,
            emoji=emoji
        )

        if not created:
            reaction.delete()
            return Response({'message': 'reaction removed'}, status=status.HTTP_200_OK)

        serializer = MessageReactionSerializer(reaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class MarkNotificationsReadView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'all marked as read'})


class UnreadNotificationCountView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})


class UserProfileView(generics.RetrieveUpdateAPIView):
   
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'user__username'
    queryset = UserProfile.objects.all()

    def update(self, request, *args, **kwargs):

        instance = self.get_object()
        if instance.user != request.user:
            return Response({'error': 'not your profile'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
