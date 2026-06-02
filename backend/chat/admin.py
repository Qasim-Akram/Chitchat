from django.contrib import admin
from .models import Room, Message

# register so we can see/manage them in django admin panel
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}  # auto fills slug as you type name

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'room', 'content', 'timestamp']
    list_filter = ['room']
