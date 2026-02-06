#!/usr/bin/env python3
"""
Enhanced Campaign Status Workflow
Implements: Queued -> Processing -> Cooldown -> Completed -> Failed
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class CampaignStatus(Enum):
    """Campaign status states"""
    QUEUED = "queued"
    PROCESSING = "processing"
    COOLDOWN = "cooldown"
    COMPLETED = "completed"
    FAILED = "failed"


class StatusTransitionError(Exception):
    """Invalid status transition"""
    pass


class CampaignWorkflow:
    """Manage campaign status transitions"""

    # Valid transitions
    TRANSITIONS = {
        CampaignStatus.QUEUED: [CampaignStatus.PROCESSING],
        CampaignStatus.PROCESSING: [CampaignStatus.COOLDOWN, CampaignStatus.FAILED],
        CampaignStatus.COOLDOWN: [CampaignStatus.COMPLETED, CampaignStatus.FAILED],
        CampaignStatus.COMPLETED: [],  # Terminal state
        CampaignStatus.FAILED: []  # Terminal state
    }

    # Cooldown duration
    COOLDOWN_MINUTES = 30

    def __init__(self, db_connection_func):
        """
        Initialize workflow manager

        Args:
            db_connection_func: Function that returns database connection
        """
        self.get_db = db_connection_func

    def can_transition(
        self,
        current_status: str,
        new_status: str
    ) -> bool:
        """
        Check if status transition is valid

        Args:
            current_status: Current campaign status
            new_status: Desired new status

        Returns:
            True if transition is valid
        """
        try:
            current = CampaignStatus(current_status)
            new = CampaignStatus(new_status)

            return new in self.TRANSITIONS.get(current, [])
        except ValueError:
            logger.error(f"Invalid status: {current_status} or {new_status}")
            return False

    def transition_status(
        self,
        campaign_id: str,
        new_status: str,
        error_message: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Transition campaign to new status

        Args:
            campaign_id: Campaign ID
            new_status: New status value
            error_message: Error message if status is 'failed'

        Returns:
            Tuple of (success, message)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Get current status
        cursor.execute('SELECT status FROM campaigns WHERE id = ?', (campaign_id,))
        result = cursor.fetchone()

        if not result:
            conn.close()
            return False, "Campaign not found"

        current_status = result['status']

        # Validate transition
        if not self.can_transition(current_status, new_status):
            conn.close()
            return False, f"Invalid transition: {current_status} → {new_status}"

        # Update status
        now = datetime.now()

        if new_status == CampaignStatus.PROCESSING.value:
            update_query = '''
                UPDATE campaigns
                SET status = ?,
                    queued_at = COALESCE(queued_at, ?),
                    processing_at = ?,
                    current_step = 'Processing...'
                WHERE id = ?
            '''
            params = (new_status, now, now, campaign_id)

        elif new_status == CampaignStatus.COOLDOWN.value:
            # Set cooldown end time
            cooldown_until = now + timedelta(minutes=self.COOLDOWN_MINUTES)
            update_query = '''
                UPDATE campaigns
                SET status = ?,
                    cooldown_until = ?,
                    current_step = 'Cooldown period...'
                WHERE id = ?
            '''
            params = (new_status, cooldown_until, campaign_id)

        elif new_status == CampaignStatus.COMPLETED.value:
            update_query = '''
                UPDATE campaigns
                SET status = ?,
                    completed_at = ?,
                    current_step = 'Completed',
                    progress = 100
                WHERE id = ?
            '''
            params = (new_status, now, campaign_id)

        elif new_status == CampaignStatus.FAILED.value:
            update_query = '''
                UPDATE campaigns
                SET status = ?,
                    error_message = ?,
                    current_step = 'Failed'
                WHERE id = ?
            '''
            params = (new_status, error_message or "Unknown error", campaign_id)

        else:
            conn.close()
            return False, f"Unknown status: {new_status}"

        cursor.execute(update_query, params)
        conn.commit()
        conn.close()

        logger.info(f"Campaign {campaign_id}: {current_status} → {new_status}")

        return True, f"Status updated to {new_status}"

    def check_cooldown_complete(self, campaign_id: str) -> bool:
        """
        Check if cooldown period is complete

        Args:
            campaign_id: Campaign ID

        Returns:
            True if cooldown is complete
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT cooldown_until
            FROM campaigns
            WHERE id = ? AND status = 'cooldown'
        ''', (campaign_id,))

        result = cursor.fetchone()
        conn.close()

        if not result or not result['cooldown_until']:
            return False

        cooldown_until = datetime.fromisoformat(result['cooldown_until'])
        return datetime.now() >= cooldown_until

    def auto_advance_cooldown(self, campaign_id: str) -> Tuple[bool, str]:
        """
        Auto-advance campaign from cooldown to completed

        Args:
            campaign_id: Campaign ID

        Returns:
            Tuple of (success, message)
        """
        if not self.check_cooldown_complete(campaign_id):
            return False, "Cooldown period not complete"

        return self.transition_status(campaign_id, CampaignStatus.COMPLETED.value)

    def get_status_summary(self, user_id: Optional[str] = None) -> dict:
        """
        Get summary of campaigns by status

        Args:
            user_id: Optional user ID filter

        Returns:
            Dict with status counts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        if user_id:
            cursor.execute('''
                SELECT status, COUNT(*) as count
                FROM campaigns
                WHERE user_id = ?
                GROUP BY status
            ''', (user_id,))
        else:
            cursor.execute('''
                SELECT status, COUNT(*) as count
                FROM campaigns
                GROUP BY status
            ''')

        summary = {}
        for row in cursor.fetchall():
            summary[row['status']] = row['count']

        # Ensure all statuses are present
        for status in CampaignStatus:
            if status.value not in summary:
                summary[status.value] = 0

        conn.close()
        return summary

    def get_queued_campaigns(self, limit: int = 10) -> list:
        """
        Get queued campaigns ready to process

        Args:
            limit: Maximum number to return

        Returns:
            List of campaign dicts
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM campaigns
            WHERE status = 'queued'
            ORDER BY created_at ASC
            LIMIT ?
        ''', (limit,))

        campaigns = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return campaigns

    def get_processing_campaigns(self) -> list:
        """Get all currently processing campaigns"""
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM campaigns
            WHERE status = 'processing'
            ORDER BY processing_at ASC
        ''')

        campaigns = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return campaigns

    def get_cooldown_campaigns(self) -> list:
        """Get campaigns in cooldown period"""
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM campaigns
            WHERE status = 'cooldown'
            ORDER BY cooldown_until ASC
        ''')

        campaigns = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return campaigns

    def fail_stuck_processing(self, timeout_minutes: int = 60) -> int:
        """
        Fail campaigns that have been processing too long

        Args:
            timeout_minutes: Minutes before considering stuck

        Returns:
            Number of campaigns failed
        """
        conn = self.get_db()
        cursor = conn.cursor()

        timeout_time = datetime.now() - timedelta(minutes=timeout_minutes)

        cursor.execute('''
            UPDATE campaigns
            SET status = 'failed',
                error_message = 'Processing timeout',
                current_step = 'Failed (timeout)'
            WHERE status = 'processing'
            AND processing_at < ?
        ''', (timeout_time,))

        failed_count = cursor.rowcount
        conn.commit()
        conn.close()

        if failed_count > 0:
            logger.warning(f"Failed {failed_count} stuck processing campaigns")

        return failed_count


