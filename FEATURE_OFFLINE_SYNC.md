# Offline Sync & Mobile Capabilities Feature

## Overview

Complete offline-first time tracking system with automatic synchronization, intelligent conflict resolution, DSGVO-compliant GPS tracking, rich attachment support, and battery-optimized background timers. This feature ensures seamless time tracking anywhere without internet connectivity, with automatic sync when connection is restored.

## Core Capabilities

### 1. Offline-First Architecture

**Queue-Based Synchronization**
- All changes (time entries, mileage, projects, tasks) queued locally when offline
- Priority-based queue processing (critical entries sync first)
- Configurable batch size (default: 10 items per batch)
- Automatic retry mechanism with exponential backoff
- Real-time queue status monitoring

**Network State Management**
- Continuous online/offline detection using `navigator.onLine`
- Event listeners for network state changes
- Automatic sync trigger on network restoration (configurable)
- Visual indicators throughout UI showing connection status
- Graceful feature degradation when offline

### 2. Conflict Resolution System

Four intelligent strategies for handling conflicts between local and server data:

**Newest Wins (Default)**
- Compares timestamps of local and server versions
- Automatically keeps the most recently modified version
- Best for single-user scenarios or when latest data is most accurate
- Transparent operation with optional conflict notification

**Local Wins**
- Always prioritizes device changes over server
- Useful for field workers with authoritative local data
- Ensures user's work is never overwritten
- May require manual reconciliation in multi-user scenarios

**Server Wins**
- Always accepts server version as authoritative
- Useful when central system is single source of truth
- Discards conflicting local changes
- Provides consistency across all devices

**Manual Resolution**
- Presents conflict UI showing both versions side-by-side
- Highlights conflicting fields
- User reviews and selects preferred version for each field
- Creates audit trail of manual conflict resolutions
- Most flexible but requires user intervention

**Conflict Detection**
- Compares key fields: startTime, endTime, duration, projectId, taskId, description, billable
- Generates list of conflicting fields
- Stores conflict metadata for review
- Links related conflicts for batch resolution

### 3. GPS Location Tracking (DSGVO-Compliant)

**Privacy-First Design**
- Explicit opt-in required for location tracking
- Clear privacy notice explaining data usage and storage
- No automatic transmission of location data
- User controls when location is captured and shared
- Full compliance with GDPR Article 6 (explicit consent)

**Location Capture**
- Latitude, longitude with 6 decimal precision
- Accuracy indicator (±meters)
- Timestamp for each capture
- Optional reverse geocoding for human-readable addresses
- Battery-efficient location API usage

**Use Cases**
- Field worker documentation
- Construction site tracking
- Travel expense verification
- Client visit validation
- Distance calculation for mileage entries

**Data Storage**
- Stored locally encrypted
- Transmitted only with explicit user consent
- Can be deleted before sync
- Optional attachment to time entries
- Device-specific location history

### 4. Attachments & Rich Media

**Supported Formats**
- **Photos**: JPG, PNG, HEIC (auto-compressed)
- **Receipts**: PDF, scanned images
- **Documents**: DOCX, TXT, MD
- **Audio**: MP3, WAV, M4A (voice notes)

**Processing Pipeline**
1. File selection via standard file input
2. Client-side validation (format, size)
3. Base64 encoding for offline storage
4. Automatic thumbnail generation for images (200px max)
5. Compression for photos (JPEG quality 70%)
6. Upload queue management
7. Progress tracking per file
8. Server upload when online

**Features**
- Multiple attachments per time entry (unlimited)
- 10MB max file size per attachment
- Client-side thumbnail previews
- Upload status tracking (pending/uploading/uploaded/error)
- Encrypted local storage
- Batch upload with progress
- Retry failed uploads

**Use Cases**
- Receipt documentation for expenses
- Photo evidence of work completed
- Client signatures or approvals
- Voice notes for context
- Project documentation

### 5. Background Timer Optimization

**Battery-Efficient Design**
- Minimal CPU usage during timer operation
- Wake Lock API prevents screen timeout
- Efficient localStorage-based state management
- Heartbeat system with 30-second intervals
- No continuous network requests

**Timer Persistence**
- State stored in localStorage
- Automatic restoration after app restart
- Survives browser tab closure
- Maintains accuracy across sessions
- Device ID for multi-device scenarios

**Heartbeat System**
- Regular health checks every 30 seconds
- Verifies timer integrity
- Logs elapsed time for debugging
- Detects timer drift
- Automatic recovery from errors

**Wake Lock Integration**
- Prevents screen from turning off during active timer
- Automatic release when timer stopped
- Fallback for unsupported browsers
- User notification of wake lock status

