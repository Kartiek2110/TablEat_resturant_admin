# 🔧 Troubleshooting Guide

This guide helps you resolve common issues you might encounter with the Restaurant Admin System.

## 🔥 Firebase Authentication Issues

### Issue: `auth/invalid-credential` Error

**Symptoms:**
- Login fails with "Invalid credentials" error
- Console shows `Firebase: Error (auth/invalid-credential)`

**Solutions:**

1. **Create Your First Admin Account**
   - Visit `/setup` in your browser
   - Create an admin account with format: `RESTAURANT_NAME_admin@gmail.com`
   - Use a strong password (6+ characters)

2. **Verify Firebase Configuration**
   - Check your `.env` file has all required variables
   - Ensure Firebase project has Authentication enabled
   - Verify your Firebase project is active

3. **Check Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Navigate to Authentication > Users
   - Verify your admin account exists

### Issue: Missing Firebase Environment Variables

**Symptoms:**
- Console error: "Missing Firebase configuration"
- App fails to start

**Solution:**
Create `.env` file in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## ⚡ Hydration Mismatch Issues

### Issue: Hydration Mismatch Warning

**Symptoms:**
- Console warning about hydration mismatch
- Differences between server and client rendering
- Classes like `vsc-initialized` appearing

**Solutions:**

1. **Browser Extensions**
   - Disable browser extensions temporarily
   - Common culprits: VS Code extensions, Grammarly, ad blockers

2. **Clear Browser Cache**
   ```bash
   # Clear browser cache and cookies
   # Or use incognito/private browsing mode
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🔐 Authentication Flow Issues

### Issue: Redirect Loop on Login

**Symptoms:**
- Infinite redirects between login and dashboard
- User appears logged in but keeps redirecting

**Solutions:**

1. **Clear Local Storage**
   ```javascript
   // Open browser console and run:
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Check Auth State**
   - Ensure user has valid admin email format
   - Verify Firebase user exists

### Issue: Cannot Access Dashboard

**Symptoms:**
- Redirected to login even after successful login
- Authentication state not persisting

**Solutions:**

1. **Verify Admin Email Format**
   - Must contain `_admin@` in the email
   - Example: `MY_RESTAURANT_admin@gmail.com`

2. **Check Browser Network Tab**
   - Look for failed Firebase requests
   - Verify API calls are completing

## 🏗️ Setup and Development Issues

### Issue: npm/yarn Install Failures

**Symptoms:**
- Package installation errors
- Missing dependencies

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with yarn
rm -rf node_modules yarn.lock
yarn install
```

### Issue: Next.js Build Errors

**Symptoms:**
- Build fails with TypeScript errors
- Missing type definitions

**Solution:**
```bash
# Install missing types
npm install --save-dev @types/node @types/react @types/react-dom

# Clear Next.js cache
rm -rf .next
npm run build
```

## 🔍 Debugging Steps

### 1. Check Browser Console
- Open Developer Tools (F12)
- Look for error messages in Console tab
- Check Network tab for failed requests

### 2. Verify Environment Variables
```bash
# Check if environment variables are loaded
echo $NEXT_PUBLIC_FIREBASE_API_KEY
```

### 3. Test Firebase Connection
- Visit Firebase Console
- Check Authentication > Users tab
- Verify Firestore rules allow read/write

### 4. Test in Incognito Mode
- Open browser in private/incognito mode
- Try logging in without extensions

## 📞 Getting Help

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `auth/invalid-credential` | Wrong email/password | Check credentials or create account |
| `auth/user-not-found` | Account doesn't exist | Create admin account at `/setup` |
| `auth/too-many-requests` | Rate limited | Wait 15 minutes and try again |
| `auth/network-request-failed` | Network issue | Check internet connection |

### Quick Fixes Checklist

- [ ] Firebase environment variables are set
- [ ] Admin email follows correct format
- [ ] Firebase Authentication is enabled
- [ ] Browser extensions are disabled
- [ ] Browser cache is cleared
- [ ] Development server is restarted

### Still Need Help?

1. **Check Firebase Console Logs**
   - Firebase Console > Functions > Logs
   - Look for specific error messages

2. **Enable Detailed Logging**
   ```javascript
   // Add to firebase/config.ts for debugging
   import { connectAuthEmulator } from 'firebase/auth'
   if (process.env.NODE_ENV === 'development') {
     // Add debug logging
   }
   ```

3. **Create Minimal Test Case**
   - Try logging in with a simple test account
   - Verify basic Firebase connectivity

---

## 🎯 Success Indicators

When everything is working correctly, you should see:

✅ **Console Messages:**
```
✅ Firebase configuration validated successfully
Firebase sign-in successful: YOUR_RESTAURANT_admin@gmail.com
```

✅ **Browser Behavior:**
- Smooth login without redirects
- Dashboard loads immediately after login
- Restaurant name appears in navigation
- No hydration warnings in console

✅ **Firebase Console:**
- User appears in Authentication > Users
- Firestore collections are created automatically
- No errors in Firebase Console logs

---

*Need more help? Check the main README.md for setup instructions or contact support.* 