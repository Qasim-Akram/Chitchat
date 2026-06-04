"""
all the database models for the chat app
we got 5 models total:
1. Room - a chat room
2. Message - messages sent in rooms
3. UserProfile - extra info about each user
4. Notification - alerts for users
5. MessageReaction - emoji reactions on messages
"""

from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    # one to one means each user gets exactly one profile
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    bio = models.CharField(max_length=200, blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')

    # track if user is currently online
    is_online = models.BooleanField(default=False)

    # last time they were seen active
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} profile'


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, related_name='rooms', blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.sender.username}: {self.content[:50]}'

    class Meta:
        ordering = ['timestamp']


class MessageReaction(models.Model):
    # which message this reaction is on
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')

    # who reacted
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')

    # the emoji -- just store the emoji character directly
    emoji = models.CharField(max_length=10)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} reacted {self.emoji} on message {self.message.id}'

    class Meta:
        # one user can only react with each emoji once per message
        unique_together = ['message', 'user', 'emoji']
        ordering = ['created_at']


class Notification(models.Model):
    NOTIF_TYPES = [
        ('message', 'New Message'),
        ('mention', 'Mentioned'),
        ('reaction', 'Reaction'),
    ]

    # who this notification is for
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    # who triggered it
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')

    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPES, default='message')

    # short preview text like "Ahmed: hey whats up"
    preview = models.CharField(max_length=200)

    # link to the room where this happened
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Notif for {self.recipient.username}: {self.preview[:40]}'

    class Meta:
        ordering = ['-created_at']  # newest first