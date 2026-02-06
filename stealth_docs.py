#!/usr/bin/env python3
"""
Stealth Protocol Documentation - No-root detection-proofing rules and ADB commands
"""

from flask import Blueprint, render_template, jsonify

# Create blueprint for stealth docs
stealth_bp = Blueprint('stealth', __name__, url_prefix='/stealth')


# Stealth Protocol Configuration
STEALTH_RULES = {
    "adb_flush_commands": {
        "title": "ADB Flush Script",
        "description": "Clear Google Play Services and location caches to prevent detection",
        "commands": [
            "# Clear Google Play Services",
            "adb shell pm clear com.google.android.gms",
            "",
            "# Clear fused location provider",
            "adb shell pm clear com.android.location.fused",
            "",
            "# Clear Google Services Framework",
            "adb shell pm clear com.google.android.gsf",
            "",
            "# Clear Google Play Store",
            "adb shell pm clear com.android.vending",
            "",
            "# Clear network location cache",
            "adb shell rm -rf /data/data/com.google.android.gms/shared_prefs/*",
            "",
            "# Clear Google Maps cache",
            "adb shell pm clear com.google.android.apps.maps"
        ]
    },
    "detection_proofing": {
        "title": "Detection-Proofing Commands",
        "description": "Disable background scanning that can reveal spoofing",
        "commands": [
            "# Disable Wi-Fi scanning (even when Wi-Fi is off)",
            "adb shell settings put global wifi_scan_always_enabled 0",
            "",
            "# Disable Bluetooth scanning (even when Bluetooth is off)",
            "adb shell settings put global bluetooth_scan_always_enabled 0",
            "",
            "# Disable network location service",
            "adb shell settings put secure location_mode 0",  # 0 = off, 1 = device_only, 2 = battery_saving, 3 = high_accuracy
            "",
            "# Disable cell tower location",
            "adb shell settings put global airplane_mode_on 0",  # Keep airplane mode off
            "",
            "# Disable Google Location History",
            "adb shell settings put secure location_history_enabled 0",
            "",
            "# Disable Google Location Sharing",
            "adb shell settings put secure location_sharing_enabled 0",
            "",
            "# Disable location for Chrome",
            "adb shell pm revoke com.android.chrome android.permission.ACCESS_COARSE_LOCATION",
            "adb shell pm revoke com.android.chrome android.permission.ACCESS_FINE_LOCATION",
            "",
            "# Disable location for Google app",
            "adb shell pm revoke com.google.android.googlequicksearchbox android.permission.ACCESS_COARSE_LOCATION",
            "adb shell pm revoke com.google.android.googlequicksearchbox android.permission.ACCESS_FINE_LOCATION"
        ]
    },
    "mock_location_setup": {
        "title": "Mock Location Setup",
        "description": "Enable and configure mock location provider",
        "commands": [
            "# Enable mock location for Fake Traveler",
            "adb shell appops set com.igork.fakegps android:mock_location allow",
            "",
            "# Alternative: Enable for Mock my GPS",
            "adb shell appops set com.example.mockgps android:mock_location allow",
            "",
            "# Grant location permissions",
            "adb shell pm grant com.igork.fakegps android.permission.ACCESS_FINE_LOCATION",
            "adb shell pm grant com.igork.fakegps android.permission.ACCESS_COARSE_LOCATION",
            "adb shell pm grant com.igork.fakegps android.permission.ACCESS_BACKGROUND_LOCATION",
            "",
            "# Verify mock location is enabled",
            "adb shell appops query-op android:mock_location com.igork.fakegps"
        ]
    },
    "device_fingerprinting": {
        "title": "Anti-Fingerprinting Measures",
        "description": "Reduce device fingerprinting to avoid detection",
        "commands": [
            "# Reset Android ID (requires root)",
            "# adb shell settings put secure android_id [new_id]",
            "",
            "# Clear advertising ID",
            "adb shell pm clear com.google.android.gms",
            "",
            "# Disable Google Analytics",
            "adb shell settings put global analytics_collection_enabled 0",
            "",
            "# Disable usage and diagnostics",
            "adb shell settings put global usage_stats_enabled 0",
            "",
            "# Clear cache partition",
            "adb shell rm -rf /cache/*",
            "",
            "# Clear dalvik cache",
            "adb shell rm -rf /data/dalvik-cache/*"
        ]
    }
}

