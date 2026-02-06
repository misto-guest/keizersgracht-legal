#!/usr/bin/env python3
"""
Live Logging System - Real-time log streaming and storage
"""

import logging
import socketio
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class LogLevel(Enum):
    """Log levels"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class LiveLogger:
    """Live logging manager with Socket.IO streaming"""

    def __init__(self, db_connection_func, socketio_instance):
        """
        Initialize live logger

        Args:
            db_connection_func: Function that returns database connection
            socketio_instance: Flask-SocketIO instance
        """
        self.get_db = db_connection_func
        self.socketio = socketio_instance

    def add_log(
        self,
        campaign_id: str,
        level: str,
        message: str,
        device_id: Optional[str] = None
    ) -> bool:
        """
        Add log entry and emit to subscribers

        Args:
            campaign_id: Campaign ID
            level: Log level (debug/info/warning/error)
            message: Log message
            device_id: Optional device ID

        Returns:
            True if successful
        """
        try:
            # Store in database
            conn = self.get_db()
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO execution_logs (
                    campaign_id, level, message, device_id, timestamp
                )
                VALUES (?, ?, ?, ?, ?)
            ''', (
                campaign_id,
                level,
                message,
                device_id,
                datetime.now()
            ))

            conn.commit()
            conn.close()

            # Emit to Socket.IO subscribers
            self.emit_log(campaign_id, level, message, device_id)

            return True

        except Exception as e:
            logger.error(f"Failed to add log: {str(e)}")
            return False

    def emit_log(
        self,
        campaign_id: str,
        level: str,
        message: str,
        device_id: Optional[str] = None
    ):
        """
        Emit log entry to Socket.IO subscribers

        Args:
            campaign_id: Campaign ID
            level: Log level
            message: Log message
            device_id: Optional device ID
        """
        log_entry = {
            'campaign_id': campaign_id,
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'message': message,
            'device_id': device_id
        }

        # Emit to campaign's log room
        self.socketio.emit(
            'log_entry',
            log_entry,
            room=f'logs_{campaign_id}'
        )

        logger.debug(f"Emitted log to campaign {campaign_id}: {message}")

    def get_logs(
        self,
        campaign_id: str,
        limit: int = 100,
        level: Optional[str] = None
    ) -> List[Dict]:
        """
        Get logs for a campaign

        Args:
            campaign_id: Campaign ID
            limit: Maximum number of logs
            level: Optional level filter

        Returns:
            List of log dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        if level:
            cursor.execute('''
                SELECT * FROM execution_logs
                WHERE campaign_id = ? AND level = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (campaign_id, level, limit))
        else:
            cursor.execute('''
                SELECT * FROM execution_logs
                WHERE campaign_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (campaign_id, limit))

        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return logs

    def get_logs_by_device(
        self,
        device_id: str,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get logs for a device

        Args:
            device_id: Device ID
            limit: Maximum number of logs

        Returns:
            List of log dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM execution_logs
            WHERE device_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (device_id, limit))

        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return logs

    def search_logs(
        self,
        query: str,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Search logs by message content

        Args:
            query: Search query
            user_id: Optional user ID filter
            limit: Maximum results

        Returns:
            List of log dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        search_pattern = f'%{query}%'

        if user_id:
            cursor.execute('''
                SELECT el.* FROM execution_logs el
                JOIN campaigns c ON el.campaign_id = c.id
                WHERE c.user_id = ?
                AND el.message LIKE ?
                ORDER BY el.timestamp DESC
                LIMIT ?
            ''', (user_id, search_pattern, limit))
        else:
            cursor.execute('''
                SELECT * FROM execution_logs
                WHERE message LIKE ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (search_pattern, limit))

        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return logs

    def get_recent_logs(
        self,
        hours: int = 24,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get recent logs across all campaigns

        Args:
            hours: Hours to look back
            limit: Maximum results

        Returns:
            List of log dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute(f'''
            SELECT * FROM execution_logs
            WHERE timestamp >= datetime('now', '-{hours} hours')
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))

        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return logs

    def get_error_logs(
        self,
        campaign_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Get error logs

        Args:
            campaign_id: Optional campaign ID filter
            limit: Maximum results

        Returns:
            List of log dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        if campaign_id:
            cursor.execute('''
                SELECT * FROM execution_logs
                WHERE campaign_id = ? AND level = 'error'
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (campaign_id, limit))
        else:
            cursor.execute('''
                SELECT * FROM execution_logs
                WHERE level = 'error'
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (limit,))

        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return logs

    def get_log_stats(self, campaign_id: str) -> Dict:
        """
        Get log statistics for a campaign

        Args:
            campaign_id: Campaign ID

        Returns:
            Dict with stats
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Total logs
        cursor.execute('''
            SELECT COUNT(*) as count FROM execution_logs
            WHERE campaign_id = ?
        ''', (campaign_id,))
        total = cursor.fetchone()['count']

        # Logs by level
        cursor.execute('''
            SELECT level, COUNT(*) as count
            FROM execution_logs
            WHERE campaign_id = ?
            GROUP BY level
        ''', (campaign_id,))

        by_level = {row['level']: row['count'] for row in cursor.fetchall()}

        # Last log timestamp
        cursor.execute('''
            SELECT MAX(timestamp) as last_log
            FROM execution_logs
            WHERE campaign_id = ?
        ''', (campaign_id,))

        last_log = cursor.fetchone()['last_log']

        conn.close()

        return {
            'total': total,
            'by_level': by_level,
            'last_log': last_log
        }

    def clear_old_logs(self, days: int = 30) -> int:
        """
        Clear logs older than specified days

        Args:
            days: Days to keep

        Returns:
            Number of logs deleted
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute(f'''
            DELETE FROM execution_logs
            WHERE timestamp < datetime('now', '-{days} days')
        ''')

        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()

        logger.info(f"Cleared {deleted_count} old logs (>{days} days)")

        return deleted_count

    def export_logs(
        self,
        campaign_id: str,
        format: str = 'json'
    ) -> Optional[str]:
        """
        Export logs for a campaign

        Args:
            campaign_id: Campaign ID
            format: Export format (json/csv)

        Returns:
            Export data or None
        """
        logs = self.get_logs(campaign_id, limit=10000)

        if format == 'json':
            import json
            return json.dumps(logs, indent=2)
        elif format == 'csv':
            import csv
            import io

            output = io.StringIO()
            writer = csv.writer(output)

            # Header
            writer.writerow(['Timestamp', 'Level', 'Message', 'Device ID'])

            # Rows
            for log in logs:
                writer.writerow([
                    log['timestamp'],
                    log['level'],
                    log['message'],
                    log.get('device_id', '')
                ])

            return output.getvalue()

        return None


def init_logging_database(db_connection_func):
    """
    Initialize logging database tables

    Args:
        db_connection_func: Function that returns database connection
    """
    conn = db_connection_func()
    cursor = conn.cursor()

    # Create execution_logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS execution_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            level TEXT NOT NULL CHECK(level IN ('debug', 'info', 'warning', 'error')),
            message TEXT NOT NULL,
            device_id TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    # Create indexes for performance
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_logs_campaign_timestamp
        ON execution_logs(campaign_id, timestamp DESC)
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_logs_device_timestamp
        ON execution_logs(device_id, timestamp DESC)
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_logs_level
        ON execution_logs(level)
    ''')

    conn.commit()
    conn.close()

    logger.info("Logging database initialized")


# Socket.IO event handlers
def register_log_events(socketio_instance, logger_instance: LiveLogger):
    """
    Register Socket.IO event handlers for logging

    Args:
        socketio_instance: Flask-SocketIO instance
        logger_instance: LiveLogger instance
    """

    @socketio_instance.on('subscribe_logs')
    def handle_subscribe_logs(data):
        """Subscribe to campaign logs"""
        campaign_id = data.get('campaign_id')
        if campaign_id:
            from flask import request
            from flask_socketio import join_room

            join_room(f'logs_{campaign_id}')
            logger.info(f"Client subscribed to logs for campaign {campaign_id}")

            # Send recent logs
            logs = logger_instance.get_logs(campaign_id, limit=50)
            socketio_instance.emit(
                'log_history',
                {'campaign_id': campaign_id, 'logs': logs},
                room=request.sid
            )

    @socketio_instance.on('unsubscribe_logs')
    def handle_unsubscribe_logs(data):
        """Unsubscribe from campaign logs"""
        campaign_id = data.get('campaign_id')
        if campaign_id:
            from flask_socketio import leave_room

            leave_room(f'logs_{campaign_id}')
            logger.info(f"Client unsubscribed from logs for campaign {campaign_id}")


if __name__ == "__main__":
    print("Live Logging System")
    print("===================")
    print()
    print("Log levels:")
    for level in LogLevel:
        print(f"  - {level.value}")
