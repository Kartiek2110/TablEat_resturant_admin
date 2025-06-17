# TablEat - Restaurant Admin Dashboard

A comprehensive restaurant management system built with Next.js, Firebase, and modern web technologies. Designed for restaurant owners and administrators to efficiently manage their operations.

## 🚀 Features

### ✅ **Authentication & Security**
- Firebase Authentication with email/password
- Admin email format validation (`RESTAURANT_NAME_admin@gmail.com`)
- Automatic restaurant name extraction from email
- Protected routes with authentication guards

### ✅ **Real-time Data Management**
- **Menu Management**: Add, edit, delete menu items with categories, prices, allergens
- **Table Management**: Configure tables with capacity and location (indoor/outdoor/private)
- **Discount Campaigns**: Create percentage or fixed-amount discounts with validity periods
- **Real-time Synchronization**: All data updates instantly across connected devices

### ✅ **Billing & Invoicing System**
- Quick order creation with pre-defined menu items
- Automatic tax calculation (18% GST)
- Discount application with percentage or fixed amounts
- Professional invoice generation with restaurant branding
- Print-ready invoices for thermal printers
- Multiple payment methods (Cash, Card, UPI)

### ✅ **User Experience**
- **Onboarding Guide**: Step-by-step tutorial for new admins
- **TablEat Branding**: Consistent branding throughout the application
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Quick Help**: Accessible help button for assistance

## 🛠️ Setup Instructions

### 1. **Environment Setup**

Create a `.env` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. **Firebase Setup**

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Copy your Firebase configuration to the `.env` file

### 3. **Admin Account Creation**

Create admin accounts using the following email format:
```
RESTAURANT_NAME_admin@gmail.com
```

**Example for "BY_THE_WAY" restaurant:**
```
BY_THE_WAY_admin@gmail.com
```

The system will automatically:
- Extract "BY_THE_WAY" as the restaurant name
- Create the restaurant database entry
- Display "BY THE WAY" in the navigation
- Set up the restaurant with default data

### 4. **Installation & Running**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## 📱 How to Use

### **First Login**
1. Navigate to `/login`
2. Enter your admin email (format: `RESTAURANT_NAME_admin@gmail.com`)
3. Enter your password
4. The system will automatically create your restaurant entry
5. Follow the onboarding guide to set up your restaurant

### **Dashboard Features**

#### **Menu Management**
- Add menu items with names, descriptions, prices, and categories
- Set allergen information and preparation times
- Toggle item availability in real-time
- Organize items by categories (Pizza, Salads, Main Course, etc.)

#### **Table Management**
- Configure tables with numbers, capacity, and locations
- Mark tables as available/occupied
- Set up indoor, outdoor, and private dining areas

#### **Discount Management**
- Create percentage-based or fixed-amount discounts
- Set validity periods and minimum order amounts
- Apply discounts to specific categories or all items

#### **Billing System**
- Access via sidebar navigation or `/dashboard/billing`
- Add items quickly using the quick-add menu
- Calculate taxes and apply discounts automatically
- Generate and print professional invoices
- Support for multiple payment methods

## 🔥 Firebase Database Structure

```
restaurants/
├── {restaurantId}/
    ├── name: "BY_THE_WAY"
    ├── description: "..."
    ├── address: "..."
    ├── phone: "..."
    ├── email: "BY_THE_WAY_admin@gmail.com"
    └── ...

menu/
├── {menuItemId}/
    ├── restaurantId: "{restaurantId}"
    ├── name: "Pizza Margherita"
    ├── price: 12.99
    ├── category: "Pizza"
    └── ...

tables/
├── {tableId}/
    ├── restaurantId: "{restaurantId}"
    ├── number: 1
    ├── capacity: 4
    └── ...

discounts/
├── {discountId}/
    ├── restaurantId: "{restaurantId}"
    ├── name: "Happy Hour"
    ├── type: "percentage"
    └── ...
```

## 💡 Key Features Explained

### **Restaurant Name Extraction**
The system automatically extracts the restaurant name from the admin email:
- `BY_THE_WAY_admin@gmail.com` → `BY_THE_WAY`
- `PIZZA_PALACE_admin@gmail.com` → `PIZZA_PALACE`
- `SUSHI_MASTER_admin@gmail.com` → `SUSHI_MASTER`

### **Real-time Updates**
All data changes are synchronized in real-time across all connected devices:
- Menu item availability updates instantly
- Table status changes are reflected immediately
- New orders appear on all connected admin panels

### **Professional Invoicing**
Generated invoices include:
- Restaurant name and branding
- Complete order details with itemized pricing
- Tax calculations (18% GST)
- Payment method information
- Customer details (if provided)
- TablEat branding footer
- Print-optimized formatting

### **Onboarding System**
New restaurant admins are guided through:
1. Welcome and introduction
2. Menu setup instructions
3. Table configuration guidance
4. Discount creation tutorial
5. Billing system walkthrough
6. Settings customization

## 🎯 Admin Email Examples

- **BY_THE_WAY_admin@gmail.com** → "BY THE WAY" restaurant
- **PIZZA_CORNER_admin@gmail.com** → "PIZZA CORNER" restaurant
- **CAFE_DELIGHT_admin@gmail.com** → "CAFE DELIGHT" restaurant
- **BURGER_KING_admin@gmail.com** → "BURGER KING" restaurant

## 🔧 Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Firebase (Authentication, Firestore)
- **UI Components**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore with real-time listeners
- **Deployment**: Vercel-ready configuration

## 📞 Support

For technical support or questions about TablEat:
- Email: support@tableat.com
- Documentation: [docs.tableat.com](https://docs.tableat.com)
- GitHub Issues: Report bugs and feature requests

## 🏆 Benefits

### **For Restaurant Owners**
- Complete operational control from one dashboard
- Real-time data synchronization across devices
- Professional invoice generation
- Efficient staff management with role-based access

### **For Staff**
- Intuitive interface requiring minimal training
- Quick order processing and billing
- Real-time menu and table status updates
- Mobile-friendly design for on-the-go management

### **For Customers**
- Faster service with efficient order management
- Professional invoices with detailed breakdowns
- Accurate billing with automatic tax calculations

---

**Powered by TablEat** - The comprehensive restaurant management solution for modern dining establishments. 