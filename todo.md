# Task: Hide "settings" and "homepage" buttons when user not active

## Objective
Hide the settings and homepage buttons when the user is inactive on screen for a certain period of time.

## Steps to implement:
- [x] Create a custom hook to detect user inactivity
- [x] Integrate the inactivity detection into BoardView component
- [x] Hide the buttons when user is inactive
- [x] Show buttons when user becomes active again
- [x] Test the implementation

## Technical Details:
- Found the buttons in BoardView.tsx at lines with HomeIcon and SettingsIcon
- Buttons are currently shown when !isEditMode with opacity-20 hover effect
- Added inactivity detection to control visibility
- Inactivity timer resets on user interaction (mouse movement, clicks, keyboard)
- Uses 3-second timeout for inactivity detection

## Implementation Summary:
✅ **COMPLETED**: 
- Created `useInactivity` hook at `src/hooks/useInactivity.ts`
- Integrated hook into BoardView component with proper import
- Modified button visibility logic to include `isActive` condition
- Buttons now hide automatically after 3 seconds of inactivity
- Buttons reappear immediately on any user interaction (mouse movement, click, keyboard, scroll, touch)

## Key Changes Made:
1. **useInactivity Hook**: Detects user activity across multiple event types
2. **BoardView Integration**: Added `const { isActive } = useInactivity({ timeoutMs: 3000 })`
3. **Button Visibility**: Changed condition from `!isEditMode` to `!isEditMode && isActive`
4. **Clean Implementation**: No breaking changes to existing functionality

## Testing Notes:
- Buttons remain visible in edit mode (unaffected)
- In non-edit mode, buttons hide after 3 seconds of inactivity
- Any user interaction immediately shows the buttons again
- Smooth transition with existing CSS animations
