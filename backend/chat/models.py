"""
two tables here:
1. Room - a chat room, like a group chat
2. Message - individual messages sent in a room

the relationship is: one Room has many Messages
"""

from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    # room name like "general" or "random"
    name = models.CharField(max_length=100, unique=True)

    # slug is the url-friendly version, "General Chat" -> "general-chat"
    slug = models.SlugField(unique=True)

    # when this room was made
    created_at = models.DateTimeField(auto_now_add=True)

    # many-to-many with users, tracks whos a member
    members = models.ManyToManyField(User, related_name='rooms', blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Message(models.Model):
    # which room this message belongs to
    # on_delete=CASCADE means if room gets deleted, messages go too
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')

    # who sent it
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')

    # actual message text
    content = models.TextField()

    # auto_now_add sets this automatically when message is created
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.sender.username}: {self.content[:50]}'

    class Meta:
        # newest messages last is the usual order for chat
        ordering = ['timestamp']
