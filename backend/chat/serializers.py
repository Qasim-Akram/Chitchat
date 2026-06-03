from rest_framework import serializers
from .models import Room, Message
from django.contrib.auth.models import User


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_username', 'content', 'timestamp']
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
