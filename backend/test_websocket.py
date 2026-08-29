import asyncio
import json
from uuid import uuid4

import websockets


async def main():
    document_id = uuid4()
    user_id = uuid4()

    url = (
        f"ws://127.0.0.1:8000/ws/documents/"
        f"{document_id}?user_id={user_id}"
    )

    print("Connecting to:")
    print(url)

    async with websockets.connect(url) as websocket:
        print("WebSocket connected!")

        message = await websocket.recv()

        print("Received:")
        print(json.dumps(json.loads(message), indent=2))


if __name__ == "__main__":
    asyncio.run(main())