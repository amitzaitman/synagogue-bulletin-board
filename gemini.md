# Synagogue Bulletin Board System - Complete Guide

> **📝 IMPORTANT FOR DEVELOPERS:** When making ANY changes to this project, you MUST update this README to reflect those changes. This includes architecture changes, new features, bug fixes, dependency updates, or any modifications to the authentication/data flow. Keep this document as the single source of truth.

A web application for managing and displaying synagogue bulletin boards with automatic prayer time calculations (zmanim), customizable layouts, and real-time updates.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Authentication Model](#authentication-model)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Usage Instructions](#usage-instructions)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Public Viewing**: All synagogue boards are publicly accessible via friendly URLs
- **Password-Based Editing**: Simple password authentication for synagogue managers
- **Admin Management**: Single admin account to manage all synagogues (authentication ONLY for `/manage` screen)
- **Automatic Zmanim**: Real-time calculation of Jewish prayer times using KosherZmanim library
- **Hebrew Calendar**: Display Hebrew date, parsha, and holidays
- **Customizable Layout**: Add, edit, and reorder columns and events
- **Drag & Drop**: Reorder events with drag-and-drop (manual mode)
- **Flexible Time Definitions**: Absolute times, relative to other events, or relative to zmanim
- **Offline Mode**: Works offline with local storage fallback
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Friendly URLs**: Access synagogues via memorable slugs (e.g., `/kehilat-bnei-torah`)
- **Network Status**: Always-visible online/offline indicator

---

## Quick Start

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Email/Password provider (for admin account only)
3. Create Firestore database:
   - Start in test mode
   - Security rules are already configured in this project

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Create Admin Account

Create your admin account in Firebase Console:

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter your email and password
4. This will be your admin account (only used for the `/manage` screen)

### 4. Install and Run

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/`

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## Architecture Overview

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS
- **Backend:** Firebase (Firestore + Auth)
- **State Management:** React Hooks (no Redux/Zustand)
- **Routing:** React Router v6 (HashRouter)
- **Time Calculations:** @hebcal/core (KosherZmanim)

### Data Model

```
Firestore Structure:
├── synagogues/{synagogueId}
│   ├── events/{eventId}
│   │   ├── id: string
│   │   ├── name: string
│   │   ├── type: 'prayer' | 'class' | 'freeText'
│   │   ├── columnId: string
│   │   ├── order: number
│   │   ├── timeDefinition: TimeDefinition
│   │   ├── note?: string
│   │   └── isHighlighted?: boolean
│   ├── columns/{columnId}
│   │   ├── id: string
│   │   ├── title: string (e.g., "שבת קודש", "ימות החול")
│   │   ├── order: number
│   │   ├── columnType: 'shabbat' | 'weekdays' | 'moed'
│   │   └── specificDate?: string (ISO date for moed)
│   └── settings/board
│       ├── boardTitle: string
│       ├── slug: string (URL-friendly identifier)
│       ├── password: string (for editing access)
│       ├── scale: number
│       ├── colors: {...}
│       ├── location: {latitude, longitude, elevation}
│       └── shabbatCandleOffset: number
```

### Component Hierarchy

```
App.tsx (Router + Slug Resolution)
├── LandingPage (Home - shows synagogue list + management button)
├── SuperUserLogin (Admin login - redirects to /manage)
├── ManageSynagogues (Admin-only management screen)
└── BoardPage (Main board view for a synagogue)
    ├── PasswordDialog (for password-based editing)
    └── BoardView
        ├── Clock (real-time clock)
        ├── ZmanimInfo (prayer times panel)
        ├── ColumnView (multiple - one per column)
        │   └── EventItem (multiple - events in column)
        └── EditPanel (settings sidebar when editing)
            └── AddColumnDialog
```

### State Management Pattern

**Custom Hooks for Data:**
- `useEvents(synagogueId)` - Manages events with Firestore sync
- `useColumns(synagogueId)` - Manages columns with Firestore sync
- `useBoardSettings(synagogueId)` - Manages settings with Firestore sync
- `useZmanim(settings)` - Calculates prayer times
- `useLastSync()` - Tracks sync status and online/offline state

**Component-Level State:**
- Edit mode, dragging state, dialogs kept in component state
- No global state managers (Redux/Zustand)

---

## Authentication Model

### Simplified Two-Tier System

**CRITICAL DESIGN DECISION:** Authentication is **ONLY** used for the `/manage` screen. Outside of that screen, there is NO authentication or special user treatment.

#### 1. Admin (Firebase Auth)
- **When Used:** ONLY on the `/manage` screen
- **Purpose:** Create, edit, delete synagogues; change passwords and slugs
- **Login:** Via `/super-login` route
- **Sign Out:** Automatically signs out when leaving `/manage` screen
- **NO special privileges** when viewing/editing boards

#### 2. Everyone Else (Password-Based)
- **When Used:** For editing synagogue boards
- **How It Works:**
  1. Click settings button on any board (always visible)
  2. Enter password (stored in `BoardSettings`)
  3. Enter edit mode
  4. Exit edit mode when done
- **Session-Based:** Password access cleared on app close
- **No User Accounts:** No Firebase Auth involved

### Routes

```
/                    → Landing page (synagogue list + management button)
/super-login         → Admin login (redirects to /manage after auth)
/manage              → Admin management screen (auth required)
/:slugOrId           → Synagogue board view (public, password for editing)
```

### Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSuperUser() {
      return request.auth != null;
    }

    match /synagogues/{synagogueId} {
      allow read: if true;  // Anyone can view
      allow write: if isSuperUser();  // Only authenticated admin
    }

    match /synagogues/{synagogueId}/{document=**} {
      allow read: if true;
      allow write: if isSuperUser();
    }
  }
}
```

**Why This is Simple and Secure:**
- Public read (synagogue schedules are public anyway)
- Only admin can write via Firebase Auth
- Password validation happens in UI (not Firestore rules)
- No sensitive data stored

---

## Project Structure

```
src/
├── components/
│   ├── BoardView.tsx          # Main board display and edit logic
│   ├── ColumnView.tsx         # Individual column component
│   ├── EditPanel.tsx          # Settings sidebar
│   ├── LandingPage.tsx        # Home page with synagogue list
│   ├── SuperUserLogin.tsx     # Admin login
│   ├── ManageSynagogues.tsx   # Admin management screen
│   ├── Clock.tsx              # Real-time clock display
│   ├── HebrewDate.tsx         # Hebrew date component
│   ├── ZmanimInfo.tsx         # Prayer times panel
│   ├── OnlineStatus.tsx       # Network status indicator
│   └── dialogs/
│       ├── PasswordDialog.tsx      # Password entry
│       └── AddColumnDialog.tsx     # Create new column
├── hooks/
│   ├── useEvents.ts           # Events CRUD + Firestore sync
│   ├── useColumns.ts          # Columns CRUD + Firestore sync
│   ├── useBoardSettings.ts    # Settings CRUD + Firestore sync
│   ├── useZmanim.ts           # Calculate prayer times
│   ├── useLastSync.ts         # Track sync status
│   ├── useColumnEditor.ts     # Column editing operations
│   └── useAutoRefresh.ts      # Auto-refresh at midnight
├── utils/
│   ├── timeCalculations.ts    # Event time calculations
│   ├── offlineStorage.ts      # LocalStorage cache layer
│   └── dataBackup.ts          # Backup/recovery system
├── firebase.ts                # Firebase initialization
├── types.ts                   # TypeScript interfaces
└── App.tsx                    # Router + slug resolution
```

### Key Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/App.tsx` | Main router, slug resolution | Adding routes, changing navigation |
| `src/types.ts` | All TypeScript interfaces | Adding new data fields |
| `src/firebase.ts` | Firebase initialization | Changing Firebase config |
| `firestore.rules` | Database security rules | Changing access permissions |
| `src/components/BoardView.tsx` | Main board container | Core board functionality |
| `src/components/ManageSynagogues.tsx` | Admin management | Admin features |
| `src/hooks/useEvents.ts` | Events data management | Event CRUD logic |
| `src/hooks/useZmanim.ts` | Prayer time calculations | Zmanim logic |

---

## Development Guide

### Adding New Features

#### Adding a New Setting

1. Update `BoardSettings` interface in `src/types.ts`
2. Add default value in `src/hooks/useBoardSettings.ts`
3. Add UI field in `src/components/EditPanel.tsx`
4. Use the setting in relevant components

#### Adding a New Event Field

1. Update `EventItem` interface in `src/types.ts`
2. Update event rendering in `src/components/ColumnView.tsx`
3. Update edit forms/dialogs

#### Adding a New Route

1. Create component in `src/components/`
2. Add route in `src/App.tsx` (Routes section)
3. Add navigation links where needed

### Code Style Guidelines

**TypeScript:**
- Always use TypeScript, never plain JavaScript
- Define interfaces in `src/types.ts` for shared types
- Use type inference where possible

**React Patterns:**
```typescript
// ✅ Good: Functional components with hooks
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initialValue);

  useEffect(() => {
    // side effects
  }, [dependencies]);

  return <div>...</div>;
};

// ❌ Bad: Class components
class MyComponent extends React.Component { }
```

**State Management:**
```typescript
// ✅ Good: Custom hooks for data
const { events, saveEvents } = useEvents(synagogueId);

// ❌ Bad: Redux/Zustand
const dispatch = useDispatch();
```

**Styling:**
```typescript
// ✅ Good: Tailwind classes
<div className="flex items-center justify-center p-4 bg-blue-500">

// ✅ OK: Dynamic colors from settings
<div style={{ backgroundColor: settings.mainBackgroundColor }}>

// ❌ Bad: Inline styles for static values
<div style={{ padding: '16px', backgroundColor: 'blue' }}>
```

### Time Definition System

Events can have three types of time definitions:

```typescript
type TimeDefinition =
  | { mode: 'absolute', absoluteTime: string }  // e.g., "07:30"
  | { mode: 'relative', relativeEventId: string, offsetMinutes: number }
  | { mode: 'relativeToZman', zman: ZmanimKey, offsetMinutes: number }
```

**Why:** Allows flexible scheduling:
- Fixed times (e.g., "Mincha at 13:00")
- Relative to other events (e.g., "Maariv 15 minutes after Mincha")
- Relative to zmanim (e.g., "Maariv 20 minutes after sunset")

**File:** `src/utils/timeCalculations.ts`

### Testing Checklist

**As Guest:**
- [ ] View landing page with synagogue list
- [ ] Access synagogue by slug URL
- [ ] View board without password
- [ ] Click settings button (always visible)
- [ ] Enter password (test correct and incorrect)
- [ ] Edit board after password entry
- [ ] Exit edit mode
- [ ] Return home via home button

**As Admin:**
- [ ] Access management via corner button on landing page
- [ ] Login at /super-login
- [ ] Create new synagogue
- [ ] Edit synagogue (name, slug, password)
- [ ] Delete synagogue
- [ ] View synagogue from management screen
- [ ] Sign out (returns to landing page)

**Data Persistence:**
- [ ] Go offline, make changes, verify local save
- [ ] Come back online, verify sync
- [ ] Refresh page, verify data persists

---

## Usage Instructions

### For Everyone (Synagogue Viewers/Managers)

#### Viewing a Board

1. Visit the landing page
2. Click on a synagogue card
3. View the board (no authentication required)
4. Use the home button (top-left) to return

#### Editing a Board

1. On the board view, click the settings button (bottom-left, appears on mouse movement)
2. Enter the password provided by the admin
3. Make your changes:
   - Add/edit/delete events
   - Reorder events (drag & drop in manual mode)
   - Adjust settings (colors, fonts, etc.)
4. Click "סיים עריכה" (Finish editing) or "יציאה ממצב ניהול" (Exit management mode)
5. Password access cleared when you close the app

### For Admin

#### Accessing Management

1. On the landing page, click the small gear icon in the bottom-right corner
2. Login with your Firebase credentials
3. You'll be redirected to the management screen (`/manage`)

#### Managing Synagogues

**Create New Synagogue:**
1. Click "יצירת קהילה חדשה" (Create new synagogue)
2. Enter synagogue name (Hebrew)
3. Enter URL slug (English, lowercase, hyphens)
4. Set password for editing
5. Click save

**Edit Synagogue:**
1. Click the "ערוך" (Edit) button
2. Modify name, slug, or password
3. Click "שמור" (Save)

**View Synagogue:**
1. Click the "צפה" (View) button
2. Opens the synagogue board
3. Note: You are NOT logged in as admin on the board - you're just a viewer/editor like everyone else

**Delete Synagogue:**
1. Click the "מחק" (Delete) button
2. Click again to confirm
3. All data (events, columns, settings) will be deleted

**Exit Management:**
1. Click "יציאה וחזרה לדף הבית" (Exit and return home)
2. You will be signed out automatically
3. Returns to landing page

#### Sharing with Synagogue Managers

Provide them with:
- **Direct URL:** `https://your-domain.com/their-slug`
- **Password:** The password you set for their synagogue
- **Instructions:** They click settings button, enter password, edit freely

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables (from `.env.local`)
4. Deploy
5. Add deployed domain to Firebase authorized domains

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Post-Deployment

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Create admin account in Firebase Console
3. Login and set up initial synagogues

---

## Troubleshooting

### Common Issues

**"Synagogue not found" error:**
- Check if slug exists in synagogue settings
- Verify synagogueId is valid
- Check browser console for Firestore errors
- Try accessing by ID instead: `/:synagogueId`

**Can't edit board (password not working):**
- Password is case-sensitive
- Verify password is set in admin management screen
- Check browser console for errors

**Zmanim not calculating:**
- Verify location settings (latitude, longitude, elevation)
- Check browser console for calculation errors
- Ensure date/time is valid

**Offline mode not working:**
- Check localStorage quota
- Verify browser allows localStorage
- Check browser console for storage errors
- Try: `localStorage.clear()` and reload

**Management screen not loading:**
- Verify you're logged in (check Firebase Auth state)
- Check browser console for authentication errors
- Try logging out and back in

### Authentication Issues

- Ensure Firebase environment variables are correct
- Verify Firebase Authentication is enabled
- Check that domain is in Firebase authorized domains
- For admin: Verify account exists in Firebase Console

### Debug Commands

```javascript
// Check localStorage data
localStorage.getItem('luachim-offline-synagogue-ID');

// Clear all cache
localStorage.clear();

// Check Firebase auth state (only in /manage screen)
// This will be null outside /manage - that's correct!
```

---

## Performance Considerations

### Firestore Queries
- Use real-time listeners (`onSnapshot`) for live data
- Limit queries to specific synagogue only
- Queries are efficient (single synagogue at a time)

### React Rendering
- Components use `React.memo` where appropriate
- `useMemo` for expensive calculations (time calculations)
- Drag-and-drop optimized with minimal re-renders

### Offline Performance
- Aggressive localStorage caching
- Load from cache first, then sync with Firestore
- Auto-refresh every 4 hours to prevent memory leaks

---

## Important Design Decisions

### 1. Why Password-Based Access (Not User Accounts)?

**Reasoning:**
- Simpler onboarding (just share a password)
- No need for individual Firebase accounts
- One admin manages everything centrally
- Lower technical barrier for synagogue staff

**Trade-offs:**
- Less granular access control (anyone with password can edit)
- Password stored as plain text in Firestore (acceptable for public schedule data)
- No audit trail of who made changes

**When to Reconsider:**
- If synagogues need individual user tracking
- If sensitive data beyond schedules is added
- If audit logs are legally required

### 2. Why Separate Admin Authentication?

**Reasoning:**
- Clear separation between management and usage
- Admin capabilities isolated to `/manage` screen only
- Prevents accidental admin actions on board views
- Simpler mental model (authentication = management only)

**Implementation:**
- Firebase Auth used ONLY for `/manage` route
- Sign out automatically when leaving `/manage`
- No auth state checked anywhere else in the app

### 3. Why Public Read Access?

**Reasoning:**
- Synagogue schedules are public information
- Enables easy sharing via direct URLs
- No login friction for viewers
- Simplifies architecture significantly

**Security:**
- Write access requires Firebase Auth (admin only)
- Password validation in UI prevents accidental edits
- No sensitive data stored (only public schedules)

### 4. Why HashRouter (Not BrowserRouter)?

**Reasoning:**
- Works without server-side routing configuration
- Easier deployment to static hosting
- Slug resolution works client-side

**Trade-off:**
- URLs have `#` in them
- Less SEO-friendly (not a concern for this use case)

---

## Future Enhancement Ideas

Potential features to consider:

- [ ] Multi-language support (Hebrew/English toggle)
- [ ] Export to PDF/print view
- [ ] Mobile app (React Native)
- [ ] Recurring events (weekly schedules)
- [ ] Image uploads for announcements
- [ ] Analytics dashboard for admin
- [ ] Bulk import/export synagogue data
- [ ] Custom themes per synagogue
- [ ] Email notifications for schedule changes
- [ ] Integration with Google Calendar

---

## Documentation Update Protocol

**⚠️ CRITICAL FOR ALL DEVELOPERS:**

When making ANY changes to this codebase, you MUST update this README. This includes:

### What to Document

1. **Architecture Changes:**
   - New components or hooks
   - Changes to data flow
   - Modifications to routing
   - Authentication/authorization changes

2. **Feature Additions:**
   - New functionality
   - New UI components
   - New settings or configuration options

3. **Bug Fixes:**
   - If the fix changes behavior
   - If it affects how users interact with the system
   - If it requires configuration changes

4. **Dependency Updates:**
   - Major version upgrades
   - New dependencies added
   - Deprecated dependencies removed

5. **API/Schema Changes:**
   - Firestore structure modifications
   - TypeScript interface changes
   - Firebase configuration changes

### How to Document

1. **Update Relevant Sections:**
   - Find the section most relevant to your change
   - Update the text, code examples, or diagrams
   - Keep language clear and concise

2. **Update Last Modified:**
   - At the bottom of this file, update the date and version

3. **Add to Troubleshooting if Needed:**
   - If your change might cause issues, add troubleshooting tips
   - Include error messages users might see
   - Provide clear resolution steps

4. **Update Code Examples:**
   - Ensure all code examples still work
   - Update TypeScript interfaces if changed
   - Verify file paths are correct

### Example Documentation Update

```markdown
## Recent Changes

### 2025-10-30 - Simplified Authentication Model
- **Changed:** Authentication now ONLY used for `/manage` screen
- **Removed:** `user` props from BoardView and EditPanel
- **Updated:** OnlineStatus now shows for all users (not just authenticated)
- **Impact:** Admin has no special privileges when viewing/editing boards
```

---

## Version History

### v2.0 (2025-10-30) - Authentication Simplification
- Admin authentication isolated to `/manage` screen only
- Removed `user` annotations from board editing flow
- OnlineStatus component now visible to all users
- Management screen auto-signs out admin when exiting
- Landing page now shows synagogue list directly
- Small management button added to landing page corner
- Settings button now always visible for everyone

### v1.0 (Initial Release)
- Basic synagogue board system
- Multi-column layout
- Zmanim calculations
- Password-based editing
- Admin management interface

---

## Contact & Support

- **Firebase Console:** https://console.firebase.google.com
- **Repository:** (your repo URL)
- **Admin Email:** (your email)

---

**Last Updated:** 2025-10-30
**Version:** 2.0
**Documentation Status:** ✅ Current

---

## License

This project is licensed under the MIT License.