#!/usr/bin/env python3
"""
Authentication Module - JWT-based user authentication and authorization
"""

import jwt
import bcrypt
import logging
import uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# In production, use environment variable
SECRET_KEY = "gps-campaign-manager-secret-key-change-in-production"

# Token expiration
TOKEN_EXPIRATION_HOURS = 24


class AuthManager:
    """Authentication manager"""

    def __init__(self, db_connection_func):
        """
        Initialize auth manager

        Args:
            db_connection_func: Function that returns database connection
        """
        self.get_db = db_connection_func

    def generate_token(self, user_id: str, username: str, role: str = 'user') -> str:
        """
        Generate JWT token

        Args:
            user_id: User ID
            username: Username
            role: User role

        Returns:
            JWT token string
        """
        payload = {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        logger.info(f"Generated token for user: {username}")

        return token

    def decode_token(self, token: str) -> Optional[Dict]:
        """
        Decode and verify JWT token

        Args:
            token: JWT token string

        Returns:
            Payload dict or None if invalid
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            logger.debug(f"Decoded token for user: {payload.get('username')}")
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None

    def hash_password(self, password: str) -> str:
        """
        Hash password with bcrypt

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verify password against hash

        Args:
            password: Plain text password
            hashed: Hashed password

        Returns:
            True if password matches
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def register_user(
        self,
        username: str,
        email: str,
        password: str,
        role: str = 'user'
    ) -> tuple[bool, str, Optional[str]]:
        """
        Register a new user

        Args:
            username: Username
            email: Email address
            password: Plain text password
            role: User role (default: 'user')

        Returns:
            Tuple of (success: bool, message: str, user_id: Optional[str])
        """
        # Validate input
        if not username or not email or not password:
            return False, "Missing required fields", None

        if len(username) < 3:
            return False, "Username must be at least 3 characters", None

        if len(password) < 6:
            return False, "Password must be at least 6 characters", None

        conn = self.get_db()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            (username, email)
        )

        if cursor.fetchone():
            conn.close()
            return False, "Username or email already exists", None

        # Create user
        user_id = str(uuid.uuid4())
        password_hash = self.hash_password(password)

        cursor.execute('''
            INSERT INTO users (id, username, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, username, email, password_hash, role))

        # Create default settings
        cursor.execute('''
            INSERT INTO user_settings (user_id)
            VALUES (?)
        ''', (user_id,))

        conn.commit()
        conn.close()

        logger.info(f"New user registered: {username} ({email})")

        return True, "User registered successfully", user_id

    def login_user(
        self,
        username: str,
        password: str
    ) -> tuple[bool, str, Optional[Dict], Optional[str]]:
        """
        Login user

        Args:
            username: Username or email
            password: Plain text password

        Returns:
            Tuple of (success, message, user_dict, token)
        """
        if not username or not password:
            return False, "Missing username or password", None, None

        conn = self.get_db()
        cursor = conn.cursor()

        # Get user (by username or email)
        cursor.execute('''
            SELECT id, username, email, password_hash, role, created_at
            FROM users WHERE username = ? OR email = ?
        ''', (username, username))

        user = cursor.fetchone()

        if not user:
            conn.close()
            return False, "Invalid credentials", None, None

        # Verify password
        if not self.verify_password(password, user['password_hash']):
            conn.close()
            return False, "Invalid credentials", None, None

        # Update last login
        cursor.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            (user['id'],)
        )
        conn.commit()
        conn.close()

        # Generate token
        token = self.generate_token(user['id'], user['username'], user['role'])

        user_dict = {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'created_at': user['created_at']
        }

        logger.info(f"User logged in: {user['username']}")

        return True, "Login successful", user_dict, token

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """
        Get user by ID

        Args:
            user_id: User ID

        Returns:
            User dict or None
        """
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, username, email, role, created_at, last_login
            FROM users WHERE id = ?
        ''', (user_id,))

        user = cursor.fetchone()
        conn.close()

        if user:
            return {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'created_at': user['created_at'],
                'last_login': user['last_login']
            }

        return None

    def update_last_login(self, user_id: str):
        """Update user's last login time"""
        conn = self.get_db()
        cursor = conn.cursor()

        cursor.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            (user_id,)
        )

        conn.commit()
        conn.close()


# Decorators for route protection
def require_auth(f):
    """Require authentication decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')

        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401

        # Extract token (remove 'Bearer ' prefix)
        token = auth_header.replace('Bearer ', '')

        if not token:
            return jsonify({'error': 'No token provided'}), 401

        # Decode token
        from flask import current_app
        auth_manager = current_app.config.get('auth_manager')

        if not auth_manager:
            return jsonify({'error': 'Auth manager not configured'}), 500

        payload = auth_manager.decode_token(token)

        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Store user info in Flask's g object
        g.user = payload

        return f(*args, **kwargs)

    return decorated_function


def require_role(role: str):
    """Require specific role decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if authenticated
            if not hasattr(g, 'user'):
                return jsonify({'error': 'Authentication required'}), 401

            # Check role
            user_role = g.user.get('role', 'user')

            if role == 'admin' and user_role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            return f(*args, **kwargs)

        return decorated_function
    return decorator


def get_current_user() -> Optional[Dict]:
    """Get current authenticated user from Flask's g object"""
    return getattr(g, 'user', None)


def is_admin() -> bool:
    """Check if current user is admin"""
    user = get_current_user()
    return user and user.get('role') == 'admin' if user else False


# Utility functions
def log_audit_action(
    db_connection_func,
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str
):
    """
    Log audit action

    Args:
        db_connection_func: Function that returns database connection
        user_id: User ID
        action: Action performed
        resource_type: Type of resource
        resource_id: ID of resource
    """
    try:
        conn = db_connection_func()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO audit_logs (
                user_id, action, resource_type, resource_id,
                ip_address, user_agent
            )
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            action,
            resource_type,
            resource_id,
            request.remote_addr,
            str(request.user_agent)
        ))

        conn.commit()
        conn.close()

        logger.info(f"Audit log: {action} on {resource_type}:{resource_id} by {user_id}")

    except Exception as e:
        logger.error(f"Failed to log audit action: {str(e)}")


def init_auth_db(db_connection_func):
    """
    Initialize authentication database tables

    Args:
        db_connection_func: Function that returns database connection
    """
    conn = db_connection_func()
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT NOT NULL,
            device_id TEXT UNIQUE NOT NULL,
            app_package TEXT DEFAULT 'com.igork.fakegps',
            status TEXT DEFAULT 'available',
            last_used TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # Create audit_logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id TEXT,
            ip_address TEXT,
            user_agent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)')

    conn.commit()
    conn.close()

    logger.info("Auth database tables initialized")


if __name__ == "__main__":
    # Test password hashing
    auth = AuthManager(lambda: None)

    password = "test123"
    hashed = auth.hash_password(password)
    print(f"Password: {password}")
    print(f"Hashed: {hashed}")
    print(f"Verified: {auth.verify_password(password, hashed)}")
