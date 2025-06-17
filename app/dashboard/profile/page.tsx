'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserCircle, Building, Mail, Phone, MapPin, Clock } from "lucide-react"
import {
  getRestaurantByAdminEmail,
  type Restaurant
} from '@/firebase/restaurant-service'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import SubscriptionStatus from '@/components/SubscriptionStatus'
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, restaurantName } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
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
              email: restaurantData.adminEmail || ''
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
        updatedAt: new Date()
      })
      
      // Update local state
      setRestaurant({
        ...restaurant,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone
      })
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Profile</h1>
          <p className="text-muted-foreground">
            Manage your restaurant information and subscription
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after registration
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
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

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span>Account Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Account Created</span>
                </div>
                <span className="text-sm font-medium">
                  {restaurant?.createdAt.toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Admin Email</span>
                </div>
                <span className="text-sm font-medium">
                  {user?.email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Restaurant ID</span>
                </div>
                <span className="text-sm font-medium">
                  {restaurant?.id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 