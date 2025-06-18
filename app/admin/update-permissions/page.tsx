'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { RefreshCw, Settings, CheckCircle, XCircle } from 'lucide-react'

export default function UpdatePermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/update-restaurant-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Restaurant permissions updated successfully!')
        setUpdated(true)
      } else {
        toast.error(`Failed to update permissions: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Update Restaurant Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Add missing permission fields to your restaurant document
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Permission Fields Update</span>
            </CardTitle>
            <CardDescription>
              This will add the missing permission fields to your restaurant with default values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Quick Order</div>
                  <div className="text-sm text-gray-600">Will be set to: false</div>
                </div>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Analytics</div>
                  <div className="text-sm text-gray-600">Will be set to: false</div>
                </div>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">Customer Management</div>
                  <div className="text-sm text-gray-600">Will be set to: true</div>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Inventory Management</div>
                  <div className="text-sm text-gray-600">Will be set to: false</div>
                </div>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Staff Management</div>
                  <div className="text-sm text-gray-600">Will be set to: false</div>
                </div>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                onClick={handleUpdate} 
                disabled={loading || updated}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : updated ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Updated Successfully!
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Update Restaurant Permissions
                  </>
                )}
              </Button>

              {updated && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Restaurant permissions have been updated successfully! The navigation will now show/hide menu items based on these permissions.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Missing permission fields will be added to your restaurant document</li>
              <li>• Navigation menu will automatically show/hide based on permissions</li>
              <li>• Admin can control permissions from the profile page</li>
              <li>• Restaurant open/close toggle will work in the header</li>
              <li>• You can enable features by updating the permissions in Firestore</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 