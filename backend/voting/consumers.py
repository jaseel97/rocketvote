import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PollConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.poll_id = None

    async def connect(self):
        self.poll_id = self.scope['url_route']['kwargs']['poll_id']
        self.room_group_name = f'poll_{self.poll_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def poll_revealed(self, event):
        await self.send(text_data=json.dumps({
            'poll_id': self.poll_id,
            'results_revealed': True
        }))

