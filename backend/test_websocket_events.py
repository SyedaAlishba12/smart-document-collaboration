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


async def receive_json(websocket):
    return json.loads(await websocket.recv())


async def test_event(
    sender,
    receiver,
    event,
    data,
):
    message = {
        "event": event,
        "data": data,
    }

    print(f"\nTesting {event}...")
    print("Sending:")
    print(json.dumps(message, indent=2))

    await sender.send(json.dumps(message))

    received = await receive_json(receiver)

    print("Received:")
    print(json.dumps(received, indent=2))

    assert received["event"] == event
    assert received["user_id"] == USER_A
    assert received["data"] == data

    print(f"SUCCESS: {event}")


async def main():
    print("Connecting Client A...")
    websocket_a = await websockets.connect(URL_A)

    print("Connecting Client B...")
    websocket_b = await websockets.connect(URL_B)

    try:
        # Consume join messages.
        await receive_json(websocket_a)
        await receive_json(websocket_b)

        await test_event(
            websocket_a,
            websocket_b,
            "document:cursor",
            {
                "position": 25,
                "selection_start": 20,
                "selection_end": 25,
            },
        )

        await test_event(
            websocket_a,
            websocket_b,
            "document:presence",
            {
                "status": "active",
            },
        )

        await test_event(
            websocket_a,
            websocket_b,
            "document:save",
            {
                "version_number": 2,
            },
        )

        print("\nALL WEBSOCKET EVENT TESTS PASSED.")

    finally:
        await websocket_a.close()
        await websocket_b.close()


if __name__ == "__main__":
    asyncio.run(main())