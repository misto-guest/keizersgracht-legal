# 📋 GPS Campaign Manager - Requirements Analysis & Implementation Status

## Review of Project Manager Requirements

| # | Requirement | Status | Implementation Notes |
|---|-------------|--------|---------------------|
| 1 | **Assigned Device ID (Serial Number)** | ✅ Partial | Campaigns have `device_id` field, but needs ADB device ID mapping |
| 2 | **UX Shortcuts** | ❌ Missing | - Duplicate button<br>- Copy from Previous<br>- Bulk actions |
| 3 | **Status Workflow** | ❌ Incomplete | Current: pending/running/completed/failed<br>Missing: Queued, Processing, Cooldown states |
| 4 | **Device & Conflict Management** | ❌ Missing | - Device Registry page<br>- Music vs GPS script conflict detection<br>- Proxy IP tracking |
| 5 | **Sync Status** | ❌ Missing | - Green/Red dot for device heartbeat<br>- 60-second timeout check |
| 6 | **Execution Logs & History** | ❌ Missing | - Real-time log viewer<br>- Historical audit trail<br>- Searchable history |
| 7 | **Documentation & Stealth Protocol** | ❌ Missing | - Internal documentation page<br>- ADB flush scripts<br>- Detection-proofing commands<br>- Smart limitations rules |
| 8 | **Technical Integration** | ❌ Missing | - JSON/CSV export<br>- Polling endpoint for Python workers<br>- Config generation |

---

## Critical Missing Features (Priority Order)

### High Priority 🔴
1. **Status Workflow** (Queued -> Processing -> Cooldown -> Completed -> Failed)
2. **Device Registry Page** with conflict management
3. **Live Log Viewer** with real-time updates
4. **Sync Status** indicator for devices
5. **Stealth Documentation** page

### Medium Priority 🟡
1. UX Shortcuts (Duplicate, Copy from Previous)
2. Bulk Actions
3. History/Audit Trail page
4. JSON/CSV Export

### Low Priority 🟢
1. Polling endpoint (already have Socket.IO)
2. Config generation

---

## Implementation Plan

### Phase 1: Enhanced Status Workflow (2 hours)
- Add new status states to database
- Implement status transitions
- Add cooldown timers
- Status-based UI filtering

### Phase 2: Device Registry (3 hours)
- Create devices table with enhanced fields
- Device management page
- Conflict detection logic
- Sync status indicator

### Phase 3: Live Logging (2 hours)
- Real-time log streaming via Socket.IO
- Log viewer UI
- Log storage in database
- Searchable history

### Phase 4: Stealth Documentation (1 hour)
- Documentation page with ADB scripts
- Best practices display
- Copy-to-clipboard functionality

### Phase 5: UX Enhancements (2 hours)
- Duplicate button
- Copy from Previous
- Bulk actions
- JSON/CSV export

---

## Detailed Implementation Requirements

### 1. Enhanced Status Workflow

**New Status States:**
```sql
-- Status workflow
queued → processing → cooldown → completed
                              ↘ failed
```

**Database Migration:**
```sql
ALTER TABLE campaigns ADD COLUMN status TEXT 
  DEFAULT 'queued' 
  CHECK(status IN ('queued', 'processing', 'cooldown', 'completed', 'failed'));

ALTER TABLE campaigns ADD COLUMN cooldown_until TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN queued_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN processing_at TIMESTAMP;
```

**Status Transition Logic:**
```python
def transition_status(campaign_id, new_status):
    """
    Valid transitions:
    - queued → processing
    - processing → cooldown
    - cooldown → completed
    - processing → failed
    - cooldown → failed
    """
    # Implementation
```

### 2. Device Registry

**Enhanced Devices Table:**
```sql
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    adb_device_id TEXT UNIQUE NOT NULL,
    proxy_ip TEXT,
    current_script TEXT CHECK(current_script IN ('gps', 'music', 'none')),
    sync_status TEXT DEFAULT 'unknown',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Conflict Detection:**
```python
def can_start_gps_campaign(device_id):
    """Check if device can run GPS script"""
    device = get_device(device_id)
    
    if device['current_script'] == 'music':
        return False, "Device is running Music Script"
    
    if device['sync_status'] != 'online':
        return False, "Device is offline"
    
    return True, "Device available"