**Accuracy Management**
- Elapsed time calculated from start timestamp (not incremental)
- Prevents drift from missed intervals
- Handles pause/resume correctly
- Accounts for system clock changes
- Millisecond precision

## Technical Implementation

### Core Classes

**OfflineSyncManager**
```typescript
class OfflineSyncManager {
  private syncQueue: SyncQueueItem[]
  private syncConfig: SyncConfig
  private isOnline: boolean
  private isSyncing: boolean
  private deviceId: string
  
  // Queue management
  addToQueue(item: SyncQueueItem): void
  syncNow(): Promise<SyncResult>
  getQueueStatus(): QueueStatus
  
  // Configuration
  updateConfig(config: Partial<SyncConfig>): void
  
  // Device management
  getDeviceId(): string
  isDeviceOnline(): boolean
}
```

**BackgroundTimerManager**
```typescript
class BackgroundTimerManager {
  private timerId?: number
  private heartbeatId?: number
  private wakeLockSentinel?: any
  
  // Timer control
  startTimer(state: BackgroundTimerState): Promise<void>
  stopTimer(): void
  pauseTimer(): void
  resumeTimer(): void
  
  // State management
  getTimerState(): BackgroundTimerState | null
  isRunning(): boolean
  
  // Wake lock
  private requestWakeLock(): Promise<void>
  private releaseWakeLock(): void
}
```

### React Hooks

**useOfflineSync()**
```typescript
const {
  isOnline,           // Current network status
  isSyncing,          // Sync in progress
  queueStatus,        // { total, pending, conflicts }
  syncNow,            // Manual sync trigger
  addToQueue,         // Add item to sync queue
  getDeviceId,        // Get unique device ID
  createOfflineData   // Wrap data with offline metadata
} = useOfflineSync()
```

**useGPS()**
```typescript
const {
  location,           // Current GPSLocation
  isTracking,         // Tracking active
  hasPermission,      // Permission granted
  error,              // Error message
  requestPermission,  // Request GPS permission
  startTracking,      // Begin continuous tracking
  stopTracking,       // Stop tracking
  getCurrentGPS       // Get current location once
} = useGPS()
```

**useAttachments()**
```typescript
const {
  attachments,        // Array of Attachment objects
  isProcessing,       // Processing in progress
  addAttachment,      // Add single file
  addAttachments,     // Add multiple files
  removeAttachment,   // Remove by ID
  clearAttachments,   // Remove all
  getAttachment       // Get by ID
} = useAttachments()
```

**useBackgroundTimer()**
```typescript
const {
  timerState,         // Current BackgroundTimerState
  elapsedSeconds,     // Seconds elapsed
  isRunning,          // Timer active
  startTimer,         // Start new timer
  stopTimer,          // Stop timer
  pauseTimer,         // Pause timer
  resumeTimer         // Resume paused timer
} = useBackgroundTimer()
```

### Data Structures

**SyncQueueItem**
```typescript
interface SyncQueueItem {
  id: string                    // Unique queue item ID
  entityType: EntityType        // timeEntry, mileageEntry, etc.
  entityId: string              // Entity's ID
  operation: Operation          // create, update, delete
  data: any                     // Full entity data
  timestamp: string             // When queued
  retryCount: number            // Retry attempts
  priority: number              // 1-10, higher syncs first
  conflictResolution?: ConflictResolution
}
```

**OfflineMetadata**
```typescript
interface OfflineMetadata {
  offlineId: string             // Unique offline ID
  syncStatus: SyncStatus        // synced, pending, conflict, error
  lastSyncAttempt?: string      // Last sync timestamp
  syncError?: string            // Error message if failed
  conflictData?: ConflictData   // Conflict details
  deviceId: string              // Device identifier
  offlineCreatedAt: string      // Created timestamp
  offlineUpdatedAt: string      // Updated timestamp
}
```

**GPSLocation**
```typescript
interface GPSLocation {
  latitude: number              // Decimal degrees
  longitude: number             // Decimal degrees
  accuracy?: number             // Accuracy in meters
  timestamp: string             // Capture time
  address?: string              // Reverse geocoded address
}
```

**Attachment**
```typescript
interface Attachment {
  id: string                    // Unique attachment ID
  type: AttachmentType          // photo, receipt, document, audio
  name: string                  // Original filename
  mimeType: string              // MIME type
  size: number                  // Bytes
  url?: string                  // Server URL (after upload)
  base64Data?: string           // Base64 encoded data
  uploadStatus: UploadStatus    // pending, uploading, uploaded, error
  uploadedAt?: string           // Upload timestamp
  thumbnail?: string            // Base64 thumbnail (images only)
}
```

## User Interface

### Offline/Sync Screen

