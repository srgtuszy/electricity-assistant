class GoveePacket:
    @staticmethod
    def calculate_xor_checksum(command):
        xor_checksum = 0
        for byte in command:
            xor_checksum ^= byte
        return xor_checksum

    @staticmethod
    def create_color_packet(rgb_color):
        red, green, blue = rgb_color

        command = bytearray([
            0x33,        # Command prefix for setting color
            0x05,        # Command to set RGB color
            0x15,        # Mode (0x15 for color mode)
            0x01,        # Unused byte
            red,         # Red value (0-255)
            green,       # Green value (0-255)
            blue,        # Blue value (0-255)
            0x00,        # Unused byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0xFF,        # Fixed byte
            0x74         # Fixed byte
        ])

        # Pad the command to 20 bytes with zeros
        while len(command) < 20:
            command.append(0x00)

        # Calculate XOR checksum
        xor_checksum = GoveePacket.calculate_xor_checksum(command)
        command[19] = xor_checksum

        return command

    @staticmethod
    def create_brightness_packet(brightness):
        if not 0 <= brightness <= 100:
            raise ValueError("Brightness must be between 0 and 100.")

        command = bytearray([
            0x33,                # Command prefix for setting brightness
            0x04,                # Command to set brightness
            brightness,          # Brightness value (0-100)
            0x00,                # Unused byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00,                # Fixed byte
            0x00                 # Fixed byte
        ])

        # Calculate XOR checksum
        xor_checksum = 0x33 ^ 0x04 ^ brightness
        command.append(xor_checksum)

        return command
    
    @staticmethod
    def create_keep_alive_packet():
        command = bytearray([
            0xAA,        # Command prefix for keep alive
            0x01,        # Command to keep alive
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0x00,        # Fixed byte
            0xAB         # Fixed byte
        ])

        return command
