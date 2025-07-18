// firebase/config.ts
// This file is commented out to bypass Firebase integration for UI preview.
// Uncomment and configure with your Firebase project details when ready.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Debug environment variables

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Check if we're in a browser environment and if Firebase config is available
const isBrowser = typeof window !== 'undefined'
const hasFirebaseConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
)

if (!hasFirebaseConfig) {
  const missingFields = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ].filter(field => !process.env[field])

  console.warn('⚠️ Missing Firebase environment variables:', missingFields)
  console.warn('Please check your .env file and restart your development server')
  
  // Don't throw error during build time - handle gracefully
}

// Initialize Firebase only if we have the config
let app: any = null
let auth: any = null
let db: any = null
let analytics: any = null

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    
    // Initialize Analytics (only in browser)
    if (isBrowser) {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app)
        }
      })
    }
    
    console.log('✅ Firebase initialized successfully and config is working')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error)
  }
} else {
  console.warn('⚠️ Firebase not initialized - missing configuration')
}

export { auth, db, analytics }
export default app