**Connection Status Card**
- Online/Offline badge with color coding (green/gray)
- Device ID display (truncated with copy button)
- Last synchronization timestamp (relative time)
- Sync queue progress bar
- Pending, synced, and conflict counts
- Large "Jetzt synchronisieren" button
- Disabled when offline or queue empty
- Spinner animation during sync

**GPS Tracking Card**
- Toggle switch for location tracking
- Permission status indicator
- Current coordinates display (6 decimal places)
- Accuracy indicator (±meters)
- DSGVO privacy notice (collapsible)
- Error alerts when permission denied
- Last location timestamp

**Sync Settings Card**
- Auto-sync toggle with description
- Sync interval display (seconds)
- Sync on network restore toggle
- Conflict resolution strategy selector:
  - Radio buttons for each strategy
  - Strategy name and description for each
  - Visual highlighting of selected strategy
  - Inline help text explaining implications

**Background Timer Card**
- Status grid showing:
  - Wake Lock (active/inactive)
  - Auto-Restoration (enabled)
  - Heartbeat System (30s interval)
  - Offline Storage (enabled)
- Feature descriptions
- Battery optimization notice
- Timer reliability guarantees

**Attachments Card**
- Supported formats grid (Photos, Receipts, Documents)
- File size limit (10 MB)
- Privacy & security section:
  - Encrypted local storage
  - Upload on explicit confirmation
  - Automatic compression
  - Thumbnail generation
- Upload queue status

### Visual Indicators

**Connection Badge**
- Header: Small badge showing Online/Offline
- Color: Green (online) / Gray (offline)
- Icon: CloudArrowUp / CloudSlash
- Tooltip: Last sync time

**Queue Status**
- Number badge on Offline/Sync tab
- Shows pending count
- Pulses when items queued
- Disappears when empty

**Sync Progress**
- Progress bar in connection card
- Percentage complete
- Item counts (synced/total)
- Error count if applicable

## Configuration

### Sync Settings

**Default Configuration**
```typescript
{
  autoSyncEnabled: true,
  syncInterval: 30000,          // 30 seconds
  conflictResolution: ConflictResolution.NEWEST_WINS,
  syncOnNetworkRestore: true,
  maxRetries: 3,
  batchSize: 10
}
```

**Customization**
- All settings stored in localStorage
- Persisted across sessions
- UI for easy modification
- Validation on save
- Reset to defaults option

### Privacy Settings

**GPS Tracking**
- Default: Disabled
- Requires explicit opt-in
- Can be disabled anytime
- Permission revocation handled gracefully
- Clear data usage explanation

**Attachments**
- Automatic processing when added
- Upload only on explicit action
- Option to delete before sync
- Encryption always enabled
- No automatic transmission

## Usage Examples

### Basic Offline Time Tracking

```typescript
// User goes offline
// Timer continues running
const { isOnline, addToQueue } = useOfflineSync()

// User stops timer
const entry = {
  employeeId: 'emp-1',
  projectId: 'proj-1',
  startTime: '2024-01-15T09:00:00Z',
  endTime: '2024-01-15T12:00:00Z',
  duration: 180
}

// Entry queued automatically
addToQueue('timeEntry', entry.id, 'create', entry, 10)

// User comes back online
// Auto-sync triggers if enabled
// Or manual sync
await syncNow()
```

### GPS-Tagged Entry

```typescript
const { location, requestPermission, getCurrentGPS } = useGPS()

// Request permission first time
await requestPermission()

// Capture location
const gps = await getCurrentGPS()

// Add to time entry
const entry = {
  ...timeEntryData,
  location: gps
}

// Queue for sync
addToQueue('timeEntry', entry.id, 'create', entry, 10)
```

### Attachment Upload

```typescript
const { addAttachments } = useAttachments()

// User selects files
const files = fileInputEvent.target.files

// Process and queue
const attachments = await addAttachments(Array.from(files))

// Attachments stored locally
// Added to time entry
const entry = {
  ...timeEntryData,
  attachments: attachments.map(a => a.id)
}

// Sync when online
await syncNow()
```

### Background Timer

```typescript
const { startTimer, stopTimer, elapsedSeconds } = useBackgroundTimer()

// Start timer
await startTimer(projectId, taskId, employeeId, true) // battery optimized

// Timer runs in background
// Survives app close/reopen
// Accurate elapsed time

// Stop timer
stopTimer()

// Create time entry from elapsed time
const duration = Math.floor(elapsedSeconds / 60)
```

## Best Practices

### Offline Development

1. **Always Queue Changes**: Never assume online connectivity
2. **Optimistic Updates**: Update UI immediately, sync in background
3. **Clear Feedback**: Show sync status clearly to users
4. **Graceful Degradation**: Disable online-only features when offline
5. **Local Validation**: Validate data before queuing

### Conflict Prevention

