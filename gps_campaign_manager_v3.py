#!/usr/bin/env python3
"""
GPS Campaign Manager v3.2 - With Smart Scheduling
Multi-user Android GPS spoofing campaign management system
"""

import os
import sqlite3
import logging
from datetime import datetime
from flask import Flask, render_template, jsonify, request, g, session
from flask_socketio import SocketIO, emit, join_room, leave_room

# Import all modules
from auth import (
    AuthManager, require_auth, require_role,
    get_current_user, is_admin, log_audit_action,
    init_auth_db
)
from android_gps_controller import AndroidGPSController
from location_simulator import LocationSimulator, PREDEFINED_ROUTES
from campaign_workflow import (
    CampaignWorkflow, CampaignStatus, init_workflow_database
)
from device_registry import (
    DeviceRegistry, DeviceScript, DeviceSyncStatus,
    init_device_registry_database
)
from live_logger import (
    LiveLogger, LogLevel, register_log_events,
    init_logging_database
)
from stealth_docs import stealth_bp, STEALTH_RULES, generate_adb_script
from google_account_manager import (
    GoogleAccountManager, init_google_accounts_database
)
from smart_scheduler import (
    SmartScheduler, init_scheduler_database
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'gps-campaign-manager-secret-key-change-in-production')

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'campaigns.db')


# ============================================================================
# Database Connection
# ============================================================================

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================================
# Initialize Managers
# ============================================================================

# Auth manager
auth_manager = AuthManager(get_db_connection)
app.config['auth_manager'] = auth_manager

# Campaign workflow manager
workflow_manager = CampaignWorkflow(get_db_connection)

# Device registry manager
device_registry = DeviceRegistry(get_db_connection)

# Live logger
live_logger = LiveLogger(get_db_connection, socketio)

# Google account manager
google_account_manager = GoogleAccountManager(get_db_connection)

# Smart scheduler
smart_scheduler = SmartScheduler(
    get_db_connection,
    google_account_manager,
    device_registry
)


# ============================================================================
# Database Initialization
# ============================================================================

def init_database():
    """Initialize all database tables"""
    logger.info("Initializing database...")

    # Initialize auth tables
    init_auth_db(get_db_connection)

    # Initialize workflow tables
    init_workflow_database(get_db_connection)

    # Initialize device registry tables
    init_device_registry_database(get_db_connection)

    # Initialize logging tables
    init_logging_database(get_db_connection)

    # Initialize Google accounts table
    init_google_accounts_database(get_db_connection)

    # Initialize scheduler tables
    init_scheduler_database(get_db_connection)

    logger.info("Database initialization complete")


# ============================================================================
# Helper Functions
# ============================================================================

def get_current_user_id():
    """Get current user ID from JWT token"""
    user = get_current_user()
    return user['user_id'] if user else None


def emit_dashboard_update():
    """Emit dashboard update to all connected clients"""
    socketio.emit('dashboard_refresh', {'timestamp': datetime.now().isoformat()})


# ============================================================================
# Background Task: Auto-advance cooldowns
# ============================================================================

def background_cooldown_checker():
    """Background task to auto-advance campaigns from cooldown"""
    import time

    while True:
        try:
            # Check for campaigns that can advance from cooldown
            advanced = smart_scheduler.auto_advance_cooldowns()

            if advanced > 0:
                logger.info(f"Auto-advanced {advanced} campaigns from cooldown")
                emit_dashboard_update()

        except Exception as e:
            logger.error(f"Cooldown checker error: {str(e)}")

        # Check every 30 seconds
        time.sleep(30)


# ============================================================================
# Authentication Routes
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()

        success, message, user_id = auth_manager.register_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role='user'
        )

        if success:
            logger.info(f"New user registered: {data['username']}")
            return jsonify({'success': True, 'message': message, 'user_id': user_id}), 201
        else:
            return jsonify({'success': False, 'error': message}), 400

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()

        success, message, user_dict, token = auth_manager.login_user(
            username=data['username'],
            password=data['password']
        )

        if success:
            logger.info(f"User logged in: {user_dict['username']}")
            return jsonify({
                'success': True,
                'token': token,
                'user': user_dict
            }), 200
        else:
            return jsonify({'success': False, 'error': message}), 401

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/me')
@require_auth
def get_current_user_info():
    """Get current user info"""
    user_id = get_current_user_id()
    user = auth_manager.get_user_by_id(user_id)

    if user:
        return jsonify(user)
    else:
        return jsonify({'error': 'User not found'}), 404


