#!/usr/bin/env node

// Simple script to check if Firebase environment variables are loaded
console.log('🔍 Checking Firebase Environment Variables...\n')

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

console.log('Environment Variables Status:')
console.log('=' .repeat(50))

requiredVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const displayValue = value 
    ? `${value.substring(0, 10)}...` 
    : 'MISSING'
  
  console.log(`${status} ${varName}: ${displayValue}`)
  
  if (!value) allGood = false
})

console.log('=' .repeat(50))

if (allGood) {
  console.log('🎉 All Firebase environment variables are set!')
} else {
  console.log('⚠️  Some Firebase environment variables are missing.')
  console.log('\n📋 To fix this:')
  console.log('1. Make sure your .env file is in the project root')
  console.log('2. Restart your development server')
  console.log('3. Check that .env is not in .gitignore')
}

console.log('\n📁 Current working directory:', process.cwd())
console.log('📝 Looking for .env file at:', `${process.cwd()}/.env`)

// Check if .env file exists
const fs = require('fs')
const path = require('path')
const envPath = path.join(process.cwd(), '.env')

if (fs.existsSync(envPath)) {
  console.log('✅ .env file found')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const firebaseLines = envContent.split('\n').filter(line => 
    line.startsWith('NEXT_PUBLIC_FIREBASE')
  )
  console.log(`📊 Found ${firebaseLines.length} Firebase variables in .env`)
} else {
  console.log('❌ .env file not found!')
} 