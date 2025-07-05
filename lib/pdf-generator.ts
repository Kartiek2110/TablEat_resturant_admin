import { Order } from '@/firebase/restaurant-service-optimized'

export interface BillPDFData {
  order: Order
  restaurantName: string
  restaurantAddress: string
  restaurantPhone: string
  fssaiNo: string
  gstNo?: string
  taxRate?: number
  taxEnabled?: boolean
}

export class PDFGenerator {
  
  // Generate PDF bill as base64 string
  static async generateBillPDF(data: BillPDFData): Promise<string> {
    const { order, restaurantName, restaurantAddress, restaurantPhone, fssaiNo, gstNo, taxRate = 0, taxEnabled = false } = data
    
    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxAmount = taxEnabled && taxRate ? (subtotal * taxRate) / 100 : 0
    const total = subtotal + taxAmount
    
    // Generate bill number in format: RN/2024-25/001
    const currentYear = new Date().getFullYear()
    const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    const restaurantInitials = restaurantName.replace(/_/g, ' ').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    const billNumber = `${restaurantInitials}/${financialYear}/${order.dailyOrderNumber?.toString().padStart(3, '0') || order.id.slice(-3)}`
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${billNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
            }
            
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .restaurant-name {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            
            .restaurant-details {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
              line-height: 1.4;
            }
            
            .restaurant-details.address {
              font-weight: 500;
              margin-bottom: 8px;
            }
            
            .bill-title {
              font-size: 20px;
              font-weight: bold;
              color: #dc2626;
              margin-top: 15px;
              text-decoration: underline;
            }
            
            .bill-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
            }
            
            .bill-info-left, .bill-info-right {
              flex: 1;
            }
            
            .bill-info h3 {
              margin: 0 0 10px 0;
              color: #374151;
              font-size: 16px;
            }
            
            .bill-info p {
              margin: 5px 0;
              font-size: 14px;
              color: #6b7280;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .items-table th {
              background: #2563eb;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
            }
            
            .items-table td {
              padding: 12px 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            
            .items-table tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .items-table tr:hover {
              background: #f3f4f6;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .totals {
              margin-top: 30px;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 16px;
            }
            
            .total-row.subtotal {
              color: #6b7280;
            }
            
            .total-row.tax {
              color: #059669;
            }
            
            .total-row.final {
              font-weight: bold;
              font-size: 20px;
              color: #1e40af;
              border-top: 2px solid #2563eb;
              padding-top: 10px;
              margin-top: 15px;
            }
            
            .notes {
              margin: 20px 0;
              padding: 15px;
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              border-radius: 4px;
            }
            
            .notes h4 {
              margin: 0 0 5px 0;
              color: #92400e;
            }
            
            .notes p {
              margin: 0;
              color: #78350f;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              color: #6b7280;
            }
            
            .footer-brand {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 10px;
            }
            
            .thank-you {
              font-size: 18px;
              color: #059669;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            @media print {
              body { margin: 0; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="restaurant-name">${restaurantName.replace(/_/g, ' ')}</div>
              <div class="restaurant-details address">${restaurantAddress}</div>
              <div class="restaurant-details">📞 ${restaurantPhone}</div>
              <div class="restaurant-details">🍽️ FSSAI: ${fssaiNo}</div>
              ${gstNo ? `<div class="restaurant-details">💼 GST: ${gstNo}</div>` : ''}
              <div class="bill-title">━━━━━━━━━━━━━━━━</div>
              <div class="bill-title">INVOICE</div>
              <div class="bill-title">━━━━━━━━━━━━━━━━</div>
            </div>

            <!-- Bill Information -->
            <div class="bill-info">
              <div class="bill-info-left">
                <h3>🧾 Bill Details</h3>
                <p><strong>Bill No.:</strong> ${billNumber}</p>
                <p><strong>Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${order.createdAt.toLocaleTimeString()}</p>
              </div>
              <div class="bill-info-right">
                <h3>👤 Customer Details</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
                <p><strong>Order Type:</strong> ${order.orderType === 'pickup' ? '📦 Pickup' : `🍽️ Dine-Table ${order.tableNumber}`}</p>
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.name}</strong>
                      ${item.notes ? `<br><small style="color: #6b7280;">Note: ${item.notes}</small>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₹${item.price.toFixed(2)}</td>
                    <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Order Notes -->
            ${order.notes ? `
              <div class="notes">
                <h4>📝 Order Notes:</h4>
                <p>${order.notes}</p>
              </div>
            ` : ''}

            <!-- Totals -->
            <div class="totals">
              <div style="border-bottom: 1px solid #e5e7eb; margin-bottom: 15px; padding-bottom: 10px;">
                <div class="total-row subtotal">
                  <span>Total Value:</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </div>
                
                ${taxEnabled && taxRate > 0 ? `
                  <div class="total-row tax">
                    <span>Tax (${taxRate}%):</span>
                    <span>₹${taxAmount.toFixed(2)}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="total-row final">
                <span>💰 TOTAL AMOUNT:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="thank-you">🙏 Thank you for dining with us!</div>
              <p>Visit us again soon! ✨</p>
              <div class="footer-brand">
                Powered by <strong>TablEat</strong> - Restaurant Management System
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Convert HTML to PDF using browser's print functionality
    // In a real implementation, you might want to use a library like:
    // - jsPDF + html2canvas
    // - Puppeteer (server-side)
    // - PDF-lib
    // - html-pdf
    
    // For now, we'll create a simple base64 encoded HTML file
    // that can be converted to PDF by the browser
    return btoa(unescape(encodeURIComponent(htmlContent)))
  }

  // Alternative: Generate using jsPDF (if you install the library)
  static async generateWithJsPDF(data: BillPDFData): Promise<string> {
    // This would require installing jspdf and html2canvas
    // npm install jspdf html2canvas
    
    throw new Error('jsPDF implementation not included. Install jsPDF library to use this method.')
  }

  // Generate simple text bill for WhatsApp
  static generateTextBill(data: BillPDFData): string {
    const { order, restaurantName, restaurantAddress, restaurantPhone, fssaiNo, gstNo, taxRate = 0, taxEnabled = false } = data
    
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxAmount = taxEnabled && taxRate ? (subtotal * taxRate) / 100 : 0
    const total = subtotal + taxAmount

    // Generate bill number in format: RN/2024-25/001
    const currentYear = new Date().getFullYear()
    const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    const restaurantInitials = restaurantName.replace(/_/g, ' ').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    const billNumber = `${restaurantInitials}/${financialYear}/${order.dailyOrderNumber?.toString().padStart(3, '0') || order.id.slice(-3)}`

    const itemsList = order.items
      .map(item => `${item.quantity}x ${item.name} - ₹${(item.price * item.quantity).toFixed(2)}`)
      .join('\n')

    const taxLine = taxEnabled && taxRate > 0
      ? `🏷️ Tax (${taxRate}%): ₹${taxAmount.toFixed(2)}\n━━━━━━━━━━━━━━━━\n`
      : ''

    return `🧾 *${restaurantName.replace(/_/g, ' ').toUpperCase()}*
${restaurantAddress}
📞 ${restaurantPhone}
🍽️ FSSAI: ${fssaiNo}${gstNo ? `\n💼 GST: ${gstNo}` : ''}
━━━━━━━━━━━━━━━━
*INVOICE*
━━━━━━━━━━━━━━━━
📅 Date: ${order.createdAt.toLocaleDateString()}
🕐 Time: ${order.createdAt.toLocaleTimeString()}
👤 Customer: ${order.customerName}
${order.orderType === 'pickup' ? '📦 Order Type: Pickup' : `🍽️ Table: ${order.tableNumber}`}
🆔 Bill No.: ${billNumber}

📋 *ORDER DETAILS:*
${itemsList}
━━━━━━━━━━━━━━━━
💰 Total Value: ₹${subtotal.toFixed(2)}
${taxLine}💵 *TOTAL AMOUNT: ₹${total.toFixed(2)}*

Thank you for dining with us! 🙏
Visit us again soon! ✨

Powered by TablEat 🍽️`
  }
} 