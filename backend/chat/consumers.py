"""
this is the websocket consumer
its kind of like a view but for websocket connections instead of http

how it works:
1. user opens a websocket connection to /ws/chat/<room_slug>/
2. connect() gets called, we add them to a channel group for that room
3. when they send a message, receive() saves it to db and broadcasts to the group
4. the channel group (via redis) sends it to everyone connected to that room
5. disconnect() removes them from the group
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Room, Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # get the room slug from the url
        self.room_slug = self.scope['url_route']['kwargs']['room_slug']

        # channel group name -- everyone in the same room shares this group name
        # so when we broadcast to this group, everyone gets it
        self.room_group_name = f'chat_{self.room_slug}'

        # check if user is authenticated
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            # close connection if not logged in
            await self.close()
            return

        # check if this room exists
        room_exists = await self.get_room()
        if not room_exists:
            await self.close()
            return

        # add this connection to the room's channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name  # channel_name is unique to this connection
        )

        # accept the websocket connection
        await self.accept()

        # tell everyone in the room that someone joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',  # this calls the user_join method below
                'username': user.username,
            }
        )

    async def disconnect(self, close_code):
        # remove from group when they disconnect
        if hasattr(self, 'room_group_name'):
            user = self.scope.get('user')
            if user and user.is_authenticated:
                # tell room someone left
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
        """called when client sends a message through the websocket"""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return  # ignore bad json

        message_content = data.get('message', '').strip()
        if not message_content:
            return  # dont save empty messages

        user = self.scope['user']

        # save message to database (have to use sync_to_async bc db calls are synchronous)
        message = await self.save_message(user, message_content)

        # broadcast the message to everyone in the room group
        # this sends it to the chat_message handler below
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

    # ---- group event handlers ----
    # these get called when something is sent to the channel group
    # the 'type' field in group_send determines which method is called
    # dots in type names are replaced by underscores

    async def chat_message(self, event):
        """broadcast a chat message to the websocket client"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'message': event['message'],
            'username': event['username'],
            'timestamp': event['timestamp'],
        }))

    async def user_join(self, event):
        """tell client someone joined"""
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username'],
        }))

    async def user_leave(self, event):
        """tell client someone left"""
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username'],
        }))

    # ---- database helpers ----
    # db operations have to be wrapped with database_sync_to_async
    # because the consumer runs in async context but django ORM is synchronous

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
