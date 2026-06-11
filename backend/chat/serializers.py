from rest_framework import serializers
from .models import Room, Message, MessageReaction, Notification, UserProfile
from django.contrib.auth.models import User


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'bio', 'avatar_url', 'is_online', 'last_seen']
        read_only_fields = ['is_online', 'last_seen']


class MessageReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MessageReaction
        fields = ['id', 'message', 'user', 'username', 'emoji', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_username', 'content', 'timestamp', 'reactions']
        read_only_fields = ['id', 'sender', 'timestamp']


class RoomSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'slug', 'created_at', 'message_count', 'members_count']
        read_only_fields = ['id', 'created_at', 'slug']

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)


class RoomDetailSerializer(RoomSerializer):
    recent_messages = serializers.SerializerMethodField()

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ['recent_messages']

    def get_recent_messages(self, obj):
        msgs = obj.messages.order_by('-timestamp')[:50]
        return MessageSerializer(reversed(list(msgs)), many=True).data


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    room_slug = serializers.CharField(source='room.slug', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'sender_username', 'notif_type', 'preview', 'room_slug', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
