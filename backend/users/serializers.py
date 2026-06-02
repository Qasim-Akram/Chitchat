"""
serializers for user stuff
basically these convert our model data to json and back
think of it like a translator between python objects and json
"""

from rest_framework import serializers
from django.contrib.auth.models import User


class RegisterSerializer(serializers.ModelSerializer):
    # write_only means this wont show up in responses, just for input
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        # check both passwords match before we do anything
        if data['password'] != data['password2']:
            raise serializers.ValidationError("passwords dont match bro")
        return data

    def validate_username(self, value):
        # make sure username isnt already taken
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("this username is already taken")
        return value

    def create(self, validated_data):
        # pop out password2 since we dont need it anymore
        validated_data.pop('password2')
        # create_user handles password hashing automatically, dont use User.objects.create()
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    # this is just for returning user info, read only basically
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']
        read_only_fields = ['id', 'date_joined']
