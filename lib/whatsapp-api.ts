// lib/whatsapp-api.ts
interface WhatsAppMessage {
  phone: string
  message: string
  apikey?: string
}

interface WhatsAppFileMessage {
  phone: string
  message: string
  filename: string
  file: string // base64 encoded file
  apikey?: string
}

// You can use different WhatsApp API providers:
// 1. Ultramsg.com (simple and affordable)
// 2. CallHub
// 3. Chat-API
// 4. Meta WhatsApp Cloud API
// 5. Twilio WhatsApp API

const WHATSAPP_API_CONFIG = {
  // Using Ultramsg as example (you can change this)
  baseUrl: 'https://api.ultramsg.com',
  instanceId: process.env.NEXT_PUBLIC_WHATSAPP_INSTANCE_ID || 'instance_id',
  apiKey: process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'your_api_key',
}

export class WhatsAppService {
  private baseUrl: string
  private instanceId: string
  private apiKey: string

  constructor() {
    this.baseUrl = WHATSAPP_API_CONFIG.baseUrl
    this.instanceId = WHATSAPP_API_CONFIG.instanceId
    this.apiKey = WHATSAPP_API_CONFIG.apiKey
  }

  // Send text message
  async sendMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Clean phone number (remove spaces, hyphens, etc.)
      const cleanPhone = this.cleanPhoneNumber(phone)
      
      const response = await fetch(`${this.baseUrl}/${this.instanceId}/messages/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: this.apiKey,
          to: cleanPhone,
          body: message,
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.sent) {
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to send message' }
      }
    } catch (error) {
      console.error('WhatsApp API Error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Send PDF document
  async sendDocument(
    phone: string, 
    message: string, 
    pdfBase64: string, 
    filename: string = 'bill.pdf'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanPhone = this.cleanPhoneNumber(phone)
      
      const response = await fetch(`${this.baseUrl}/${this.instanceId}/messages/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: this.apiKey,
          to: cleanPhone,
          document: pdfBase64,
          caption: message,
          filename: filename,
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.sent) {
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to send document' }
      }
    } catch (error) {
      console.error('WhatsApp Document API Error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Alternative: Send using different providers
  async sendViaTwilio(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    // Implement Twilio WhatsApp API
    // You'll need Twilio credentials
    return { success: false, error: 'Twilio not implemented' }
  }

  async sendViaMetaAPI(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    // Implement Meta WhatsApp Cloud API
    // You'll need Meta WhatsApp Business account
    return { success: false, error: 'Meta API not implemented' }
  }

  // Fallback: Open WhatsApp web (current method)
  openWhatsAppWeb(phone: string, message: string): void {
    const cleanPhone = this.cleanPhoneNumber(phone)
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Utility: Clean phone number
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')
    
    // If it starts with +, keep it, otherwise add country code
    if (!cleaned.startsWith('+')) {
      // Add +91 for India (change this based on your country)
      cleaned = '+91' + cleaned
    }
    
    return cleaned
  }

  // Check if API is configured
  isConfigured(): boolean {
    return !!(this.instanceId && this.apiKey && 
             this.instanceId !== 'instance_id' && 
             this.apiKey !== 'your_api_key')
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService() 