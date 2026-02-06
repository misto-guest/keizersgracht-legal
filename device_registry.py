#!/usr/bin/env python3
"""
Device Registry - Manage Android devices with conflict detection and sync status
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class DeviceScript(Enum):
    """Types of scripts that can run on devices"""
    GPS = "gps"
    MUSIC = "music"
    NONE = "none"


class DeviceSyncStatus(Enum):
    """Device sync status"""
    ONLINE = "online"
    OFFLINE = "offline"
    UNKNOWN = "unknown"


class DeviceRegistry:
    """Manage device registry with conflict detection"""

    SYNC_TIMEOUT_SECONDS = 60  # Device considered offline after 60s

    def __init__(self, db_connection_func):
        """
        Initialize device registry

        Args:
            db_connection_func: Function that returns database connection
        """
        self.get_db = db_connection_func

    def register_device(
        self,
        user_id: str,
        name: str,
        adb_device_id: str,
        proxy_ip: Optional[str] = None,
        initial_script: str = DeviceScript.NONE.value
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Register a new device

        Args:
            user_id: User ID who owns the device
            name: Device display name
            adb_device_id: ADB device serial number
            proxy_ip: Optional proxy IP address
            initial_script: Initial script type

        Returns:
            Tuple of (success, message, device_id)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Check if ADB device ID already exists
        cursor.execute(
            'SELECT id FROM devices WHERE adb_device_id = ?',
            (adb_device_id,)
        )

        if cursor.fetchone():
            conn.close()
            return False, "ADB device ID already registered", None

        # Create device
        device_id = str(uuid.uuid4())

        cursor.execute('''
            INSERT INTO devices (
                id, user_id, name, adb_device_id, proxy_ip,
                current_script, sync_status, last_sync
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            device_id,
            user_id,
            name,
            adb_device_id,
            proxy_ip,
            initial_script,
            DeviceSyncStatus.UNKNOWN.value,
            None
        ))

        conn.commit()
        conn.close()

        logger.info(f"Device registered: {name} ({adb_device_id}) by user {user_id}")

        return True, "Device registered successfully", device_id

    def update_device(
        self,
        device_id: str,
        **kwargs
    ) -> Tuple[bool, str]:
        """
        Update device fields

        Args:
            device_id: Device ID
            **kwargs: Fields to update (name, proxy_ip, current_script, etc.)

        Returns:
            Tuple of (success, message)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Build update query dynamically
        valid_fields = [
            'name', 'proxy_ip', 'current_script', 'sync_status', 'last_sync'
        ]

        updates = []
        params = []

        for field, value in kwargs.items():
            if field in valid_fields:
                updates.append(f"{field} = ?")
                params.append(value)

        if not updates:
            conn.close()
            return False, "No valid fields to update"

        params.append(device_id)

        query = f"UPDATE devices SET {', '.join(updates)} WHERE id = ?"

        cursor.execute(query, params)
        conn.commit()
        conn.close()

        logger.debug(f"Device {device_id} updated: {kwargs}")

        return True, "Device updated"

    def get_device(self, device_id: str) -> Optional[Dict]:
        """
        Get device by ID

        Args:
            device_id: Device ID

        Returns:
            Device dict or None
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM devices WHERE id = ?', (device_id,))
        result = cursor.fetchone()
        conn.close()

        return dict(result) if result else None

    def get_device_by_adb_id(self, adb_device_id: str) -> Optional[Dict]:
        """
        Get device by ADB device ID

        Args:
            adb_device_id: ADB device serial number

        Returns:
            Device dict or None
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM devices WHERE adb_device_id = ?', (adb_device_id,))
        result = cursor.fetchone()
        conn.close()

        return dict(result) if result else None

    def list_user_devices(self, user_id: str) -> List[Dict]:
        """
        List all devices owned by user

        Args:
            user_id: User ID

        Returns:
            List of device dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM devices
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))

        devices = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return devices

    def list_all_devices(self) -> List[Dict]:
        """List all devices (admin only)"""
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM devices ORDER BY created_at DESC')
        devices = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return devices

    def delete_device(self, device_id: str, user_id: str) -> Tuple[bool, str]:
        """
        Delete device (only by owner)

        Args:
            device_id: Device ID
            user_id: User ID requesting deletion

        Returns:
            Tuple of (success, message)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Check ownership
        cursor.execute(
            'SELECT user_id FROM devices WHERE id = ?',
            (device_id,)
        )

        result = cursor.fetchone()

        if not result:
            conn.close()
            return False, "Device not found"

        if result['user_id'] != user_id:
            conn.close()
            return False, "You don't own this device"

        # Check if device is in use
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM campaigns
            WHERE device_id = ?
            AND status IN ('processing', 'cooldown')
        ''', (device_id,))

        if cursor.fetchone()['count'] > 0:
            conn.close()
            return False, "Device is currently in use"

        # Delete device
        cursor.execute('DELETE FROM devices WHERE id = ?', (device_id,))
        conn.commit()
        conn.close()

        logger.info(f"Device {device_id} deleted by user {user_id}")

        return True, "Device deleted"

    def can_start_gps_campaign(
        self,
        device_id: str
    ) -> Tuple[bool, str]:
        """
        Check if device can start GPS campaign

        Args:
            device_id: Device ID

        Returns:
            Tuple of (can_start, reason)
        """
        device = self.get_device(device_id)

        if not device:
            return False, "Device not found"

        # Check script conflict
        if device.get('current_script') == DeviceScript.MUSIC.value:
            return False, "Device is running Music Script (conflict)"

        # Check sync status
        if device.get('sync_status') != DeviceSyncStatus.ONLINE.value:
            return False, f"Device is {device.get('sync_status', 'unknown')}"

        return True, "Device available for GPS campaign"

    def set_device_script(
        self,
        device_id: str,
        script_type: str,
        user_id: str
    ) -> Tuple[bool, str]:
        """
        Set device's current script

        Args:
            device_id: Device ID
            script_type: Script type (gps/music/none)
            user_id: User ID (for ownership check)

        Returns:
            Tuple of (success, message)
        """
        device = self.get_device(device_id)

        if not device:
            return False, "Device not found"

        if device['user_id'] != user_id:
            return False, "You don't own this device"

        # Check if device is busy
        if script_type == DeviceScript.GPS.value:
            can_start, reason = self.can_start_gps_campaign(device_id)
            if not can_start:
                return False, reason

        return self.update_device(device_id, current_script=script_type)

    def update_sync_status(
        self,
        adb_device_id: str,
        status: str
    ) -> Tuple[bool, str]:
        """
        Update device sync status (called by worker/heartbeat)

        Args:
            adb_device_id: ADB device ID
            status: Sync status (online/offline)

        Returns:
            Tuple of (success, message)
        """
        device = self.get_device_by_adb_id(adb_device_id)

        if not device:
            return False, "Device not found in registry"

        now = datetime.now()

        return self.update_device(
            device['id'],
            sync_status=status,
            last_sync=now
        )

    def check_all_device_sync(self) -> int:
        """
        Check sync status of all devices and update if needed

        Returns:
            Number of devices marked offline
        """
        conn = self.get_db()
        cursor = conn.cursor()

        timeout_time = datetime.now() - timedelta(seconds=self.SYNC_TIMEOUT_SECONDS)

        # Mark devices as offline if last sync > 60s ago
        cursor.execute('''
            UPDATE devices
            SET sync_status = 'offline'
            WHERE sync_status = 'online'
            AND last_sync < ?
        ''', (timeout_time,))

        offline_count = cursor.rowcount
        conn.commit()
        conn.close()

        if offline_count > 0:
            logger.info(f"Marked {offline_count} devices as offline (timeout)")

        return offline_count

    def get_available_devices(self, user_id: str) -> List[Dict]:
        """
        Get devices available for GPS campaigns

        Args:
            user_id: User ID

        Returns:
            List of available device dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM devices
            WHERE user_id = ?
            AND (current_script = 'none' OR current_script = 'gps')
            AND sync_status = 'online'
            ORDER BY name ASC
        ''', (user_id,))

        devices = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return devices

    def get_device_stats(self) -> Dict:
        """
        Get device statistics

        Returns:
            Dict with stats
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Total devices
        cursor.execute('SELECT COUNT(*) as count FROM devices')
        total = cursor.fetchone()['count']

        # Online devices
        cursor.execute("SELECT COUNT(*) as count FROM devices WHERE sync_status = 'online'")
        online = cursor.fetchone()['count']

        # Offline devices
        cursor.execute("SELECT COUNT(*) as count FROM devices WHERE sync_status = 'offline'")
        offline = cursor.fetchone()['count']

        # Devices by script
        cursor.execute('''
            SELECT current_script, COUNT(*) as count
            FROM devices
            GROUP BY current_script
        ''')

        by_script = {row['current_script']: row['count'] for row in cursor.fetchall()}

        conn.close()

        return {
            'total': total,
            'online': online,
            'offline': offline,
            'by_script': by_script
        }


def init_device_registry_database(db_connection_func):
    """
    Initialize device registry database tables

    Args:
        db_connection_func: Function that returns database connection
    """
    conn = db_connection_func()
    cursor = conn.cursor()

    # Create enhanced devices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            adb_device_id TEXT UNIQUE NOT NULL,
            proxy_ip TEXT,
            current_script TEXT DEFAULT 'none'
                CHECK(current_script IN ('gps', 'music', 'none')),
            sync_status TEXT DEFAULT 'unknown'
                CHECK(sync_status IN ('online', 'offline', 'unknown')),
            last_sync TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_adb_id ON devices(adb_device_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_sync_status ON devices(sync_status)')

    conn.commit()
    conn.close()

    logger.info("Device registry database initialized")


if __name__ == "__main__":
    print("Device Registry Manager")
    print("=======================")
    print()
    print("Script types:")
    for script in DeviceScript:
        print(f"  - {script.value}")
    print()
    print("Sync status types:")
    for status in DeviceSyncStatus:
        print(f"  - {status.value}")
    print()
    print(f"Sync timeout: {DeviceRegistry.SYNC_TIMEOUT_SECONDS}s")
