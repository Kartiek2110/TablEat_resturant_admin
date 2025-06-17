# TablEat - Deployment Guide

This guide will help you deploy the TablEat Restaurant Admin Dashboard to production.

## 🚀 Quick Start for BY_THE_WAY Restaurant

### Step 1: Create Firebase Admin Account
Create an admin account with this exact email format:
```
BY_THE_WAY_admin@gmail.com
```

### Step 2: Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "tableat-143af" (or your preferred name)
3. Enable Authentication → Email/Password provider
4. Enable Firestore Database
5. Copy your Firebase config

### Step 3: Environment Configuration
Update your `.env` file with the provided Firebase credentials:
```env

```

### Step 4: Create Admin Account
1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Try to login with `BY_THE_WAY_admin@gmail.com`
4. If the account doesn't exist, create it in Firebase Console:
   - Go to Authentication → Users
   - Add user with email `BY_THE_WAY_admin@gmail.com` and a secure password

### Step 5: First Login & Setup
1. Login with your admin credentials
2. The system will automatically:
   - Extract "BY_THE_WAY" as restaurant name
   - Create restaurant database entry
   - Show onboarding guide
3. Follow the onboarding to set up your restaurant

## 🏗️ Production Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔥 Firebase Security Rules

Set these Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own restaurant data
    match /restaurants/{restaurantId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email.split('@')[0].endsWith('_admin');
    }
    
    // Menu items - admin only
    match /menu/{menuId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email.split('@')[0].endsWith('_admin');
    }
    
    // Tables - admin only
    match /tables/{tableId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email.split('@')[0].endsWith('_admin');
    }
    
    // Discounts - admin only
    match /discounts/{discountId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email.split('@')[0].endsWith('_admin');
    }
  }
}
```

## 🎯 Post-Deployment Checklist

### ✅ Authentication Testing
- [ ] Admin can login with correct email format
- [ ] Non-admin emails are rejected
- [ ] Restaurant name is extracted correctly
- [ ] Authentication guards protect all routes

### ✅ Data Management Testing
- [ ] Menu items can be added/edited/deleted
- [ ] Tables can be configured and updated
- [ ] Discounts can be created and managed
- [ ] Real-time updates work across browsers

### ✅ Billing System Testing
- [ ] Items can be added to bills
- [ ] Tax calculations are correct (18% GST)
- [ ] Discounts apply properly
- [ ] Invoices generate with restaurant branding
- [ ] Print functionality works

### ✅ User Experience Testing
- [ ] Onboarding guide appears for new users
- [ ] Navigation shows correct restaurant name
- [ ] TablEat branding is visible
- [ ] Help button is accessible
- [ ] Mobile responsiveness works

## 🔧 Monitoring & Maintenance

### Firebase Monitoring
- Monitor authentication in Firebase Console
- Check Firestore usage and billing
- Review security rules and access patterns

### Application Monitoring
- Monitor Vercel deployments and builds
- Check error logs and performance metrics
- Monitor user engagement and feature usage

### Regular Updates
- Keep dependencies updated
- Monitor Firebase SDK updates
- Update security rules as needed

## 📱 Multiple Restaurant Support

To support multiple restaurants, simply create additional admin accounts:

```
RESTAURANT_A_admin@gmail.com → "RESTAURANT A"
PIZZA_PALACE_admin@gmail.com → "PIZZA PALACE"
SUSHI_MASTER_admin@gmail.com → "SUSHI MASTER"
```

Each restaurant will have:
- Separate database entries
- Isolated data (menu, tables, discounts)
- Independent management dashboard
- Custom branding in invoices

## 🚨 Security Best Practices

### Admin Account Security
- Use strong passwords for admin accounts
- Enable 2FA when possible
- Regularly rotate passwords
- Monitor login activity

### Firebase Security
- Review and update security rules
- Monitor authentication logs
- Set up billing alerts
- Regular security audits

### Application Security
- Keep dependencies updated
- Monitor for security vulnerabilities
- Use HTTPS in production
- Implement proper error handling

---

## 🆘 Troubleshooting

### Common Issues

**"Invalid email format" error:**
- Ensure email follows `RESTAURANT_NAME_admin@gmail.com` format
- Restaurant name should use underscores for spaces

**Restaurant data not loading:**
- Check Firebase configuration
- Verify Firestore security rules
- Ensure admin account exists

**Billing/printing issues:**
- Check browser print permissions
- Test with different browsers
- Verify invoice CSS styles

**Real-time updates not working:**
- Check Firebase connection
- Verify Firestore listeners
- Test network connectivity

### Support Contacts
- Technical Issues: support@tableat.com
- Firebase Setup: firebase-support@tableat.com
- Billing Questions: billing@tableat.com

---

**Your TablEat restaurant admin system is now ready for production use!** 🎉 