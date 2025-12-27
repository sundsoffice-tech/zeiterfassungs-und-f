# Time Picker Component - Implementation Documentation

## Overview
A comprehensive time input component with advanced features for the Zeiterfassung time tracking application.

## Features Implemented

### 1. "Jetzt" (Now) Button
- **Location**: Clock icon button next to input
- **Functionality**: Instantly fills the time input with the current time in HH:MM format
- **Timezone**: Automatically uses the browser's local timezone via `date-fns` format function

### 2. Time Adjustment Shortcuts
Four quick-adjustment buttons:
- **-30**: Subtract 30 minutes from current time
- **-15**: Subtract 15 minutes from current time
- **+15**: Add 15 minutes to current time
- **+30**: Add 30 minutes to current time

### 3. Inline Start < End Validation
- **Real-time validation**: Checks time relationships as user types
- **Visual feedback**: Red border and error icon when invalid
- **Error messages**: Clear German-language messages
  - "Endzeit muss nach der Startzeit liegen" (End time must be after start time)
  - "Startzeit muss vor der Endzeit liegen" (Start time must be before end time)
- **Callback support**: `onValidationChange` prop notifies parent of validation state

### 4. Timezone Handling
- **Browser-local**: All times captured in user's local timezone
- **date-fns integration**: Uses `format()` function with HH:mm pattern
- **Consistent**: All time operations respect local timezone

### 5. Additional UX Features
- **Monospace font**: Clear, aligned time display (font-mono class)
- **Clock icon indicator**: Visual cue for time input field
- **Format validation**: Enforces HH:MM format (00:00 - 23:59)
- **Auto-formatting**: Adds leading zeros on blur
- **Keyboard friendly**: Standard text input with validation

## Component API

```typescript
interface TimePickerProps {
  value: string                    // Current time value (HH:MM format)
  onChange: (value: string) => void // Callback when time changes
  label?: string                   // Optional label text
  id?: string                      // Input element ID
  error?: string                   // External error message
  disabled?: boolean               // Disable the input
  showShortcuts?: boolean          // Show/hide shortcut buttons (default: true)
  compareWith?: string             // Time to compare against
  compareType?: 'start' | 'end'    // Comparison type for validation
  onValidationChange?: (isValid: boolean, message?: string) => void
}
```

## Usage Examples

### Basic Usage
```tsx
<TimePicker
  label="Startzeit *"
  value={startTime}
  onChange={setStartTime}
/>
```

### With Validation
```tsx
<TimePicker
  label="Startzeit *"
  value={startTime}
  onChange={setStartTime}
  compareWith={endTime}
  compareType="start"
  onValidationChange={(valid) => setIsValid(valid)}
/>

<TimePicker
  label="Endzeit *"
  value={endTime}
  onChange={setEndTime}
  compareWith={startTime}
  compareType="end"
  onValidationChange={(valid) => setIsValid(valid)}
/>
```

### Without Shortcuts
```tsx
<TimePicker
  label="Zeit"
  value={time}
  onChange={setTime}
  showShortcuts={false}
/>
```

## Files Created

### `/src/components/TimePicker.tsx`
Core reusable time picker component with all features.

### `/src/components/TimePickerDemo.tsx`
Comprehensive demo showcasing:
- Manual time entry form
- Start/end time validation
- Break time calculation
- Feature documentation
- Usage examples
- Validation rules explanation

## Integration Points

### Current Usage
- Added to main App.tsx as "Time Picker" tab
- Visible as first tab on app load
- Fully functional demo with live calculations

### Suggested Integration
1. **QuickTimeEntry Component**: Replace basic time inputs
2. **TodayScreen Component**: Use for manual time adjustments
3. **WeekScreen Component**: Apply to cell-level time editing
4. **RepairModeScreen**: Use for time correction workflows

## Technical Details

### Dependencies
- **@/components/ui**: shadcn button, input, label components
- **@phosphor-icons/react**: Clock and Warning icons
- **date-fns**: Time formatting and manipulation
- **@/lib/utils**: cn() utility for class merging

### State Management
- Internal validation state for error display
- Synchronizes with external error prop
- Notifies parent via onValidationChange callback

### Time Parsing & Validation
- Regex pattern: `^(\d{1,2}):(\d{2})$`
- Range checks: hours 0-23, minutes 0-59
- Comparison logic: converts to minutes for accurate comparison
- Handles midnight rollover edge cases

### Styling
- Tailwind CSS utility classes
- Monospace font for time display
- Destructive color scheme for errors
- Consistent with shadcn design system

## PRD Documentation
Enhanced Time Picker Component section added to PRD.md documenting:
- Functionality and purpose
- User interaction flow
- Success criteria
- Integration points

## Future Enhancements (Suggested)
1. ~~Time picker with "Now" button~~ ✅
2. ~~±15/±30 minute shortcuts~~ ✅
3. ~~Inline validation for start < end~~ ✅
4. ~~Timezone-aware time handling~~ ✅
5. Optional: Time range picker (combined start/end)
6. Optional: Custom increment values (5, 10, 15, 30, 60 min)
7. Optional: Time presets (09:00, 12:00, 17:00, etc.)
8. Optional: Duration input mode (instead of end time)
9. Optional: 24h/12h format toggle
10. Optional: Keyboard navigation (arrow keys for adjustments)

## Testing Scenarios

### Manual Testing Checklist
- [x] "Jetzt" button fills current time
- [x] +15/+30 buttons increment correctly
- [x] -15/-30 buttons decrement correctly
- [x] Time adjustment wraps at midnight
- [x] Start time validation shows error when > end time
- [x] End time validation shows error when < start time
- [x] Validation clears when times are valid
- [x] Format validation enforces HH:MM
- [x] Auto-formatting adds leading zeros
- [x] Disabled state prevents all interactions
- [x] Monospace font displays correctly
- [x] Duration calculation updates in real-time
- [x] Break time subtraction works correctly

## Accessibility
- ✅ Label properly associated with input (htmlFor/id)
- ✅ Error messages announced (text visible to screen readers)
- ✅ Keyboard accessible (all buttons and input focusable)
- ✅ Clear visual feedback for states (error, disabled, focused)
- ✅ Semantic HTML (label, input, button elements)
- ✅ ARIA attributes implicit via semantic HTML

## Performance
- Minimal re-renders via useState hooks
- Efficient comparison logic (converts to minutes once)
- No external API calls or heavy computations
- Lightweight bundle size (uses existing dependencies)

## Browser Compatibility
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Uses standard JavaScript Date API
- ✅ date-fns handles timezone consistently
- ✅ CSS Grid and Flexbox for layout
- ✅ No browser-specific hacks required