# ============================================================================
# Smart Scheduler Routes (Priority 3)
# ============================================================================

@app.route('/api/scheduler/calculate', methods=['POST'])
@require_auth
def calculate_schedule():
    """Calculate when a campaign can start"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()

        # Build campaign data from form
        campaign_data = {
            'device_id': data.get('device_id'),
            'google_account': data.get('google_account'),
            'duration_hours': data.get('duration_hours', 1)
        }

        # Calculate schedule
        schedule_info = smart_scheduler.calculate_start_time(campaign_data)

        return jsonify(schedule_info)

    except Exception as e:
        logger.error(f"Schedule calculation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/scheduler/queue')
@require_auth
def get_queue_status():
    """Get queue status and summary"""
    try:
        user_id = get_current_user_id()

        queue_summary = smart_scheduler.get_queue_summary(user_id)

        return jsonify(queue_summary)

    except Exception as e:
        logger.error(f"Queue status error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/scheduler/optimize')
@require_auth
def get_schedule_optimization():
    """Get scheduling optimization recommendations"""
    try:
        user_id = get_current_user_id()

        optimization = smart_scheduler.optimize_schedule(user_id)

        return jsonify(optimization)

    except Exception as e:
        logger.error(f"Optimization error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/scheduler/auto-start', methods=['POST'])
@require_auth
def auto_start_campaigns():
    """Manually trigger auto-start of ready campaigns"""
    try:
        # Verify admin or user permission
        user_id = get_current_user_id()

        started = smart_scheduler.auto_start_ready_campaigns()

        return jsonify({
            'success': True,
            'started_count': started,
            'message': f"Started {started} campaigns"
        })

    except Exception as e:
        logger.error(f"Auto-start error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# Google Account Routes
# ============================================================================

@app.route('/api/google-accounts', methods=['GET'])
@require_auth
def list_google_accounts():
    """List user's Google accounts"""
    user_id = get_current_user_id()
    accounts = google_account_manager.list_user_accounts(user_id)

    # Add availability info
    for account in accounts:
        time_until = google_account_manager.get_time_until_available(account['account_email'])
        account['available'] = time_until is None
        account['time_until_available'] = time_until

    return jsonify(accounts)


@app.route('/api/google-accounts', methods=['POST'])
@require_auth
def create_google_account():
    """Register a Google account"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()

        success, message, account_id = google_account_manager.register_google_account(
            user_id=user_id,
            account_email=data['account_email'],
            friendly_name=data.get('friendly_name')
        )

        if success:
            return jsonify({
                'success': True,
                'message': message,
                'account_id': account_id
            }), 201
        else:
            return jsonify({'success': False, 'error': message}), 400

    except Exception as e:
        logger.error(f"Google account creation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/google-accounts/<account_email>/check', methods=['GET'])
@require_auth
def check_google_account_limits(account_email):
    """Check if Google account can start a trip"""
    try:
        user_id = get_current_user_id()

        # Verify ownership
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM google_accounts WHERE account_email = ?', (account_email,))
        account = cursor.fetchone()
        conn.close()

        if not account or account['user_id'] != user_id:
            return jsonify({'success': False, 'error': 'Account not found'}), 404

        can_start, reason, available_at = google_account_manager.check_daily_limits(account_email)

        return jsonify({
            'can_start': can_start,
            'reason': reason,
            'available_at': available_at.isoformat() if available_at else None
        })

    except Exception as e:
        logger.error(f"Account check error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# Device Routes
# ============================================================================

@app.route('/api/devices', methods=['GET'])
@require_auth
def list_devices():
    """List user's devices"""
    user_id = get_current_user_id()
    devices = device_registry.list_user_devices(user_id)

    # Check sync status for all devices
    device_registry.check_all_device_sync()

    return jsonify(devices)


