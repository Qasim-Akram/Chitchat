from django.urls import path
from .views import RoomListView, RoomDetailView, JoinRoomView, MessageListView

urlpatterns = [
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<slug:slug>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<slug:slug>/join/', JoinRoomView.as_view(), name='room-join'),
    path('rooms/<slug:slug>/messages/', MessageListView.as_view(), name='message-list'),
]
