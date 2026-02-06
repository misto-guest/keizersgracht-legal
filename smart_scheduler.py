#!/usr/bin/env python3
"""
Smart Scheduler - Intelligent campaign queue management
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class SmartScheduler:
    """Intelligent campaign scheduling system"""

    def __init__(self, db_connection_func, google_account_manager, device_registry):
        """
        Initialize smart scheduler

        Args:
            db_connection_func: Database connection function
            google_account_manager: GoogleAccountManager instance
            device_registry: DeviceRegistry instance
        """
        self.get_db = db_connection_func
        self.google_account_manager = google_account_manager
        self.device_registry = device_registry

    def calculate_start_time(
        self,
        campaign_data: Dict
    ) -> Dict:
        """
        Calculate when a campaign can start based on constraints

        Args:
            campaign_data: Campaign configuration

        Returns:
            Dict with scheduling information
        """
        constraints = []
        earliest_start = datetime.now()

        # Constraint 1: Google account availability
        google_account = campaign_data.get('google_account')
        if google_account:
            can_start, reason, available_at = self.google_account_manager.check_daily_limits(
                google_account
            )

            if not can_start and available_at:
                constraints.append({
                    'type': 'google_account_limit',
                    'reason': reason,
                    'available_at': available_at
                })
                earliest_start = max(earliest_start, available_at)

        # Constraint 2: Device availability
        device_id = campaign_data.get('device_id')
        if device_id:
            device = self.device_registry.get_device(device_id)

            if device:
                # Check if device is running another campaign
                conn = self.get_db()
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT c.id, c.status, c.cooldown_until
                    FROM campaigns c
                    WHERE c.device_id = ?
                    AND c.status IN ('processing', 'cooldown')
                    ORDER BY c.created_at DESC
                    LIMIT 1
                ''', (device_id,))

                active_campaign = cursor.fetchone()
                conn.close()

                if active_campaign:
                    # Device is busy
                    if active_campaign['status'] == 'processing':
                        # Estimate completion based on duration
                        cursor = conn.cursor()
                        cursor.execute('''
                            SELECT duration_hours FROM campaigns WHERE id = ?
                        ''', (active_campaign['id'],))
                        duration = cursor.fetchone()
                        conn.close()

                        # Estimate completion (add buffer)
                        if duration:
                            hours = duration['duration_hours']
                            complete_at = datetime.now() + timedelta(hours=hours + 0.5)

                            constraints.append({
                                'type': 'device_busy',
                                'reason': f'Device busy until {complete_at.strftime("%H:%M")}',
                                'available_at': complete_at
                            })
                            earliest_start = max(earliest_start, complete_at)

                    elif active_campaign['cooldown_until']:
                        # Device in cooldown
                        cooldown_end = datetime.fromisoformat(active_campaign['cooldown_until'])

                        constraints.append({
                            'type': 'device_cooldown',
                            'reason': f'Device cooldown until {cooldown_end.strftime("%H:%M")}',
                            'available_at': cooldown_end
                        })
                        earliest_start = max(earliest_start, cooldown_end)

        # Determine if can start now
        can_start_now = len(constraints) == 0

        return {
            'can_start_now': can_start_now,
            'earliest_start': earliest_start.isoformat() if not can_start_now else None,
            'constraints': constraints,
            'wait_time_minutes': int((earliest_start - datetime.now()).total_seconds() / 60) if not can_start_now else 0
        }

    def get_queue_position(self, campaign_id: str) -> int:
        """
        Get position in queue for a campaign

        Args:
            campaign_id: Campaign ID

        Returns:
            Position (1 = next to run)
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT COUNT(*) as position
            FROM campaigns
            WHERE status = 'queued'
            AND created_at < (SELECT created_at FROM campaigns WHERE id = ?)
        ''', (campaign_id,))

        position = cursor.fetchone()['position'] + 1
        conn.close()

        return position

    def get_next_campaign(self) -> Optional[Dict]:
        """
        Get the next campaign that's ready to start

        Returns:
            Campaign dict or None
        """
        conn = self.get_db()
        cursor = conn.cursor()

        # Get oldest queued campaign
        cursor.execute('''
            SELECT * FROM campaigns
            WHERE status = 'queued'
            ORDER BY created_at ASC
            LIMIT 1
        ''')

        campaign = cursor.fetchone()
        conn.close()

        if campaign:
            campaign_dict = dict(campaign)

            # Check if it can start now
            schedule_info = self.calculate_start_time(campaign_dict)

            if schedule_info['can_start_now']:
                return campaign_dict

        return None

    def auto_start_ready_campaigns(self):
        """
        Automatically start campaigns that are ready to run
        Should be called periodically (every minute)

        Returns:
            Number of campaigns started
        """
        started_count = 0
        max_concurrent = 5  # Max campaigns running at once

        # Check currently running campaigns
        conn = self.get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM campaigns
            WHERE status = 'processing'
        ''')

        running = cursor.fetchone()['count']
        conn.close()

        # Start campaigns if under limit
        if running < max_concurrent:
            slots_available = max_concurrent - running

            for _ in range(slots_available):
                campaign = self.get_next_campaign()

                if not campaign:
                    break

                # Start the campaign
                try:
                    from gps_campaign_manager_v3 import start_campaign
                    # This would be called via the API
                    # For now, just log it
                    logger.info(f"Auto-starting campaign {campaign['id']}")
                    started_count += 1

                except Exception as e:
                    logger.error(f"Failed to auto-start campaign {campaign['id']}: {str(e)}")

        return started_count

    def get_queue_summary(self, user_id: Optional[str] = None) -> Dict:
        """
        Get summary of queued campaigns

        Args:
            user_id: Optional user ID filter

        Returns:
            Dict with queue summary
        """
        conn = self.get_db()
        cursor = conn.cursor()

        if user_id:
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM campaigns
                WHERE user_id = ? AND status = 'queued'
            ''', (user_id,))
        else:
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM campaigns
                WHERE status = 'queued'
            ''')

        queued = cursor.fetchone()['count']
        conn.close()

        # Get next campaigns and their wait times
        conn = self.get_db()
        cursor = conn.cursor()

        if user_id:
            cursor.execute('''
                SELECT id, name, created_at
                FROM campaigns
                WHERE user_id = ? AND status = 'queued'
                ORDER BY created_at ASC
                LIMIT 5
            ''', (user_id,))
        else:
            cursor.execute('''
                SELECT id, name, created_at
                FROM campaigns
                WHERE status = 'queued'
                ORDER BY created_at ASC
                LIMIT 5
            ''')

        queued_campaigns = [dict(row) for row in cursor.fetchall()]
        conn.close()

        # Calculate wait times for each
        for campaign in queued_campaigns:
            schedule_info = self.calculate_start_time(campaign)
            campaign['wait_time_minutes'] = schedule_info['wait_time_minutes']
            campaign['constraints'] = schedule_info['constraints']

        return {
            'total_queued': queued,
            'next_campaigns': queued_campaigns,
            'can_start_now': queued_campaigns[0]['wait_time_minutes'] == 0 if queued_campaigns else True
        }

    def optimize_schedule(self, user_id: str) -> Dict:
        """
        Provide scheduling optimization suggestions

        Args:
            user_id: User ID

        Returns:
            Dict with recommendations
        """
        import subprocess
        import time

        # Get queue summary
        queue = self.get_queue_summary(user_id)

        # Get available devices
        devices = self.device_registry.get_available_devices(user_id)

        # Get available Google accounts
        google_accounts = self.google_account_manager.get_available_accounts(user_id)

        # Calculate optimal start times
        recommendations = []

        for campaign in queue['next_campaigns']:
            campaign_id = campaign['id']

            # Get campaign details
            conn = self.get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM campaigns WHERE id = ?', (campaign_id,))
            campaign_full = dict(cursor.fetchone())
            conn.close()

            # Calculate best start time
            schedule_info = self.calculate_start_time(campaign_full)

            recommendations.append({
                'campaign_id': campaign_id,
                'campaign_name': campaign_full['name'],
                'can_start_now': schedule_info['can_start_now'],
                'wait_time_minutes': schedule_info['wait_time_minutes'],
                'constraints': schedule_info['constraints'],
                'recommended_action': self._get_recommendation(schedule_info)
            })

        return {
            'queue_summary': queue,
            'available_devices': len(devices),
            'available_accounts': len(google_accounts),
            'recommendations': recommendations
        }

    def _get_recommendation(self, schedule_info: Dict) -> str:
        """Get human-readable recommendation"""
        if schedule_info['can_start_now']:
            return "Ready to start now"

        constraints = schedule_info['constraints']

        if not constraints:
            return "Ready to start"

        # Get most urgent constraint
        constraints.sort(key=lambda x: x['available_at'])
        urgent = constraints[0]

        wait_minutes = schedule_info['wait_time_minutes']

        if wait_minutes < 60:
            return f"Wait {wait_minutes} min: {urgent['reason']}"
        elif wait_minutes < 1440:  # < 1 day
            hours = wait_minutes // 60
            return f"Wait {hours}h: {urgent['reason']}"
        else:
            days = wait_minutes // 1440
            return f"Wait {days} days: {urgent['reason']}"

    def auto_advance_cooldowns(self) -> int:
        """
        Automatically advance campaigns from cooldown to completed

        Returns:
            Number of campaigns advanced
        """
        from campaign_workflow import workflow_manager

        advanced_count = 0
        conn = self.get_db()
        cursor = conn.cursor()

        # Get all campaigns in cooldown
        cursor.execute('''
            SELECT id FROM campaigns WHERE status = 'cooldown'
        ''')

        cooldown_campaigns = [row['id'] for row in cursor.fetchall()]
        conn.close()

        for campaign_id in cooldown_campaigns:
            # Check if cooldown is complete
            if workflow_manager.check_cooldown_complete(campaign_id):
                # Transition to completed
                workflow_manager.transition_status(campaign_id, 'completed')
                advanced_count += 1
                logger.info(f"Auto-advanced campaign {campaign_id} from cooldown to completed")

        return advanced_count


def init_scheduler_database(db_connection_func):
    """
    Initialize scheduler database tables

    Args:
        db_connection_func: Database connection function
    """
    conn = db_connection_func()
    cursor = conn.cursor()

    # Create schedule_queue table for advanced queue management
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS schedule_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            scheduled_for TIMESTAMP,
            priority INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            last_attempt TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        )
    ''')

    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON schedule_queue(scheduled_for)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_queue_priority ON schedule_queue(priority, created_at)')

    conn.commit()
    conn.close()

    logger.info("Scheduler database initialized")


if __name__ == "__main__":
    print("Smart Scheduler")
    print("===============")
    print()
    print("Features:")
    print("- Intelligent queue management")
    print("- Constraint detection")
    print("- Automatic campaign starting")
    print("- Cooldown auto-advance")
    print("- Scheduling optimization")
