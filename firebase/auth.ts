// firebase/auth.ts
// This file is commented out to bypass Firebase integration for UI preview.
// Uncomment and re-enable when ready to integrate Firebase authentication.

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword
} from "firebase/auth"
import { auth, db } from "./config"
import { doc, setDoc, getDoc } from 'firebase/firestore'

// Extract restaurant name from admin email
export function extractRestaurantName(email: string): string | null {
  // Expected format: RESTAURANT_NAME_admin@domain.com
  const match = email.match(/^(.+?)_admin@/)
  return match ? match[1].replace(/[^a-zA-Z0-9_]/g, '').toUpperCase() : null
}

// Validate admin email format
export function isValidAdminEmail(email: string): boolean {
  return /_admin@/.test(email)
}

// Check if Firebase is properly initialized
function checkFirebaseInit() {
  if (!auth || !db) {
    throw new Error('Firebase is not properly initialized. Please check your environment variables.')
  }
}

// Create admin account
export async function createAdminAccount(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    checkFirebaseInit()
    
    if (!isValidAdminEmail(email)) {
      return { success: false, error: 'Email must be in format: RESTAURANT_NAME_admin@gmail.com' }
    }

    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Extract restaurant name
    const restaurantName = extractRestaurantName(email)
    if (!restaurantName) {
      return { success: false, error: 'Could not extract restaurant name from email' }
    }

    // Create admin profile in Firestore
    await setDoc(doc(db, 'admins', user.uid), {
      email: email,
      restaurantName: restaurantName,
      createdAt: new Date(),
      role: 'admin'
    })

    console.log('Admin account created successfully:', { email, restaurantName })
    return { success: true }
  } catch (error: any) {
    console.error('Firebase Create Account Error:', error)
    
    if (error.message?.includes('Firebase is not properly initialized')) {
      return { success: false, error: 'Configuration error. Please refresh the page and try again.' }
    }
    
    let errorMessage = 'Failed to create account. Please try again.'
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists.'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use at least 6 characters.'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.'
    }
    
    return { success: false, error: errorMessage }
  }
}

// Sign in with Firebase Auth
export async function firebaseSignIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    checkFirebaseInit()
    
    if (!isValidAdminEmail(email)) {
      return { success: false, error: 'Please use an admin email (format: RESTAURANT_NAME_admin@gmail.com)' }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    console.log('Firebase sign-in successful:', user.email)
    return { success: true }
  } catch (error: any) {
    console.error('Firebase Sign-in Error:', error)
    
    if (error.message?.includes('Firebase is not properly initialized')) {
      return { success: false, error: 'Configuration error. Please refresh the page and try again.' }
    }
    
    let errorMessage = 'Login failed. Please check your credentials.'
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please create an admin account first.'
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.'
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid credentials. Please check your email and password, or create an admin account.'
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.'
    }
    
    return { success: false, error: errorMessage }
  }
}

// Sign out
export async function firebaseSignOut(): Promise<void> {
  try {
    checkFirebaseInit()
    await signOut(auth)
    console.log('User signed out successfully')
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Auth state change listener
export function onAuthStateChange(callback: (user: User | null, restaurantName: string | null) => void) {
  if (!auth) {
    console.warn('Firebase auth not initialized, cannot listen to auth state changes')
    callback(null, null)
    return () => {} // Return empty cleanup function
  }
  
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Extract restaurant name from email
      const restaurantName = extractRestaurantName(user.email || '')
      callback(user, restaurantName)
    } else {
      callback(null, null)
    }
  })
}