SMART_LIMITATIONS = {
    "max_trips_per_day": {
        "title": "Maximum Trips Per Day",
        "value": "2-3 trips",
        "description": "Never exceed 3 location changes per day on the same Google account",
        "rationale": "Google's systems flag accounts with excessive location changes as suspicious"
    },
    "min_idle_time": {
        "title": "Minimum Idle Time Between Journeys",
        "value": "4 hours",
        "description": "Wait at least 4 hours of stationary time between trips",
        "rationale": "Real users don't continuously move. Extended idle periods appear natural."
    },
    "cooldown_period": {
        "title": "Post-Trip Cooldown",
        "value": "30 minutes",
        "description": "After completing a journey, wait 30 minutes before 'returning home' movement",
        "rationale": "Prevents detection by avoiding immediate location reversals"
    },
    "max_distance_per_trip": {
        "title": "Maximum Distance Per Trip",
        "value": "50 km",
        "description": "Keep total journey distance under 50km per trip",
        "rationale": "Long-distance travel without prior booking/activity is suspicious"
    },
    "realistic_speed": {
        "title": "Realistic Movement Speed",
        "value": "5-15 km/h",
        "description": "Maintain walking (5 km/h) to cycling (15 km/h) speeds",
        "rationale": "Vehicle speeds without matching transportation data raise flags"
    },
    "account_isolation": {
        "title": "Account Isolation",
        "value": "One account per device",
        "description": "Never use the same Google account on multiple devices simultaneously",
        "rationale": "Concurrent logins from different locations are impossible without spoofing"
    }
}

BEST_PRACTICES = {
    "timing": {
        "title": "Optimal Timing",
        "tips": [
            "Start journeys during normal waking hours (7 AM - 10 PM)",
            "Avoid midnight trips unless simulating night travel",
            "Schedule trips during weekdays for work commutes",
            "Weekend trips should be to leisure locations (parks, malls)",
            "Match location type to time of day (office during work, home at night)"
        ]
    },
    "location_patterns": {
        "title": "Natural Location Patterns",
        "tips": [
            "Always start and end at 'home' location",
            "Visit realistic locations (grocery stores, gyms, restaurants)",
            "Dwell time at destinations: 15-60 minutes is natural",
            "Don't teleport - move gradually between locations",
            "Use circular routes that return to starting point",
            "Vary routes slightly between days"
        ]
    },
    "behavioral_realism": {
        "title": "Behavioral Realism",
        "tips": [
            "Simulate 'pauses' during movement (red lights, traffic)",
            "Add slight randomness to routes (don't follow perfect lines)",
            "Vary walking speeds (slower in stores, faster outside)",
            "Don't visit the same locations every day at the same time",
            "Mix up trip durations and destinations"
        ]
    },
    "signs_management": {
        "title": "Google Account Signs",
        "tips": [
            "Never sign in to Google immediately after spoofing",
            "Wait 10-15 minutes after trip completes before signing in",
            "Use VPN if accessing Google from spoofed location",
            "Clear browser cookies before accessing Google services",
            "Avoid Google Maps immediately after spoofing"
        ]
    }
}

DETECTION_INDICATORS = {
    "red_flags": [
        "Immediate location changes >100km",
        "Multiple location changes in <1 hour",
        "GPS location without WiFi/cell tower match",
        "Location without search history for that area",
        "New device logging in from distant location",
        "Device ID changes while logged in",
        "Mock location provider detected in app ops",
        "Root access detected",
        "Su binary present on device",
        "Xposed Framework installed"
    ],
    "suspicious_patterns": [
        "Same route every day at identical times",
        "No app usage during 'travel'",
        "Location changes without network change",
        "GPS accuracy always at maximum (perfect spoofing)",
        "Device stationary for hours, then instant teleport"
    ]
}


