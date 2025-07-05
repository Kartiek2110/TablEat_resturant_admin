"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  MapPin,
  Clock,
  ShoppingCart,
  Receipt,
  CreditCard,
  Printer,
  CheckCircle,
  DollarSign,
  Calendar,
  MessageCircle,
} from "lucide-react";
import {
  updateOrderStatus,
  updateTableStatus,
  type Order,
} from "@/firebase/restaurant-service-optimized";
import { whatsappService } from "@/lib/whatsapp-api";
import { PDFGenerator } from "@/lib/pdf-generator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsDialog({
  order,
  isOpen,
  onClose,
}: OrderDetailsDialogProps) {
  const { restaurantName, restaurant } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">(
    "cash"
  );
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  if (!order) return null;

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    if (!restaurantName) return;

    setIsProcessing(true);
    try {
      await updateOrderStatus(restaurantName, order.id, newStatus);

      // If order is served, free up the table (only for dine-in orders)
      if (newStatus === "served" && order.orderType === "dine-in" && order.tableNumber > 0) {
        await updateTableStatus(restaurantName, order.tableNumber, false);
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!restaurantName) return;

    setIsProcessing(true);
    try {
      // Update order status to served
      await updateOrderStatus(restaurantName, order.id, "served");

      // Free up the table (only for dine-in orders)
      if (order.orderType === "dine-in" && order.tableNumber > 0) {
        await updateTableStatus(restaurantName, order.tableNumber, false);
      }

      toast.success("Order completed successfully! 🎉");
      onClose();
    } catch (error) {
      console.error("Error completing checkout:", error);
      toast.error("Failed to complete checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBillMessage = (order: any) => {
    const restaurantNameFormatted =
      restaurantName?.replace(/_/g, " ") || "Restaurant";
    const itemsList = order.items
      .map(
        (item: any) =>
          `${item.quantity}x ${item.name} - ₹${(
            item.price * item.quantity
          ).toFixed(2)}`
      )
      .join("\n");

    // Calculate tax only if enabled
    const taxAmount = restaurant?.taxEnabled 
      ? (order.totalAmount * (restaurant?.taxRate || 0)) / 100 
      : 0;
    const totalWithTax = order.totalAmount + taxAmount;

    // Generate bill number in format: RN/2024-25/001
    const currentYear = new Date().getFullYear()
    const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    const restaurantInitials = restaurantNameFormatted.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    const billNumber = `${restaurantInitials}/${financialYear}/${order.dailyOrderNumber?.toString().padStart(3, '0') || order.id.slice(-3)}`

    const taxLine = restaurant?.taxEnabled && restaurant?.taxRate && restaurant.taxRate > 0
      ? `🏷️ Tax (${restaurant.taxRate}%): ₹${taxAmount.toFixed(2)}\n━━━━━━━━━━━━━━━━\n`
      : '';

    return `🧾 *${restaurantNameFormatted.toUpperCase()}*
${restaurant?.address || 'Restaurant Address'}
📞 ${restaurant?.phone || 'Phone Number'}
🍽️ FSSAI: ${restaurant?.fssaiNo || 'FSSAI Number'}${restaurant?.gstNo ? `\n💼 GST: ${restaurant.gstNo}` : ''}
━━━━━━━━━━━━━━━━
*INVOICE*
━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
🕐 Time: ${new Date().toLocaleTimeString()}
👤 Customer: ${order.customerName || "Walk-in Customer"}
${order.orderType === 'pickup' ? '📦 Order Type: Pickup' : `🍽️ Table: ${order.tableNumber || "N/A"}`}
🆔 Bill No.: ${billNumber}

📋 *ORDER DETAILS:*
${itemsList}
━━━━━━━━━━━━━━━━
💰 Total Value: ₹${order.totalAmount.toFixed(2)}
${taxLine}💵 *TOTAL AMOUNT: ₹${totalWithTax.toFixed(2)}*
💳 Payment: ${paymentMethod.toUpperCase()}

Thank you for dining with us! 🙏
Visit us again soon! ✨

Powered by TablEat 🍽️`;
  };

  const handleWhatsAppBill = async () => {
    // Check if customer has phone number
    if (!order.customerPhone || order.customerPhone.trim() === '') {
      toast.error(
        "Customer phone number not available. Please add customer phone number to send e-bill."
      );
      return;
    }

    try {
      toast.info("Sending e-bill to customer...", { duration: 2000 });

      // Check if WhatsApp API is configured
      if (whatsappService.isConfigured()) {
        // Method 1: Send PDF bill via API
        try {
          const billData = {
            order,
            restaurantName: restaurantName || "Restaurant",
            restaurantAddress: restaurant?.address || "Restaurant Address",
            restaurantPhone: restaurant?.phone || "Phone Number",
            fssaiNo: restaurant?.fssaiNo || "FSSAI Number",
            gstNo: restaurant?.gstNo,
            taxRate: restaurant?.taxRate,
            taxEnabled: restaurant?.taxEnabled
          };

          // Generate PDF bill
          const pdfBase64 = await PDFGenerator.generateBillPDF(billData);
          
          // Generate text message
          const textBill = PDFGenerator.generateTextBill(billData);
          
          // Send PDF via WhatsApp API
          const result = await whatsappService.sendDocument(
            order.customerPhone,
            `🧾 Your bill from ${restaurantName?.replace(/_/g, ' ')} is ready!\n\n${textBill}`,
            pdfBase64,
            `bill-${order.id.slice(-6)}.pdf`
          );

          if (result.success) {
            toast.success(`E-bill sent successfully to ${order.customerPhone}! 📱`);
            return;
          } else {
            console.warn('API send failed, trying text message:', result.error);
            
            // Fallback: Send text message only
            const textResult = await whatsappService.sendMessage(order.customerPhone, textBill);
            if (textResult.success) {
              toast.success(`Text bill sent successfully to ${order.customerPhone}! 📱`);
              return;
            } else {
              throw new Error(textResult.error);
            }
          }
        } catch (apiError) {
          console.warn('WhatsApp API failed, falling back to web method:', apiError);
          // Continue to fallback method below
        }
      }

      // Method 2: Fallback - Open WhatsApp Web (current method)
      const billMessage = generateBillMessage(order);
      whatsappService.openWhatsAppWeb(order.customerPhone, billMessage);
      toast.success("Opening WhatsApp to send e-bill...");
      
    } catch (error) {
      console.error("Error sending WhatsApp bill:", error);
      toast.error("Failed to send WhatsApp bill. Please try again.");
    }
  };

  const handlePrintInvoice = () => {
    // Create invoice content
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - Order #${order.id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .details { margin: 20px 0; }
            .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurantName?.replace(/_/g, " ") || "Restaurant"}</h1>
            <p>Invoice #${order.id.slice(-6)}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Table:</strong> ${order.tableNumber}</p>
            <p><strong>Order Time:</strong> ${order.createdAt.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
          </div>
          
          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="total">
            <p>Total Amount: ₹${order.totalAmount.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Powered by TablEat</p>
          </div>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Calculate tax only if enabled
  const tax = restaurant?.taxEnabled && restaurant?.taxRate 
    ? (subtotal * restaurant.taxRate) / 100 
    : 0;
  const total = subtotal + tax;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Order Details #{order.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            Complete order information and checkout options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {order.createdAt.toLocaleString()}
            </div>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>
                  {order.orderType === 'pickup' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      📦 Pickup
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      🍽️ Dine-Table {order.tableNumber}
                    </Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.notes && (
                        <p className="text-sm text-gray-500">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ₹{item.price} × {item.quantity}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Actions */}
          {order.status !== "served" && order.status !== "cancelled" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Checkout & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Payment Method
                  </label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: "cash" | "card" | "upi") =>
                      setPaymentMethod(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="upi">📱 UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isProcessing ? "Processing..." : "Complete Order"}
                  </Button>
                  <Button
                    onClick={handleWhatsAppBill}
                    variant="outline"
                    className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    disabled={!order.customerPhone || order.customerPhone.trim() === ''}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {order.customerPhone 
                      ? `Send to ${order.customerPhone}` 
                      : 'WhatsApp E-Bill (No Phone)'
                    }
                  </Button>
                </div>
                <Button
                  onClick={handlePrintInvoice}
                  variant="outline"
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Update Actions */}
          {order.status !== "served" && order.status !== "cancelled" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {order.status === "pending" && (
                    <Button
                      onClick={() => handleStatusUpdate("preparing")}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button
                      onClick={() => handleStatusUpdate("ready")}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button
                      onClick={() => handleStatusUpdate("served")}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                    >
                      Mark Served
                    </Button>
                  )}
                  <Button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={isProcessing}
                    variant="destructive"
                    size="sm"
                  >
                    Cancel Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Order Info */}
          {order.status === "served" && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-800">
                    Order Completed!
                  </h3>
                  <p className="text-green-600">
                    This order has been successfully served.
                  </p>
                  <Button
                    onClick={handlePrintInvoice}
                    variant="outline"
                    className="mt-4"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Phone Number Dialog */}
        {showPhoneDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Enter Customer Phone Number
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please enter the customer's phone number to send the WhatsApp
                e-bill.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number (e.g., +919876543210)"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleWhatsAppBill}
                    disabled={!phoneNumber.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send E-Bill
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPhoneDialog(false);
                      setPhoneNumber("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