```

**Sync Status Indicator:**
```python
def update_device_sync_status():
    """Update sync status based on last heartbeat"""
    devices = get_all_devices()
    
    for device in devices:
        if device['last_sync']:
            time_since_sync = datetime.now() - device['last_sync']
            if time_since_sync.total_seconds() < 60:
                status = 'online'  # Green
            else:
                status = 'offline'  # Red
        else:
            status = 'unknown'
        
        update_device(device['id'], sync_status=status)
```

### 3. Live Log Viewer

**Log Storage:**
```sql
CREATE TABLE execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level TEXT CHECK(level IN ('info', 'warning', 'error', 'debug')),
    message TEXT NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE INDEX idx_logs_campaign_timestamp ON execution_logs(campaign_id, timestamp DESC);
```

**Real-time Log Streaming:**
```python
@socketio.on('subscribe_logs')
def subscribe_logs(campaign_id):
    """Subscribe to campaign logs"""
    join_room(f'logs_{campaign_id}')

def emit_log(campaign_id, level, message):
    """Emit log to all subscribers"""
    socketio.emit(
        'log_entry',
        {
            'campaign_id': campaign_id,
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'message': message
        },
        room=f'logs_{campaign_id}'
    )
```

### 4. Stealth Documentation

**ADB Flush Scripts:**
```bash
# Clear Google Play Services cache
adb shell pm clear com.google.android.gms
adb shell pm clear com.android.location.fused
adb shell pm clear com.google.android.gsf

# Disable Wi-Fi and Bluetooth scanning
adb shell settings put global wifi_scan_always_enabled 0
adb shell settings put global bluetooth_scan_always_enabled 0

# Disable location history
adb shell settings put secure location_history_enabled 0
```

**Smart Limitations:**
```python
# Maximum trips per day per Google account
MAX_TRIPS_PER_DAY = 3

# Minimum idle time between journeys
MIN_IDLE_TIME_HOURS = 4

# Mandatory cooldown post-trip
COOLDOWN_MINUTES = 30

def validate_campaign_schedule(account_email):
    """Check if campaign respects stealth rules"""
    # Count today's trips for this account
    today_trips = count_trips_today(account_email)
    
    if today_trips >= MAX_TRIPS_PER_DAY:
        return False, f"Too many trips today ({today_trips}/{MAX_TRIPS_PER_DAY})"
    
    # Check last trip time
    last_trip = get_last_trip(account_email)
    if last_trip:
        idle_time = datetime.now() - last_trip['completed_at']
        if idle_time.total_seconds() < MIN_IDLE_TIME_HOURS * 3600:
            return False, f"Insufficient idle time ({idle_time})"
    
    return True, "Schedule validated"
```

### 5. UX Shortcuts

**Duplicate Campaign:**
```python
@app.route('/api/campaigns/<campaign_id>/duplicate', methods=['POST'])
def duplicate_campaign(campaign_id):
    """Create a copy of an existing campaign"""
    original = get_campaign(campaign_id)
    
    new_campaign = {
        'name': f"{original['name']} (Copy)",
        'device_id': original['device_id'],
        'account_mode': original['account_mode'],
        'duration_hours': original['duration_hours']
    }
    
    return create_campaign(new_campaign)
```

**Copy from Previous:**
```python
@app.route('/api/campaigns/last', methods=['GET'])
@require_auth
def get_last_campaign():
    """Get user's last campaign for quick copying"""
    user_id = g.user['user_id']
    
    campaign = get_last_campaign_by_user(user_id)
    
    if campaign:
        return jsonify({
            'name': campaign['name'],
            'device_id': campaign['device_id'],
            'account_mode': campaign['account_mode'],
            'duration_hours': campaign['duration_hours']
        })
    
    return jsonify({}), 404
```

**Bulk Actions:**
```python
@app.route('/api/campaigns/bulk', methods=['POST'])
@require_auth
def bulk_update_campaigns():
    """Bulk update campaign status"""
    data = request.get_json()
    campaign_ids = data.get('campaign_ids', [])
    action = data.get('action')
    
    results = []
    for campaign_id in campaign_ids:
        try:
            if action == 'delete':
                delete_campaign(campaign_id)
            elif action == 'start':
                start_campaign(campaign_id)
            elif action == 'stop':
                stop_campaign(campaign_id)
            
            results.append({'id': campaign_id, 'success': True})
        except Exception as e:
            results.append({'id': campaign_id, 'success': False, 'error': str(e)})
    
    return jsonify({'results': results})
