from django.urls import path
from .views import (RoomListView, RoomDetailView, JoinRoomView, MessageListView,
                    MessageReactionView, NotificationListView, MarkNotificationsReadView,
                    UnreadNotificationCountView, UserProfileView)

urlpatterns = [
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<slug:slug>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<slug:slug>/join/', JoinRoomView.as_view(), name='room-join'),
    path('rooms/<slug:slug>/messages/', MessageListView.as_view(), name='message-list'),
    path('messages/<int:message_id>/react/', MessageReactionView.as_view(), name='message-react'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/read/', MarkNotificationsReadView.as_view(), name='notifications-read'),
    path('notifications/unread-count/', UnreadNotificationCountView.as_view(), name='unread-count'),
    path('profile/<str:user__username>/', UserProfileView.as_view(), name='user-profile'),
]
