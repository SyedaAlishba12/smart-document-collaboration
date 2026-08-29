import asyncio
import json
import websockets


DOCUMENT_ID = "d9a37d82-6c7c-4795-b349-65e80c2ad5c5"

USER_A = "d541448f-8008-4814-b8a6-d6abf3886132"
USER_B = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

URL_A = (
    f"ws://127.0.0.1:8000/ws/documents/"
    f"{DOCUMENT_ID}?user_id={USER_A}"
)

URL_B = (
    f"ws://127.0.0.1:8000/ws/documents/"
    f"{DOCUMENT_ID}?user_id={USER_B}"
)


async def main():
    print("Connecting Client A...")
    websocket_a = await websockets.connect(URL_A)

    print("Connecting Client B...")
    websocket_b = await websockets.connect(URL_B)

    try:
        # Receive join messages
        message_a = await websocket_a.recv()
        print("\nClient A received:")
        print(message_a)

        message_b = await websocket_b.recv()
        print("\nClient B received:")
        print(message_b)

        # Client A sends a document update
        update = {
            "event": "document:update",
            "data": {
                "content": "Hello from Client A"
            }
        }

        print("\nClient A sending:")
        print(json.dumps(update, indent=2))

        await websocket_a.send(json.dumps(update))

        # Client B should receive the update
        received_by_b = await websocket_b.recv()

        print("\nClient B received:")
        print(received_by_b)

        message = json.loads(received_by_b)

        assert message["event"] == "document:update"
        assert message["user_id"] == USER_A
        assert message["data"]["content"] == "Hello from Client A"

        print("\nSUCCESS: Client B received Client A's update.")

    finally:
        await websocket_a.close()
        await websocket_b.close()


if __name__ == "__main__":
    asyncio.run(main())