1. **Choose Right Strategy**: Match strategy to use case
2. **Timestamp Accuracy**: Use server time for consistency
3. **Minimize Conflicts**: Sync frequently when online
4. **Clear Communication**: Notify users of conflict resolution
5. **Audit Trail**: Log all conflict resolutions

### GPS Usage

1. **Request Minimally**: Only when needed for feature
2. **Clear Purpose**: Explain why location is needed
3. **Easy Opt-Out**: Allow disabling at any time
4. **Battery Awareness**: Use low-accuracy mode when possible
5. **Privacy First**: Never transmit without consent

### Attachment Handling

1. **Validate Early**: Check format and size before processing
2. **Compress Images**: Reduce file size automatically
3. **Generate Thumbnails**: For quick preview
4. **Queue Uploads**: Batch when possible
5. **Retry Failed**: Automatic retry with backoff

### Timer Optimization

1. **Use Wake Lock**: Prevent interruption during active timer
2. **Heartbeat System**: Regular health checks
3. **Timestamp-Based**: Calculate from start time, not incremental
4. **Persist State**: Save after every change
5. **Handle Crashes**: Restore state automatically

## Security Considerations

### Data Protection

- All offline data encrypted in localStorage
- Attachments base64 encoded
- GPS data requires explicit consent
- Device ID is non-personal (random UUID)
- No automatic data transmission

### Network Security

- HTTPS required for all sync operations
- HMAC signatures for webhook payloads
- Token-based authentication
- Rate limiting on sync endpoints
- Validation of all synced data

### Privacy Compliance

- GDPR Article 6 compliance (explicit consent for GPS)
- Right to deletion (clear all offline data)
- Data minimization (collect only necessary)
- Transparency (clear privacy notices)
- User control (easy opt-out of all features)

## Performance Optimization

### Offline Storage

- IndexedDB for large attachments (future enhancement)
- localStorage for queue and metadata
- Compression for photos (JPEG quality 70%)
- Thumbnail generation (200px max)
- Periodic cleanup of old sync items

### Sync Efficiency

- Batch processing (10 items default)
- Priority queue (critical items first)
- Exponential backoff for retries
- Debouncing for frequent changes
- Network-aware batch sizing

### Battery Conservation

- Wake Lock only during active timer
- Infrequent heartbeat (30 seconds)
- Efficient localStorage access
- Minimal UI updates
- No polling when offline

## Troubleshooting

### Sync Issues

**Problem**: Items stuck in queue
- Check network connectivity
- Verify sync enabled
- Check max retries not exceeded
- Review error logs
- Try manual sync

**Problem**: Conflicts not resolving
- Check conflict resolution strategy
- Verify conflicting fields
- Try manual resolution
- Check audit trail
- Reset queue if needed

### GPS Issues

**Problem**: Location not updating
- Check permission granted
- Verify GPS signal
- Check battery settings
- Restart tracking
- Check browser support

**Problem**: Inaccurate location
- Wait for better signal
- Check accuracy value
- Use high-accuracy mode
- Move to open area
- Verify device GPS working

### Timer Issues

**Problem**: Timer not persisting
- Check localStorage available
- Verify no quota exceeded
- Check browser storage settings
- Review console errors
- Try clearing cache

**Problem**: Timer inaccurate
- Verify system clock correct
- Check heartbeat running
- Review elapsed calculation
- Restart timer if needed
- Check for clock changes

## Future Enhancements

### Planned Features

1. **IndexedDB Migration**: Move large data to IndexedDB for better performance
2. **Partial Sync**: Sync only changed fields, not entire entities
3. **Conflict History**: UI to review past conflict resolutions
4. **Offline Analytics**: Track offline usage patterns
5. **Smart Sync Scheduling**: Optimize sync timing based on usage patterns
6. **Background Sync API**: Use service workers for true background sync
7. **Progressive Web App**: Full PWA with install prompt and offline support
8. **Peer-to-Peer Sync**: Sync between devices directly without server
9. **Compressed Sync Protocol**: Reduce bandwidth with compression
10. **Predictive Preloading**: Preload likely-needed data when online

### Research Areas

- **Machine Learning**: Predict conflicts before they occur
- **Mesh Networking**: Multi-device collaboration offline
- **Edge Computing**: Local server for team offline sync
- **Differential Sync**: More efficient sync algorithms
- **Blockchain**: Immutable audit trail with decentralization

## Conclusion

The Offline Sync & Mobile Capabilities feature provides a world-class, production-ready solution for time tracking in any environment. With intelligent conflict resolution, DSGVO-compliant location tracking, rich attachment support, and battery-optimized background timers, users can work confidently anywhere without compromise.

The system prioritizes user experience, data integrity, privacy, and performance, making it suitable for field workers, remote teams, construction sites, and any scenario where internet connectivity is unreliable or unavailable.