```

### 6. Export & Config Generation

**JSON Export:**
```python
@app.route('/api/campaigns/export/json')
@require_auth
def export_campaigns_json():
    """Export queued campaigns as JSON"""
    user_id = g.user['user_id']
    
    campaigns = get_queued_campaigns(user_id)
    
    export_data = {
        'exported_at': datetime.now().isoformat(),
        'campaigns': [
            {
                'id': c['id'],
                'name': c['name'],
                'device_id': c['device_id'],
                'account_mode': c['account_mode'],
                'duration_hours': c['duration_hours'],
                'created_at': c['created_at']
            }
            for c in campaigns
        ]
    }
    
    response = jsonify(export_data)
    response.headers['Content-Disposition'] = 'attachment; filename=campaigns.json'
    return response
```

**CSV Export:**
```python
@app.route('/api/campaigns/export/csv')
@require_auth
def export_campaigns_csv():
    """Export queued campaigns as CSV"""
    user_id = g.user['user_id']
    campaigns = get_queued_campaigns(user_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['ID', 'Name', 'Device ID', 'Account Mode', 'Duration', 'Created At'])
    
    # Rows
    for c in campaigns:
        writer.writerow([
            c['id'],
            c['name'],
            c['device_id'],
            c['account_mode'],
            c['duration_hours'],
            c['created_at']
        ])
    
    output.seek(0)
    
    response = Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=campaigns.csv'}
    )
    return response
```

### 7. Polling Endpoint

**Worker Status Update:**
```python
@app.route('/api/worker/status', methods=['POST'])
def worker_status_update():
    """Receive status updates from Python workers"""
    data = request.get_json()
    
    device_id = data.get('device_id')
    status = data.get('status')  # online/offline
    logs = data.get('logs', [])
    campaign_id = data.get('campaign_id')
    
    # Update device sync status
    update_device(device_id, last_sync=datetime.now(), sync_status=status)
    
    # Store logs
    for log_entry in logs:
        add_execution_log(
            campaign_id,
            level=log_entry.get('level', 'info'),
            message=log_entry.get('message')
        )
        
        # Emit real-time to subscribers
        emit_log(
            campaign_id,
            level=log_entry.get('level', 'info'),
            message=log_entry.get('message')
        )
    
    return jsonify({'success': True})
```

---

## Implementation Checklist

### Phase 1: Status Workflow ⏳
- [ ] Update database schema with new status values
- [ ] Implement status transition logic
- [ ] Add cooldown timer tracking
- [ ] Update UI to show all 5 states
- [ ] Add status filtering

### Phase 2: Device Registry ⏳
- [ ] Create enhanced devices table
- [ ] Build device management page
- [ ] Implement conflict detection
- [ ] Add sync status indicator
- [ ] Device heartbeat monitoring

### Phase 3: Live Logging ⏳
- [ ] Create execution_logs table
- [ ] Implement log streaming via Socket.IO
- [ ] Build log viewer UI
- [ ] Add log search/filter
- [ ] Historical audit trail

### Phase 4: Stealth Docs ⏳
- [ ] Create documentation page
- [ ] Add ADB script display
- [ ] Include detection-proofing commands
- [ ] Smart limitations rules
- [ ] Copy-to-clipboard

### Phase 5: UX & Export ⏳
- [ ] Duplicate button
- [ ] Copy from Previous
- [ ] Bulk actions
- [ ] JSON export
- [ ] CSV export
- [ ] Config generation

---

## Estimated Timeline

- **Phase 1 (Status Workflow)**: 2 hours
- **Phase 2 (Device Registry)**: 3 hours
- **Phase 3 (Live Logging)**: 2 hours
- **Phase 4 (Stealth Docs)**: 1 hour
- **Phase 5 (UX & Export)**: 2 hours

**Total**: 10 hours for complete implementation

---

## Priority Recommendation

**Start with Phase 1 (Status Workflow)** and **Phase 2 (Device Registry)** as they are foundational for other features.

Then implement **Phase 3 (Live Logging)** for real-time monitoring.

**Phases 4-5** can be added incrementally.
