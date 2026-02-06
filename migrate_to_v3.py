#!/usr/bin/env python3
"""
Database Migration Script - v2.2 to v3.0 (Fixed)
"""

import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = '/Users/northsea/clawd-dmitry/campaigns.db'


def migrate_to_v3():
    """Migrate database from v2.2 to v3.0"""

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    logger.info("Starting migration to v3.0...")

    try:
        # Drop existing tables if they exist (clean slate)
        logger.info("Dropping old tables if exist...")
        cursor.execute('DROP TABLE IF EXISTS audit_logs')
        cursor.execute('DROP TABLE IF EXISTS execution_logs')
        cursor.execute('DROP TABLE IF EXISTS devices')
        cursor.execute('DROP TABLE IF EXISTS user_settings')
        cursor.execute('DROP TABLE IF EXISTS users')

        # Create users table
        logger.info("Creating users table...")
        cursor.execute('''
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')

        # Create user_settings table
        logger.info("Creating user_settings table...")
        cursor.execute('''
            CREATE TABLE user_settings (
                user_id TEXT PRIMARY KEY,
                default_account_mode TEXT DEFAULT 'normal',
                default_duration INTEGER DEFAULT 4,
                preferred_device_id TEXT,
                notification_enabled BOOLEAN DEFAULT TRUE,
                timezone TEXT DEFAULT 'UTC',
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        # Create devices table
        logger.info("Creating devices table...")
        cursor.execute('''
            CREATE TABLE devices (
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

        # Create execution_logs table
        logger.info("Creating execution_logs table...")
        cursor.execute('''
            CREATE TABLE execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id TEXT NOT NULL,
                level TEXT NOT NULL CHECK(level IN ('debug', 'info', 'warning', 'error')),
                message TEXT NOT NULL,
                device_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create audit_logs table
        logger.info("Creating audit_logs table...")
        cursor.execute('''
            CREATE TABLE audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Add columns to campaigns table
        logger.info("Adding columns to campaigns table...")

        # Check and add user_id column
        cursor.execute("PRAGMA table_info(campaigns)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'user_id' not in columns:
            logger.info("Adding user_id column...")
            cursor.execute('ALTER TABLE campaigns ADD COLUMN user_id TEXT')
            # Set default user for existing campaigns
            cursor.execute('UPDATE campaigns SET user_id = "default-user" WHERE user_id IS NULL')

        if 'queued_at' not in columns:
            logger.info("Adding queued_at column...")
            cursor.execute('ALTER TABLE campaigns ADD COLUMN queued_at TIMESTAMP')

        if 'processing_at' not in columns:
            logger.info("Adding processing_at column...")
            cursor.execute('ALTER TABLE campaigns ADD COLUMN processing_at TIMESTAMP')

        if 'cooldown_until' not in columns:
            logger.info("Adding cooldown_until column...")
            cursor.execute('ALTER TABLE campaigns ADD COLUMN cooldown_until TIMESTAMP')

        # Update status values
        logger.info("Updating status values...")
        cursor.execute("UPDATE campaigns SET status = 'queued' WHERE status = 'pending'")
        cursor.execute("UPDATE campaigns SET status = 'processing' WHERE status = 'running'")

        # Create indexes
        logger.info("Creating indexes...")
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_adb_id ON devices(adb_device_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_sync_status ON devices(sync_status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_campaign_timestamp ON execution_logs(campaign_id, timestamp DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_device_timestamp ON execution_logs(device_id, timestamp DESC)')

        conn.commit()
        logger.info("✅ Migration to v3.0 completed successfully!")

    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    migrate_to_v3()
