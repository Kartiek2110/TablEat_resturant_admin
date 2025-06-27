'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserCircle, Building, Mail, Phone, MapPin, Clock, Upload, Camera, X, Settings, Calculator } from "lucide-react"
import {
  getRestaurantByAdminEmail,
  updateRestaurantBanner,
  type Restaurant
} from '@/firebase/restaurant-service'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import SubscriptionStatus from '@/components/SubscriptionStatus'
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const { user, restaurantName, refreshRestaurant } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    adminPhone: '',
    taxEnabled: false,
    taxRate: 0
  })

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user?.email) {
        try {
          const restaurantData = await getRestaurantByAdminEmail(user.email)
          if (restaurantData) {
            setRestaurant(restaurantData)
            setFormData({
              name: restaurantData.name || '',
              description: restaurantData.description || '',
              address: restaurantData.address || '',
              phone: restaurantData.phone || '',
              email: restaurantData.adminEmail || '',
              adminPhone: restaurantData.adminPhone || '',
              taxEnabled: restaurantData.taxEnabled || false,
              taxRate: restaurantData.taxRate || 0
            })
          }
        } catch (error) {
          console.error('Error fetching restaurant:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchRestaurant()
  }, [user?.email])

  const handleSave = async () => {
    if (!restaurant) return
    
    try {
      setSaving(true)
      const restaurantId = restaurant.id
      
      await updateDoc(doc(db, 'restaurants', restaurantId), {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        adminPhone: formData.adminPhone,
        taxEnabled: formData.taxEnabled,
        taxRate: formData.taxRate,
        updatedAt: new Date()
      })
      
      // Update local state
      setRestaurant({
        ...restaurant,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        adminPhone: formData.adminPhone,
        taxEnabled: formData.taxEnabled,
        taxRate: formData.taxRate
      })
      
      // Refresh restaurant data in AuthContext so other components get the updated data
      await refreshRestaurant()
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !restaurantName) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploadingBanner(true)
    
    try {
      // Convert to base64 for storage (in a real app, you'd upload to cloud storage)
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      await updateRestaurantBanner(restaurantName, base64)
      
      // Update local state
      setRestaurant(prev => prev ? { ...prev, banner_image: base64 } : null)
      
      toast.success('Banner updated successfully!')
    } catch (error) {
      console.error('Error uploading banner:', error)
      toast.error('Failed to upload banner')
    } finally {
      setUploadingBanner(false)
    }
  }

  const removeBanner = async () => {
    if (!restaurantName) return
    
    setUploadingBanner(true)
    try {
      await updateRestaurantBanner(restaurantName, '')
      setRestaurant(prev => prev ? { ...prev, banner_image: '' } : null)
      toast.success('Banner removed successfully!')
    } catch (error) {
      console.error('Error removing banner:', error)
      toast.error('Failed to remove banner')
    } finally {
      setUploadingBanner(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Restaurant Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your restaurant information and subscription
          </p>
        </div>
      </div>

      {/* Banner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Restaurant Banner</span>
          </CardTitle>
          <CardDescription>
            Upload a banner image for your restaurant (4:1 aspect ratio recommended)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              className="w-full h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg overflow-hidden relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {restaurant?.banner_image ? (
                <img 
                  src={restaurant.banner_image} 
                  alt="Restaurant Banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-70" />
                    <p className="text-lg font-medium">Add Restaurant Banner</p>
                    <p className="text-sm opacity-80">Click to upload image</p>
                  </div>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">
                    {restaurant?.banner_image ? 'Change Banner' : 'Upload Banner'}
                  </p>
                </div>
              </div>
              
              {/* Remove button */}
              {restaurant?.banner_image && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeBanner()
                  }}
                  disabled={uploadingBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
              disabled={uploadingBanner}
            />
            
            {uploadingBanner && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Uploading...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• Recommended size: 1200x400 pixels (4:1 ratio)</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Supported formats: JPG, PNG, GIF</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Restaurant Information</span>
            </CardTitle>
            <CardDescription>
              Update your restaurant details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter restaurant name"
                className="h-10 md:h-12 text-sm md:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your restaurant"
                rows={3}
                className="text-sm md:text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter restaurant address"
                rows={2}
                className="text-sm md:text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="h-10 md:h-12 text-sm md:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">Admin WhatsApp Number</Label>
              <Input
                id="adminPhone"
                value={formData.adminPhone}
                onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                placeholder="Enter WhatsApp number (e.g., +919876543210)"
                className="h-10 md:h-12 text-sm md:text-base"
              />
              <p className="text-xs text-muted-foreground">
                This number will be used to send e-bills via WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-gray-50 h-10 md:h-12 text-sm md:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after registration
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full h-10 md:h-12 text-sm md:text-base"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <div className="space-y-6">
          <SubscriptionStatus 
            restaurant={restaurant} 
            onRenewal={() => window.location.reload()} 
          />

          {/* Feature Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Feature Permissions</span>
              </CardTitle>
              <CardDescription>
                Control which features are available for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Quick Order</div>
                    <div className="text-sm text-gray-600">Enable quick order functionality</div>
                  </div>
                  <Badge variant={restaurant?.quick_order_approved ? 'default' : 'secondary'}>
                    {restaurant?.quick_order_approved ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Analytics</div>
                    <div className="text-sm text-gray-600">Access to analytics and reports</div>
                  </div>
                  <Badge variant={restaurant?.analytics_approved ? 'default' : 'secondary'}>
                    {restaurant?.analytics_approved ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Customer Management</div>
                    <div className="text-sm text-gray-600">Manage customer database</div>
                  </div>
                  <Badge variant={restaurant?.customer_approved ? 'default' : 'secondary'}>
                    {restaurant?.customer_approved ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Inventory Management</div>
                    <div className="text-sm text-gray-600">Track inventory and stock levels</div>
                  </div>
                  <Badge variant={restaurant?.inventory_management_approved ? 'default' : 'secondary'}>
                    {restaurant?.inventory_management_approved ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Staff Management</div>
                    <div className="text-sm text-gray-600">Manage staff and attendance</div>
                  </div>
                  <Badge variant={restaurant?.staff_management_approved ? 'default' : 'secondary'}>
                    {restaurant?.staff_management_approved ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Contact support to enable additional features. Some features may require subscription upgrades.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Tax Settings</span>
              </CardTitle>
              <CardDescription>
                Configure tax settings for your menu prices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Tax</Label>
                  <div className="text-sm text-muted-foreground">
                    Add tax to menu item prices
                  </div>
                </div>
                <Switch
                  checked={formData.taxEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, taxEnabled: checked })
                  }
                />
              </div>

              {formData.taxEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        taxRate: parseFloat(e.target.value) || 0 
                      })
                    }
                    placeholder="Enter tax rate (e.g., 18 for 18%)"
                    className="h-10 md:h-12 text-sm md:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Common rates: GST 5%, 12%, 18%, or 28%
                  </p>
                </div>
              )}

              {formData.taxEnabled && formData.taxRate > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Example:</strong> ₹100 item will be displayed as ₹{(100 + (100 * formData.taxRate / 100)).toFixed(2)} (including {formData.taxRate}% tax)
                  </p>
                </div>
              )}

              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full h-10 md:h-12 text-sm md:text-base"
              >
                {saving ? 'Saving...' : 'Save Tax Settings'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 