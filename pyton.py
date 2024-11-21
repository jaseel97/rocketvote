import asyncio
import websockets

async def connect_to_poll_websocket():
    # Define WebSocket URL with hardcoded poll_id
    poll_id = 'BkWJz0yJ'  # Replace with the actual poll ID
    websocket_url = f"ws://localhost/ws/{poll_id}/"  # Replace with actual WebSocket URL

    try:
        # Connect to WebSocket server
        async with websockets.connect(websocket_url) as websocket:
            print(f"Connected to WebSocket for poll ID: {poll_id}")

            # Listen for messages
            async for message in websocket:
                print("Received message:", message)

    except Exception as e:
        print("An error occurred:", e)

# Run the WebSocket client
asyncio.run(connect_to_poll_websocket())