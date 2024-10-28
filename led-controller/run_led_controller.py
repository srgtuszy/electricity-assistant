import asyncio
from bleak import BleakClient, BleakScanner
from govee_packet import GoveePacket

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


async def main():
    # Find devices
    devices = await find_govee_devices()
    if not devices:
        print("No Govee devices found.")
        return

    green_color = (0, 255, 0)  # RGB values for green

    # Set color and brightness on each found device
    for device in devices:
        try:
            async with BleakClient(device.address) as client:
                print(f"Connected to {device.name}")

                # Send all ALL_GREEN_COMMANDS sequentially
                for i, command in enumerate(ALL_GREEN_COMMANDS, 1):
                    print(f"Sending ALL_GREEN command {i} of {len(ALL_GREEN_COMMANDS)}")
                    await client.write_gatt_char(WRITE_CHAR_UUID, bytes.fromhex(command), response=True)
                await asyncio.sleep(3)
                print("Setting color to purple")
                await set_light_color(client, green_color)

                # Send keep-alive packets every second
                print("Sending keep-alive packets...")
                while True:
                    await client.write_gatt_char(WRITE_CHAR_UUID, bytes.fromhex("AA01000000000000000000000000000000000015"), response=True)
                    await asyncio.sleep(1)

        except Exception as e:  
            print(f"Error controlling device {device.address}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