@app.route('/api/devices', methods=['POST'])
@require_auth
def create_device():
    """Register new device"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()

        success, message, device_id = device_registry.register_device(
            user_id=user_id,
            name=data['name'],
            adb_device_id=data['adb_device_id'],
            proxy_ip=data.get('proxy_ip'),
            initial_script=data.get('current_script', 'none')
        )

        if success:
            log_audit_action(get_db_connection, user_id, 'create_device', 'device', device_id)
            return jsonify({'success': True, 'message': message, 'device_id': device_id}), 201
        else:
            return jsonify({'success': False, 'error': message}), 400

    except Exception as e:
        logger.error(f"Device creation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/devices/<device_id>/connect', methods=['POST'])
@require_auth
def connect_device(device_id):
    """Test device connection"""
    try:
        user_id = get_current_user_id()

        device = device_registry.get_device(device_id)
        if not device or device['user_id'] != user_id:
            return jsonify({'success': False, 'error': 'Device not found'}), 404

        # Test ADB connection
        controller = AndroidGPSController(device['adb_device_id'])
        devices = controller.list_connected_devices()

        found = any(d['id'] == device['adb_device_id'] for d in devices)

        if found:
            # Update sync status to online
            device_registry.update_sync_status(device['adb_device_id'], 'online')

            # Enable mock location
            controller.enable_mock_location()

            return jsonify({
                'success': True,
                'status': 'connected',
                'message': 'Device connected and ready'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Device not connected via ADB'
            }), 404

    except Exception as e:
        logger.error(f"Device connection error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# Campaign Routes
# ============================================================================

@app.route('/api/campaigns', methods=['GET'])
@require_auth
def list_campaigns():
    """List user's campaigns"""
    try:
        user_id = get_current_user_id()
        status_filter = request.args.get('status')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = 'SELECT * FROM campaigns WHERE user_id = ?'
        params = [user_id]

        if status_filter:
            query += ' AND status = ?'
            params.append(status_filter)

        query += ' ORDER BY created_at DESC'

        cursor.execute(query, params)
        campaigns = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify(campaigns)

    except Exception as e:
        logger.error(f"Campaign list error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/campaigns', methods=['POST'])
@require_auth
def create_campaign():
    """Create new campaign"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()

        # Validate device availability
        device = device_registry.get_device(data['device_id'])
        if not device or device['user_id'] != user_id:
            return jsonify({'success': False, 'error': 'Device not available'}), 400

        can_start, reason = device_registry.can_start_gps_campaign(data['device_id'])
        if not can_start:
            return jsonify({'success': False, 'error': reason}), 400

        # Check Google account limits
        google_account = data.get('google_account')
        if google_account:
            can_start, reason, available_at = google_account_manager.check_daily_limits(google_account)
            if not can_start:
                return jsonify({
                    'success': False,
                    'error': f"Google account limit: {reason}",
                    'available_at': available_at.isoformat() if available_at else None
                }), 400

        # Create campaign
        import uuid
        campaign_id = str(uuid.uuid4())[:8]

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO campaigns (
                id, user_id, name, device_id, google_account, account_mode,
                duration_hours, status, current_step, progress
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            campaign_id,
            user_id,
            data['name'],
            data['device_id'],
            google_account,
            data.get('account_mode', 'normal'),
            data.get('duration_hours', 1),
            'queued',
            'Waiting to start...',
            0
        ))

        conn.commit()
        conn.close()

        # Log action
        log_audit_action(get_db_connection, user_id, 'create_campaign', 'campaign', campaign_id)

        # Emit event
        emit_dashboard_update()

        logger.info(f"Campaign created: {campaign_id} by user {user_id}")

        return jsonify({
            'success': True,
            'campaign_id': campaign_id,
            'message': 'Campaign created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Campaign creation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/start', methods=['POST'])
@require_auth
def start_campaign(campaign_id):
    """Start campaign"""
    try:
        user_id = get_current_user_id()

        # Get campaign
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM campaigns WHERE id = ? AND user_id = ?', (campaign_id, user_id))
        campaign = cursor.fetchone()
        conn.close()

        if not campaign:
            return jsonify({'success': False, 'error': 'Campaign not found'}), 404

        # Check device availability
        can_start, reason = device_registry.can_start_gps_campaign(campaign['device_id'])
        if not can_start:
            return jsonify({'success': False, 'error': reason}), 400

        # Check Google account limits again
        if campaign['google_account']:
            can_start, reason, available_at = google_account_manager.check_daily_limits(campaign['google_account'])
            if not can_start:
                return jsonify({
                    'success': False,
                    'error': f"Google account limit: {reason}",
                    'available_at': available_at.isoformat() if available_at else None
                }), 400

        # Transition status
        success, message = workflow_manager.transition_status(campaign_id, 'processing')

        if success:
            # Increment Google account trip count
            if campaign['google_account']:
                google_account_manager.increment_trip_count(campaign['google_account'])

            # Update device script
            device_registry.set_device_script(campaign['device_id'], 'gps', user_id)

            # Start campaign in background
            import threading
            thread = threading.Thread(
                target=run_campaign_execution,
                args=(campaign_id, campaign['device_id'])
            )
            thread.daemon = True
            thread.start()

            # Log action
            log_audit_action(get_db_connection, user_id, 'start_campaign', 'campaign', campaign_id)

            # Emit event
            emit_dashboard_update()

            logger.info(f"Campaign started: {campaign_id}")

            return jsonify({'success': True, 'message': 'Campaign started'})
        else:
            return jsonify({'success': False, 'error': message}), 400

    except Exception as e:
        logger.error(f"Campaign start error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/duplicate', methods=['POST'])
@require_auth
def duplicate_campaign(campaign_id):
    """Duplicate existing campaign"""
    try:
        user_id = get_current_user_id()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM campaigns WHERE id = ? AND user_id = ?', (campaign_id, user_id))
        original = cursor.fetchone()
        conn.close()

        if not original:
            return jsonify({'success': False, 'error': 'Campaign not found'}), 404

        # Create duplicate
        import uuid
        new_campaign_id = str(uuid.uuid4())[:8]

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO campaigns (
                id, user_id, name, device_id, google_account, account_mode,
                duration_hours, status, current_step, progress
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            new_campaign_id,
            user_id,
            f"{original['name']} (Copy)",
            original['device_id'],
            original['google_account'],
            original['account_mode'],
            original['duration_hours'],
            'queued',
            'Waiting to start...',
            0
        ))

        conn.commit()
        conn.close()

        log_audit_action(get_db_connection, user_id, 'duplicate_campaign', 'campaign', new_campaign_id)

        return jsonify({
            'success': True,
            'campaign_id': new_campaign_id,
            'message': 'Campaign duplicated'
        }), 201

    except Exception as e:
        logger.error(f"Campaign duplication error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


def run_campaign_execution(campaign_id, device_id):
    """Run campaign execution with real GPS spoofing"""
    try:
        # Get campaign details
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM campaigns WHERE id = ?', (campaign_id,))
        campaign = dict(cursor.fetchone())

        # Get device
        device = device_registry.get_device(device_id)

        # Initialize GPS controller
        gps_controller = AndroidGPSController(device['adb_device_id'])
        simulator = LocationSimulator(gps_controller)

        # Add initial log
        live_logger.add_log(campaign_id, 'info', 'Campaign started', device_id)

        # Define steps based on account mode
        if campaign['account_mode'] == 'normal':
            start_lat, start_lng = 52.3676, 4.9041  # Amsterdam
            speed = 5
            radius = 0.5
        elif campaign['account_mode'] == 'aggressive':
            start_lat, start_lng = 51.5074, -0.1278  # London
            speed = 15
            radius = 2.0
        else:  # stealth
            start_lat, start_lng = 52.3702, 4.8952  # Amsterdam Centrum
            speed = 2
            radius = 0.2

        # Step 1: Enable mock location
        live_logger.add_log(campaign_id, 'info', 'Enabling mock location...', device_id)
        gps_controller.enable_mock_location()
        gps_controller.start_mocking()

        # Step 2: Set initial location
        live_logger.add_log(campaign_id, 'info', f'Setting initial location: {start_lat}, {start_lng}', device_id)
        gps_controller.set_location(start_lat, start_lng)

        # Step 3: Simulate movement
        live_logger.add_log(campaign_id, 'info', f'Simulating circular movement (radius: {radius}km, speed: {speed}km/h)', device_id)

        def progress_callback(progress, message):
            live_logger.add_log(campaign_id, 'info', message, device_id)
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('UPDATE campaigns SET progress = ? WHERE id = ?', (progress, campaign_id))
            conn.commit()
            conn.close()

        # Run circular simulation
        duration_minutes = int(campaign['duration_hours'] * 60)
        simulator.simulate_circular_movement(
            center=(start_lat, start_lng),
            radius_km=radius,
            speed_kmh=speed,
            duration_hours=campaign['duration_hours'],
            update_interval=2,
            progress_callback=progress_callback
        )

        # Step 4: Complete campaign
        live_logger.add_log(campaign_id, 'info', 'Movement simulation complete, entering cooldown...', device_id)
        success, message = workflow_manager.transition_status(campaign_id, 'cooldown')

        if success:
            # Wait for cooldown (30 minutes)
            import time
            cooldown_seconds = 30 * 60  # 30 minutes

            for i in range(cooldown_seconds):
                time.sleep(1)

                # Check every minute if we can auto-advance
                if i % 60 == 0:
                    complete = workflow_manager.check_cooldown_complete(campaign_id)
                    if complete:
                        break

            # Transition to completed
            workflow_manager.transition_status(campaign_id, 'completed')

            # Stop mocking
            gps_controller.stop_mocking()

            # Update device script
            device_registry.set_device_script(device_id, 'none', campaign['user_id'])

            live_logger.add_log(campaign_id, 'info', 'Campaign completed successfully', device_id)

            emit_dashboard_update()

            logger.info(f"Campaign completed: {campaign_id}")

    except Exception as e:
        logger.error(f"Campaign execution error: {str(e)}")

        # Fail campaign
        workflow_manager.transition_status(campaign_id, 'failed', str(e))
        live_logger.add_log(campaign_id, 'error', f'Campaign failed: {str(e)}', device_id)

        emit_dashboard_update()


# ============================================================================
# Logs Routes
# ============================================================================

@app.route('/api/logs/<campaign_id>')
@require_auth
def get_campaign_logs(campaign_id):
    """Get campaign logs"""
    try:
        user_id = get_current_user_id()

        # Verify ownership
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM campaigns WHERE id = ?', (campaign_id,))
        campaign = cursor.fetchone()
        conn.close()

        if not campaign or campaign['user_id'] != user_id:
            return jsonify({'success': False, 'error': 'Campaign not found'}), 404

        logs = live_logger.get_logs(campaign_id, limit=100)

        return jsonify(logs)

    except Exception as e:
        logger.error(f"Get logs error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# Dashboard Routes
# ============================================================================

@app.route('/api/dashboard/stats')
@require_auth
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        user_id = get_current_user_id()

        # Get workflow summary
        status_summary = workflow_manager.get_status_summary(user_id)

        # Get device stats
        device_stats = device_registry.get_device_stats()

        return jsonify({
            'campaigns': status_summary,
            'devices': device_stats
        })

    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# Socket.IO Events
# ============================================================================

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('connected', {'message': 'Connected to GPS Campaign Manager v3.2'})


@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')


# Register log events
register_log_events(socketio, live_logger)


# ============================================================================
# Main Routes (UI Pages)
# ============================================================================

@app.route('/')
def index():
    """Dashboard"""
    return render_template('dashboard.html')


@app.route('/login')
def login_page():
    """Login page"""
    return render_template('login.html')


@app.route('/register')
def register_page():
    """Register page"""
    return render_template('register.html')


@app.route('/create')
@require_auth
def create_campaign_page():
    """Create campaign page"""
    return render_template('create.html')


@app.route('/devices')
@require_auth
def devices_page():
    """Devices page"""
    return render_template('devices.html')


@app.route('/history')
@require_auth
def history_page():
    """History page"""
    return render_template('history.html')


@app.route('/stealth')
def stealth_page():
    """Stealth documentation"""
    pass


# Register blueprints
app.register_blueprint(stealth_bp)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == '__main__':
    # Initialize database
    init_database()

    # Start background cooldown checker
    import threading
    cooldown_thread = threading.Thread(target=background_cooldown_checker, daemon=True)
    cooldown_thread.start()

    # Run app
    logger.info("Starting GPS Campaign Manager v3.2")
    socketio.run(app, host='0.0.0.0', port=5002, debug=True, allow_unsafe_werkzeug=True)