def init_workflow_database(db_connection_func):
    """
    Initialize database for enhanced workflow

    Args:
        db_connection_func: Function that returns database connection
    """
    conn = db_connection_func()
    cursor = conn.cursor()

    # Update campaigns table with new columns
    try:
        # Add status column with CHECK constraint
        cursor.execute('''
            ALTER TABLE campaigns
            ADD COLUMN status TEXT DEFAULT 'queued'
            CHECK(status IN ('queued', 'processing', 'cooldown', 'completed', 'failed'))
        ''')
        logger.info("Added status column to campaigns")
    except Exception as e:
        logger.debug(f"Status column might already exist: {e}")

    try:
        cursor.execute('''
            ALTER TABLE campaigns
            ADD COLUMN queued_at TIMESTAMP
        ''')
        logger.info("Added queued_at column")
    except Exception:
        pass

    try:
        cursor.execute('''
            ALTER TABLE campaigns
            ADD COLUMN processing_at TIMESTAMP
        ''')
        logger.info("Added processing_at column")
    except Exception:
        pass

    try:
        cursor.execute('''
            ALTER TABLE campaigns
            ADD COLUMN cooldown_until TIMESTAMP
        ''')
        logger.info("Added cooldown_until column")
    except Exception:
        pass

    # Update existing campaigns to 'queued' if status is 'pending'
    cursor.execute('''
        UPDATE campaigns
        SET status = 'queued'
        WHERE status = 'pending'
    ''')

    # Create indexes for performance
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_campaigns_status
        ON campaigns(status)
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_campaigns_queued_at
        ON campaigns(queued_at)
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_campaigns_processing_at
        ON campaigns(processing_at)
    ''')

    conn.commit()
    conn.close()

    logger.info("Workflow database initialized")


if __name__ == "__main__":
    # Test workflow
    class MockDB:
        def __init__(self):
            self.conn = None

        def __call__(self):
            return self.conn

    print("CampaignStatus Workflow Manager")
    print("================================")
    print()
    print("Valid transitions:")
    workflow = CampaignWorkflow(None)
    for status, transitions in CampaignWorkflow.TRANSITIONS.items():
        print(f"  {status.value} → {', '.join([t.value for t in transitions])}")
    print()
    print(f"Cooldown duration: {CampaignWorkflow.COOLDOWN_MINUTES} minutes")
