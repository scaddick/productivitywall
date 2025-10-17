# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "team-standup-wall")
4. Disable Google Analytics (optional)
5. Click "Create project"

## 2. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## 3. Get Firebase Configuration

1. In your Firebase project, click the gear icon → "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>`
4. Register your app with a nickname (e.g., "team-standup-web")
5. Copy the configuration object

## 4. Configure Your App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

## 5. Set up Firestore Security Rules (Optional)

For development, you can use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, implement proper authentication and security rules.

## 6. Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app and try adding a team member or note
3. Check your Firestore console to see if data appears

## 7. Deploy to Firebase Hosting (Optional)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your existing project
   - Set public directory to "dist"
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Data Structure

The app creates the following Firestore collections:

```
teams/{teamId}/
├── members/           # Team members
├── standupNotes/      # Daily standup notes
├── usefulLinks/       # Useful links
├── calendarEvents/    # Calendar events
├── supportRota/       # Support rotation
└── retrospectives/
    └── current/
        ├── tickets/   # Retro board tickets
        ├── actions/   # Action items
        ├── votes/     # Anonymous votes
        └── settings/  # Retro settings (mantra, background)
```

## Troubleshooting

- **Permission denied**: Check Firestore security rules
- **Module not found**: Ensure Firebase is installed: `npm install firebase`
- **Environment variables not loading**: Restart your dev server after changing `.env`
- **Data not syncing**: Check browser console for Firebase errors