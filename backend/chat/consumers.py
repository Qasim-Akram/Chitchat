import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Room, Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_slug = self.scope['url_route']['kwargs']['room_slug']
        self.room_group_name = f'chat_{self.room_slug}'

        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        room_exists = await self.get_room()
        if not room_exists:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'username': user.username,
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            user = self.scope.get('user')
            if user and user.is_authenticated:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_leave',
                        'username': user.username,
                    }
                )

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        message_content = data.get('message', '').strip()
        if not message_content:
            return

        user = self.scope['user']

        message = await self.save_message(user, message_content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'message': message_content,
                'username': user.username,
                'timestamp': str(message.timestamp),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'message': event['message'],
            'username': event['username'],
            'timestamp': event['timestamp'],
        }))

    async def user_join(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username'],
        }))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username'],
        }))

    @database_sync_to_async
    def get_room(self):
        try:
            self.room = Room.objects.get(slug=self.room_slug)
            return True
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, content):
        return Message.objects.create(
            room=self.room,
            sender=user,
            content=content
        )
