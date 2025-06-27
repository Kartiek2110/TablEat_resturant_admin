# 📱 WhatsApp API Setup Guide

This guide helps you set up WhatsApp API integration to send bills directly to customers without opening WhatsApp chat.

## 🎯 What This Enables

✅ **Send PDF bills directly to customers**  
✅ **No more opening WhatsApp chat manually**  
✅ **Automatic delivery to customer phone numbers**  
✅ **Professional PDF invoices**  
✅ **Fallback to regular WhatsApp if API fails**

---

## 🚀 Quick Setup (Recommended: Ultramsg)

### Step 1: Sign up for Ultramsg
1. Go to [ultramsg.com](https://ultramsg.com)
2. Create a free account
3. Create a new WhatsApp instance
4. Get your **Instance ID** and **API Key**

### Step 2: Add Environment Variables
Add these to your `.env` file:

```env
# WhatsApp API Configuration
NEXT_PUBLIC_WHATSAPP_INSTANCE_ID=your_instance_id_here
NEXT_PUBLIC_WHATSAPP_API_KEY=your_api_key_here
```

### Step 3: Test the Integration
1. Add a customer phone number to any order
2. Click "Send to [phone_number]" button
3. Customer will receive PDF bill automatically!

---

## 🔧 Alternative Providers

### Option 1: Twilio WhatsApp API
```env
# Twilio Configuration
NEXT_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid
NEXT_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token
NEXT_PUBLIC_TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Option 2: Meta WhatsApp Cloud API
```env
# Meta WhatsApp Cloud API
NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN=your_access_token
```

### Option 3: Chat-API
```env
# Chat-API Configuration
NEXT_PUBLIC_CHATAPI_INSTANCE_ID=your_instance_id
NEXT_PUBLIC_CHATAPI_TOKEN=your_token
```

---

## 💡 How It Works

### Without API (Current Fallback)
```
Customer Order → Click "WhatsApp E-Bill" → Opens WhatsApp Web → Manual send
```

### With API (New Method)
```
Customer Order → Click "Send to [phone]" → PDF Generated → Sent Automatically → Customer Receives Bill
```

---

## 📋 Features Comparison

| Feature | Without API | With API |
|---------|------------|----------|
| **Manual Work** | ✅ Opens WhatsApp chat | ❌ Fully automatic |
| **PDF Bills** | ❌ Text only | ✅ Professional PDF + Text |
| **Customer Experience** | ⚠️ Requires admin interaction | ✅ Instant delivery |
| **Bulk Sending** | ❌ One by one | ✅ Multiple customers |
| **Tracking** | ❌ No delivery status | ✅ Delivery confirmation |

---

## 🛠️ Code Implementation

The system automatically:

1. **Checks customer phone number** - If missing, shows error
2. **Tries API first** - If configured, sends PDF + text via API
3. **Fallback to web** - If API fails, opens WhatsApp web (current method)
4. **Error handling** - Shows appropriate messages for each step

### Bill Generation Process:
```javascript
// 1. Generate PDF bill
const pdfBase64 = await PDFGenerator.generateBillPDF(billData)

// 2. Generate text summary  
const textBill = PDFGenerator.generateTextBill(billData)

// 3. Send via API
await whatsappService.sendDocument(customerPhone, message, pdfBase64)
```

---

## 🔍 Troubleshooting

### "Customer phone number not available"
**Solution:** Make sure to add customer phone when creating orders

### "WhatsApp API not configured"  
**Solution:** Add environment variables and restart your app

### "Failed to send document"
**Solution:** Check your API credits and instance status

### API calls failing
**Solution:** System automatically falls back to opening WhatsApp web

---

## 💰 Cost Comparison

### Ultramsg (Recommended)
- **Free Tier:** 100 messages/month
- **Paid Plans:** Starting $5/month for 1000 messages
- **PDF Support:** ✅ Included

### Twilio WhatsApp
- **Pay-per-message:** $0.005 per message
- **PDF Support:** ✅ Included
- **Enterprise-grade:** ✅ High reliability

### Meta WhatsApp Cloud API
- **Free Tier:** 1000 messages/month
- **Pay-per-message:** Very low cost after free tier
- **Official:** ✅ Direct from Meta

---

## 🎉 Success Indicators

When working correctly, you'll see:

✅ **Button Text:** "Send to +91XXXXX" instead of "WhatsApp E-Bill"  
✅ **Toast Messages:** "E-bill sent successfully to [phone]! 📱"  
✅ **Customer Experience:** Receives PDF bill instantly  
✅ **No Browser Popups:** No WhatsApp web opening  

---

## 🚨 Important Notes

1. **Phone Number Format:** System auto-formats phone numbers (+91 for India)
2. **PDF Size:** Optimized PDFs under 5MB for better delivery
3. **Fallback Always Works:** If API fails, reverts to WhatsApp web
4. **Customer Privacy:** Bills sent directly to customer, not admin
5. **Multi-Country:** Adjust country code in `lib/whatsapp-api.ts`

---

## 🎯 Quick Test

1. Create an order with customer phone: `+91 9876543210`
2. Complete the order
3. Click "Send to +919876543210"
4. Customer should receive PDF bill instantly!

**Your WhatsApp API integration is ready! 🚀** 