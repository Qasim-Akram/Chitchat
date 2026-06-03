from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room, Message
from .serializers import RoomSerializer, RoomDetailSerializer, MessageSerializer


class RoomListView(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return RoomSerializer

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
