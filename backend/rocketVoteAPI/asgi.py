"""
ASGI config for rocketVoteAPI project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import path

from voting.consumers import PollConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rocketVoteAPI.settings')

#TODO: Add host origin validator
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter([
            path("ws/<str:poll_id>/", PollConsumer.as_asgi()),
    ]),
})
