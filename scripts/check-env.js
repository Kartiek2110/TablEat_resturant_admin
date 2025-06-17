#!/usr/bin/env node

// Simple script to check if Firebase environment variables are loaded

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
]

let allGood = true


requiredVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const displayValue = value 
    ? `${value.substring(0, 10)}...` 
    : 'MISSING'
  

  
  if (!value) allGood = false
})



if (allGood) {
 
} else {
 
 
}



// Check if .env file exists
const fs = require('fs')
const path = require('path')
const envPath = path.join(process.cwd(), '.env')

if (fs.existsSync(envPath)) {
 
  const envContent = fs.readFileSync(envPath, 'utf8')
  const firebaseLines = envContent.split('\n').filter(line => 
    line.startsWith('NEXT_PUBLIC_FIREBASE')
  )
 
} else {
 
} 