"""
serializers for Room and Message models
"""

from rest_framework import serializers
from .models import Room, Message
from django.contrib.auth.models import User


class MessageSerializer(serializers.ModelSerializer):
    # show the actual username instead of just the user id
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_username', 'content', 'timestamp']
        read_only_fields = ['id', 'sender', 'timestamp']
        # sender is read only here because we set it from request.user in the view


class RoomSerializer(serializers.ModelSerializer):
    # count how many messages are in each room
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'slug', 'created_at', 'message_count', 'members_count']
        read_only_fields = ['id', 'created_at', 'slug']

    def create(self, validated_data):
        from django.utils.text import slugify
        # auto generate slug from name when creating a room
        validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)


class RoomDetailSerializer(RoomSerializer):
    # when viewing a specific room, also show recent messages
    recent_messages = serializers.SerializerMethodField()

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ['recent_messages']

    def get_recent_messages(self, obj):
        # grab last 50 messages, good enough for initial load
        msgs = obj.messages.order_by('-timestamp')[:50]
        # reverse so oldest is first (chronological order)
        return MessageSerializer(reversed(list(msgs)), many=True).data