@stealth_bp.route('/')
def index():
    """Stealth documentation index page"""
    from flask import render_template_string

    template = """
<!DOCTYPE html>
<html>
<head>
    <title>Stealth Protocol Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 20px;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #4CAF50; margin-bottom: 10px; }
        .subtitle { color: #888; margin-bottom: 30px; }
        .section { background: #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .section h2 { color: #4CAF50; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .section h3 { color: #fff; margin: 20px 0 10px; }
        .commands {
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
            margin: 10px 0;
        }
        .commands .comment { color: #6a9955; }
        .commands .command { color: #dcdcaa; margin: 5px 0; }
        .rule {
            background: #363636;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 10px 0;
        }
        .rule h4 { color: #fff; margin-bottom: 5px; }
        .rule .value { color: #4CAF50; font-weight: bold; }
        .rule .description { color: #bbb; margin: 10px 0; }
        .rule .rationale { color: #888; font-style: italic; font-size: 14px; }
        .tips li { margin: 8px 0; color: #ccc; }
        .warning { background: #3a2a2a; border-left: 4px solid #f44336; padding: 15px; margin: 10px 0; }
        .warning h4 { color: #f44336; }
        .warning ul { margin: 10px 0 0 20px; color: #ccc; }
        .copy-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
        }
        .copy-btn:hover { background: #45a049; }
        .copied { background: #2196F3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Stealth Protocol Documentation</h1>
        <p class="subtitle">No-Root Detection-Proofing Rules & ADB Commands</p>

        <!-- ADB Flush Script -->
        <div class="section">
            <h2>📱 ADB Flush Script</h2>
            <p>{{ stealth_rules['adb_flush_commands']['description'] }}</p>
            <div class="commands" id="adb-flush">
                {% for cmd in stealth_rules['adb_flush_commands']['commands'] %}
                    {% if cmd.startswith('#') %}
                        <div class="comment">{{ cmd }}</div>
                    {% elif cmd %}
                        <div class="command">{{ cmd }}</div>
                    {% endif %}
                {% endfor %}
            </div>
            <button class="copy-btn" onclick="copyCommands('adb-flush')">📋 Copy Commands</button>
        </div>

        <!-- Detection Proofing -->
        <div class="section">
            <h2>🛡️ Detection-Proofing Commands</h2>
            <p>{{ stealth_rules['detection_proofing']['description'] }}</p>
            <div class="commands" id="detection-proof">
                {% for cmd in stealth_rules['detection_proofing']['commands'] %}
                    {% if cmd.startswith('#') %}
                        <div class="comment">{{ cmd }}</div>
                    {% elif cmd %}
                        <div class="command">{{ cmd }}</div>
                    {% endif %}
                {% endfor %}
            </div>
            <button class="copy-btn" onclick="copyCommands('detection-proof')">📋 Copy Commands</button>
        </div>

        <!-- Smart Limitations -->
        <div class="section">
            <h2>⚠️ Smart Limitations</h2>
            <p style="margin-bottom: 20px;">Follow these rules to avoid detection:</p>

            {% for key, rule in smart_limitations.items() %}
            <div class="rule">
                <h4>{{ rule['title'] }}: <span class="value">{{ rule['value'] }}</span></h4>
                <p class="description">{{ rule['description'] }}</p>
                <p class="rationale">💡 {{ rule['rationale'] }}</p>
            </div>
            {% endfor %}
        </div>

        <!-- Best Practices -->
        <div class="section">
            <h2>✅ Best Practices</h2>

            <h3>⏰ Optimal Timing</h3>
            <ul class="tips">
                {% for tip in best_practices['timing']['tips'] %}
                <li>{{ tip }}</li>
                {% endfor %}
            </ul>

            <h3>📍 Natural Location Patterns</h3>
            <ul class="tips">
                {% for tip in best_practices['location_patterns']['tips'] %}
                <li>{{ tip }}</li>
                {% endfor %}
            </ul>

            <h3>🎭 Behavioral Realism</h3>
            <ul class="tips">
                {% for tip in best_practices['behavioral_realism']['tips'] %}
                <li>{{ tip }}</li>
                {% endfor %}
            </ul>
        </div>

        <!-- Detection Indicators -->
        <div class="section">
            <h2>🚨 Detection Indicators to Avoid</h2>

            <div class="warning">
                <h4>🔴 Red Flags</h4>
                <ul>
                    {% for flag in detection_indicators['red_flags'] %}
                    <li>{{ flag }}</li>
                    {% endfor %}
                </ul>
            </div>

            <div class="warning">
                <h4>⚠️ Suspicious Patterns</h4>
                <ul>
                    {% for pattern in detection_indicators['suspicious_patterns'] %}
                    <li>{{ pattern }}</li>
                    {% endfor %}
                </ul>
            </div>
        </div>
    </div>

    <script>
        function copyCommands(elementId) {
            const element = document.getElementById(elementId);
            const commands = element.innerText;

            navigator.clipboard.writeText(commands).then(() => {
                const btn = event.target;
                btn.textContent = '✓ Copied!';
                btn.classList.add('copied');

                setTimeout(() => {
                    btn.textContent = '📋 Copy Commands';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
    </script>
</body>
</html>
    """

    return render_template_string(
        template,
        stealth_rules=STEALTH_RULES,
        smart_limitations=SMART_LIMITATIONS,
        best_practices=BEST_PRACTICES,
        detection_indicators=DETECTION_INDICATORS
    )


