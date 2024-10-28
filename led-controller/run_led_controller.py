import asyncio
from bleak import BleakClient, BleakScanner
from govee_packet import GoveePacket
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

SERVICE_UUID = "00010203-0405-0607-0809-0a0b0c0d1910"
WRITE_CHAR_UUID = "00010203-0405-0607-0809-0a0b0c0d2b11"

ALL_GREEN_COMMAND = "33050A200300000000000000000000000000001F"
CELEBRATION_COMMAND = "3304640000000000000000000000000000000053"

ALL_GREEN_COMMANDS = [
    "33050A200300000000000000000000000000001F",
    "A300010A020529000000080001FF0003FF64648C",
    "A30102003206FF0000FF7F00FFFF0000FFFF00EB",
    "A30200FF00FF001200FC000000021A1100000147",
    "A3030201FF000000000000FF32018B00FF0000E4",
    "330504A50800000000000000000000000000009F"
]

async def find_govee_devices():
    print("Scanning for Govee devices...")
    devices = await BleakScanner.discover()
    govee_devices = []
    for d in devices:
        if d.name and "GBK_" in d.name:
            print(f"Found Govee device: {d.name} ({d.address})")
            govee_devices.append(d)
    return govee_devices

# Function to set light color
async def set_light_color(client, rgb_color):
    command = GoveePacket.create_color_packet(rgb_color)
    print(f"Sending color command: {command.hex()}")
    await client.write_gatt_char(WRITE_CHAR_UUID, command, response=True)
    print("Color set successfully.")

# Function to set brightness
async def set_brightness(client, brightness):
    try:
        command = GoveePacket.create_brightness_packet(brightness)
        print(f"Sending brightness command: {command.hex()}")
        await client.write_gatt_char(WRITE_CHAR_UUID, command, response=True)
        print("Brightness set successfully.")
    except ValueError as e:
        print(f"Error setting brightness: {e}")

async def execute_commands_and_set_color(client):
    for i, command in enumerate(ALL_GREEN_COMMANDS, 1):
        print(f"Sending ALL_GREEN command {i} of {len(ALL_GREEN_COMMANDS)}")
        await client.write_gatt_char(WRITE_CHAR_UUID, bytes.fromhex(command), response=True)
    await asyncio.sleep(3)
    print("Setting color to green")
    await set_light_color(client, (0, 255, 0))  # RGB values for green

async def main():
    # Get the path to the service account JSON from the environment variable
    service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH')
    if not service_account_path or not os.path.isfile(service_account_path):
        print("Firebase service account JSON file not found or environment variable not set.")
        return

    # Initialize Firebase app and Firestore client
    while True:
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            break
        except Exception as e:
            print(f"Error initializing Firebase: {e}. Retrying in 3 seconds...")
            await asyncio.sleep(3)

    # Find devices
    while True:
        devices = await find_govee_devices()
        if devices:
            break
        print("No Govee devices found. Retrying in 3 seconds...")
        await asyncio.sleep(3)

    for device in devices:
        while True:
            try:
                async with BleakClient(device.address) as client:
                    print(f"Connected to {device.name}")

                    # Listen for changes in the "tips" collection
                    tips_ref = db.collection('tips')
                    query = tips_ref.where('done', '==', True)

                    # Get the current event loop
                    loop = asyncio.get_running_loop()

                    # Callback function to handle document changes
                    def on_snapshot(doc_snapshot, changes, read_time):
                        for doc in doc_snapshot:
                            print(f'Tip document {doc.id} has "done" set to True')
                            asyncio.run_coroutine_threadsafe(execute_commands_and_set_color(client), loop)

                    # Start listening for changes
                    query_watch = query.on_snapshot(on_snapshot)

                    # Send keep-alive packets every second
                    print("Sending keep-alive packets...")
                    while True:
                        await client.write_gatt_char(WRITE_CHAR_UUID, bytes.fromhex("AA01000000000000000000000000000000000015"), response=True)
                        await asyncio.sleep(1)

            except Exception as e:
                print(f"Error controlling device {device.address}: {e}. Retrying in 3 seconds...")
                await asyncio.sleep(3)
            else:
                break

if __name__ == "__main__":
    asyncio.run(main())
