"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createRestaurant } from "@/firebase/restaurant-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Store } from "lucide-react"

export default function SetupPage() {
  const [restaurantName, setRestaurantName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { completeSetup, user, setupCompleted } = useAuth()

  // Redirect if already setup or not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  if (setupCompleted) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!restaurantName.trim()) {
      setError('Please enter your restaurant name')
      setLoading(false)
      return
    }

    if (restaurantName.length < 2 || restaurantName.length > 50) {
      setError('Restaurant name must be between 2 and 50 characters')
      setLoading(false)
      return
    }

    try {
      const result = await completeSetup(restaurantName.trim())
      
      if (result.success && user?.email) {
        // Create the restaurant in Firebase with the user-provided name
        const cleanName = restaurantName.replace(/[^a-zA-Z0-9_\s]/g, '').replace(/\s+/g, '_').toUpperCase()
        await createRestaurant(cleanName, user.email)
        router.push('/dashboard/profile')
      } else {
        setError(result.error || 'Failed to complete setup')
      }
    } catch (err) {
      console.error('Setup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 px-4">
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full bg-gradient-to-br from-green-100/20 to-teal-100/20"></div>
      </div>
      
      <Card className="mx-auto max-w-lg w-full border-0 shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
        <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-lg p-10">
          <div className="text-center">
            <div className="flex items-center justify-center bg-white rounded-full w-24 h-24 mx-auto mb-6 backdrop-blur-sm">
              <Store className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Complete Your Setup</CardTitle>
            <CardDescription className="text-green-100 text-lg font-medium">
              Tell us about your restaurant
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium text-base">
              🎉 Your account has been created! Now let's set up your restaurant.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name" className="text-sm font-semibold text-gray-700 flex items-center">
                Restaurant Name *
              </Label>
              <Input
                id="restaurant-name"
                type="text"
                placeholder="e.g., Bistro Delight, Pizza Corner, The Coffee House"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                disabled={loading}
                maxLength={50}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg flex-1 mr-2">
                  💡 This will be your restaurant's display name in the system
                </p>
                <span className="text-xs text-gray-400">
                  {restaurantName.length}/50
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
                disabled={loading || !restaurantName.trim()}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Setting up restaurant...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Store className="h-6 w-6 mr-3" />
                    Complete Setup
                  </div>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500">
              <p className="mb-2">What happens next?</p>
              <div className="space-y-1 text-xs">
                <p>✅ Your restaurant dashboard will be created</p>
                <p>✅ You can start adding menu items</p>
                <p>✅ Begin managing your restaurant operations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 