@stealth_bp.route('/api/commands')
def get_commands():
    """Get stealth commands as JSON"""
    return jsonify({
        "adb_flush": STEALTH_RULES["adb_flush_commands"]["commands"],
        "detection_proofing": STEALTH_RULES["detection_proofing"]["commands"],
        "mock_location_setup": STEALTH_RULES["mock_location_setup"]["commands"],
        "anti_fingerprinting": STEALTH_RULES["device_fingerprinting"]["commands"]
    })


@stealth_bp.route('/api/rules')
def get_rules():
    """Get smart limitations rules"""
    return jsonify(SMART_LIMITATIONS)


@stealth_bp.route('/api/best-practices')
def get_best_practices():
    """Get best practices"""
    return jsonify(BEST_PRACTICES)


def generate_adb_script(
    adb_device_id: str,
    flush_cache: bool = True,
    detection_proofing: bool = True
) -> str:
    """
    Generate complete ADB setup script

    Args:
        adb_device_id: ADB device ID
        flush_cache: Include cache flush commands
        detection_proofing: Include detection-proofing commands

    Returns:
        Shell script content
    """
    script_lines = [
        "#!/bin/bash",
        f"# Stealth Setup Script for {adb_device_id}",
        "# Generated automatically",
        "",
        f"DEVICE_ID='{adb_device_id}'",
        "",
        "echo 'Starting stealth setup for device: $DEVICE_ID'",
        ""
    ]

    if flush_cache:
        script_lines.append("# Flush caches")
        for cmd in STEALTH_RULES["adb_flush_commands"]["commands"]:
            if cmd and not cmd.startswith("#"):
                script_lines.append(f"adb -s $DEVICE_ID {cmd}")
        script_lines.append("")

    if detection_proofing:
        script_lines.append("# Detection proofing")
        for cmd in STEALTH_RULES["detection_proofing"]["commands"]:
            if cmd and not cmd.startswith("#") and "settings put" in cmd:
                script_lines.append(f"adb -s $DEVICE_ID {cmd}")
        script_lines.append("")

    script_lines.append("echo 'Stealth setup complete!'")

    return "\n".join(script_lines)


if __name__ == "__main__":
    print("Stealth Protocol Documentation")
    print("==============================")
    print(f"\nADB Flush Commands: {len(STEALTH_RULES['adb_flush_commands']['commands'])}")
    print(f"Detection Proofing: {len(STEALTH_RULES['detection_proofing']['commands'])}")
    print(f"Smart Limitations: {len(SMART_LIMITATIONS)}")
    print(f"Best Practices: {len(BEST_PRACTICES)}")
