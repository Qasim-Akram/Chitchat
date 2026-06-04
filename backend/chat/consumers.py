"""
websocket consumer -- handles real time messaging, reactions, and online status
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Room, Message, MessageReaction, Notification, UserProfile


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

        # mark user as online
        await self.set_online_status(user, True)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # tell room this user came online
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_join',
            'username': user.username,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            user = self.scope.get('user')
            if user and user.is_authenticated:
                # mark offline
                await self.set_online_status(user, False)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'user_leave',
                    'username': user.username,
                })
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type', 'message')
        user = self.scope['user']

        if msg_type == 'message':
            content = data.get('message', '').strip()
            if not content:
                return

            message = await self.save_message(user, content)

            # create notifications for all other room members
            await self.create_notifications(user, message, content)

            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'chat_message',
                'message_id': message.id,
                'message': content,
                'username': user.username,
                'timestamp': str(message.timestamp),
            })

        elif msg_type == 'reaction':
            # handle emoji reaction in real time
            message_id = data.get('message_id')
            emoji = data.get('emoji')
            if not message_id or not emoji:
                return

            result = await self.toggle_reaction(user, message_id, emoji)

            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'reaction_update',
                'message_id': message_id,
                'emoji': emoji,
                'username': user.username,
                'action': result,  # 'added' or 'removed'
            })

    # ---- event handlers ----

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'message': event['message'],
            'username': event['username'],
            'timestamp': event['timestamp'],
        }))

    async def reaction_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'reaction',
            'message_id': event['message_id'],
            'emoji': event['emoji'],
            'username': event['username'],
            'action': event['action'],
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

    # ---- db helpers ----

    @database_sync_to_async
    def get_room(self):
        try:
            self.room = Room.objects.get(slug=self.room_slug)
            return True
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, content):
        return Message.objects.create(room=self.room, sender=user, content=content)

    @database_sync_to_async
    def set_online_status(self, user, status):
        try:
            profile = user.profile
            profile.is_online = status
            profile.save()
        except Exception:
            pass  # profile might not exist yet, thats ok

    @database_sync_to_async
    def toggle_reaction(self, user, message_id, emoji):
        try:
            message = Message.objects.get(id=message_id)
            reaction, created = MessageReaction.objects.get_or_create(
                message=message, user=user, emoji=emoji
            )
            if not created:
                reaction.delete()
                return 'removed'
            return 'added'
        except Message.DoesNotExist:
            return 'error'

    @database_sync_to_async
    def create_notifications(self, sender, message, content):
        # notify everyone in the room except the sender
        members = self.room.members.exclude(id=sender.id)
        preview = f'{sender.username}: {content[:80]}'
        notifications = [
            Notification(
                recipient=member,
                sender=sender,
                notif_type='message',
                preview=preview,
                room=self.room,
            )
            for member in members
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)
