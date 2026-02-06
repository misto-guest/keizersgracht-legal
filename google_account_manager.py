#!/usr/bin/env python3
"""
Google Account Manager - Track trips per account with daily limits
"""

import logging
from datetime import datetime, timedelta, date
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class GoogleAccountManager:
    """Manage Google account trip tracking"""

    # Configuration
    MAX_TRIPS_PER_DAY = 3  # Maximum trips per account per day
    MIN_IDLE_HOURS = 4  # Minimum idle time between trips
    COOLDOWN_MINUTES = 30  # Post-trip cooldown

    def __init__(self, db_connection_func):
        """
        Initialize Google account manager

        Args:
            db_connection_func: Function that returns database connection
        """
        self.get_db = db_connection_func

    def register_google_account(
        self,
        user_id: str,
        account_email: str,
        friendly_name: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Register a Google account for tracking

        Args:
            user_id: User ID who owns this account
            account_email: Google account email
            friendly_name: Optional display name

        Returns:
            Tuple of (success, message, account_id)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Check if account already exists
        cursor.execute('SELECT id FROM google_accounts WHERE account_email = ?', (account_email,))

        if cursor.fetchone():
            conn.close()
            return False, "Account already registered", None

        # Create account
        import uuid
        account_id = str(uuid.uuid4())

        cursor.execute('''
            INSERT INTO google_accounts (
                id, user_id, account_email, friendly_name,
                trips_today, last_reset_date
            )
            VALUES (?, ?, ?, ?, 0, DATE('now'))
        ''', (account_id, user_id, account_email, friendly_name))

        conn.commit()
        conn.close()

        logger.info(f"Google account registered: {account_email}")

        return True, "Account registered successfully", account_id

    def check_daily_limits(
        self,
        account_email: str
    ) -> Tuple[bool, str, Optional[datetime]]:
        """
        Check if account can start a new trip

        Args:
            account_email: Google account email

        Returns:
            Tuple of (can_start, reason, available_at)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Reset daily counts if needed
        self.reset_daily_counts_if_needed(account_email)

        # Get account stats
        cursor.execute('''
            SELECT trips_today, last_trip_time
            FROM google_accounts
            WHERE account_email = ?
        ''', (account_email,))

        account = cursor.fetchone()
        conn.close()

        if not account:
            return False, "Account not found in registry", None

        # Rule 1: Max trips per day
        if account['trips_today'] >= self.MAX_TRIPS_PER_DAY:
            # Available at midnight
            midnight = (datetime.now() + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            return False, f"Daily limit reached ({account['trips_today']}/{self.MAX_TRIPS_PER_DAY})", midnight

        # Rule 2: Minimum idle time between trips
        if account['last_trip_time']:
            last_trip = datetime.fromisoformat(account['last_trip_time'])
            time_since_last = datetime.now() - last_trip
            min_idle = timedelta(hours=self.MIN_IDLE_HOURS)

            if time_since_last < min_idle:
                available_at = last_trip + min_idle
                remaining = min_idle - time_since_last
                hours, remainder = divmod(remaining.seconds, 3600)
                minutes, _ = divmod(remainder, 60)
                return False, f"Need {hours}h {minutes}m more idle time", available_at

        return True, "Account available", None

    def increment_trip_count(self, account_email: str) -> bool:
        """
        Increment trip count for account

        Args:
            account_email: Google account email

        Returns:
            True if successful
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Reset daily counts if needed
        self.reset_daily_counts_if_needed(account_email)

        # Increment trip count and update last trip time
        cursor.execute('''
            UPDATE google_accounts
            SET trips_today = trips_today + 1,
                last_trip_time = CURRENT_TIMESTAMP
            WHERE account_email = ?
        ''', (account_email,))

        conn.commit()
        conn.close()

        logger.info(f"Incremented trip count for {account_email}")

        return True

    def reset_daily_counts_if_needed(self, account_email: str) -> bool:
        """
        Reset daily trip counts if date has changed

        Args:
            account_email: Google account email

        Returns:
            True if reset was performed
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Get last reset date
        cursor.execute('''
            SELECT last_reset_date
            FROM google_accounts
            WHERE account_email = ?
        ''', (account_email,))

        result = cursor.fetchone()

        if not result:
            conn.close()
            return False

        last_reset = result['last_reset_date']
        today = date.today().isoformat()

        # Check if reset is needed
        if last_reset < today:
            cursor.execute('''
                UPDATE google_accounts
                SET trips_today = 0,
                    last_reset_date = DATE('now')
                WHERE account_email = ?
            ''', (account_email,))

            conn.commit()
            logger.info(f"Reset daily trip count for {account_email}")

            conn.close()
            return True

        conn.close()
        return False

    def get_account_stats(self, account_email: str) -> Optional[Dict]:
        """
        Get account statistics

        Args:
            account_email: Google account email

        Returns:
            Dict with stats or None
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM google_accounts
            WHERE account_email = ?
        ''', (account_email,))

        account = cursor.fetchone()
        conn.close()

        if account:
            return dict(account)

        return None

    def list_user_accounts(self, user_id: str) -> list:
        """
        List all Google accounts for a user

        Args:
            user_id: User ID

        Returns:
            List of account dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM google_accounts
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))

        accounts = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return accounts

    def get_available_accounts(self, user_id: str) -> list:
        """
        Get accounts that can start a new trip now

        Args:
            user_id: User ID

        Returns:
            List of available account dicts
        """
        accounts = self.list_user_accounts(user_id)
        available = []

        for account in accounts:
            can_start, reason, _ = self.check_daily_limits(account['account_email'])

            if can_start:
                available.append(account)

        return available

    def get_time_until_available(self, account_email: str) -> Optional[Dict]:
        """
        Get time until account is available for next trip

        Args:
            account_email: Google account email

        Returns:
            Dict with 'available_at' datetime and 'reason' or None
        """
        can_start, reason, available_at = self.check_daily_limits(account_email)

        if can_start:
            return None

        return {
            'available_at': available_at.isoformat() if available_at else None,
            'reason': reason,
            'waiting': True
        }


def init_google_accounts_database(db_connection_func):
    """
    Initialize Google accounts database table

    Args:
        db_connection_func: Function that returns database connection
    """
    conn = db_connection_func()
    cursor = conn.cursor()

    # Create google_accounts table
    cursor.execute(
        'CREATE TABLE IF NOT EXISTS google_accounts ('
        'id TEXT PRIMARY KEY,'
        'user_id TEXT NOT NULL,'
        'account_email TEXT UNIQUE NOT NULL,'
        'friendly_name TEXT,'
        'trips_today INTEGER DEFAULT 0,'
        'last_trip_time TIMESTAMP,'
        'last_reset_date TEXT,'
        'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ')'
    )

    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_google_accounts_user ON google_accounts(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_google_accounts_email ON google_accounts(account_email)')

    conn.commit()
    conn.close()

    logger.info("Google accounts database initialized")


if __name__ == "__main__":
    print("Google Account Manager")
    print("======================")
    print()
    print(f"Max trips per day: {GoogleAccountManager.MAX_TRIPS_PER_DAY}")
    print(f"Min idle time: {GoogleAccountManager.MIN_IDLE_HOURS} hours")
    print(f"Cooldown: {GoogleAccountManager.COOLDOWN_MINUTES} minutes")
