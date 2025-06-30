'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { RefreshCw, Settings, CheckCircle, XCircle, Info } from 'lucide-react'

export default function UpdatePermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/update-restaurant-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()
      setResponse(data)

      if (data.success) {
        toast.success('Permission fields updated successfully!')
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
            Add missing permission fields to your restaurant without overriding existing ones
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="h-5 w-5" />
              <span>Important Notice</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              This tool will only add missing permission fields. <strong>It will NOT override existing permissions that are already enabled.</strong> 
              If a permission is already set to true, it will remain true.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Permission Fields Update</span>
            </CardTitle>
            <CardDescription>
              This will add missing permission fields to your restaurant. Existing enabled permissions will be preserved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!response && (
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">Quick Order</div>
                    <div className="text-sm text-gray-600">Will be set to false only if missing</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Default: Disabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">Analytics</div>
                    <div className="text-sm text-gray-600">Will be set to false only if missing</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Default: Disabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">Customer Management</div>
                    <div className="text-sm text-gray-600">Will be set to true only if missing</div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Default: Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">Inventory Management</div>
                    <div className="text-sm text-gray-600">Will be set to false only if missing</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Default: Disabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">Staff Management</div>
                    <div className="text-sm text-gray-600">Will be set to false only if missing</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Default: Disabled
                  </Badge>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-3">
                {Object.keys(response.addedFields || {}).length > 0 ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Added Missing Fields:</h4>
                    <div className="space-y-1">
                      {Object.entries(response.addedFields).map(([key, value]) => (
                        <div key={key} className="text-sm text-green-700">
                          • {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value ? 'Enabled' : 'Disabled'}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ✅ All permission fields already exist! No updates were needed.
                    </p>
                  </div>
                )}

                {response.currentPermissions && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Current Permission Status:</h4>
                    <div className="grid gap-2">
                      {Object.entries(response.currentPermissions).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                    Check & Update Missing Permission Fields
                  </>
                )}
              </Button>

              {updated && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Permission fields have been updated! The navigation will now show/hide menu items based on these permissions.
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
              <li>• Only missing permission fields will be added to your restaurant document</li>
              <li>• Existing enabled permissions will be preserved</li>
              <li>• Navigation menu will automatically show/hide based on permissions</li>
              <li>• Admin can control permissions from the profile page or directly in Firestore</li>
              <li>• Restaurant open/close toggle will work in the header</li>
              <li>• To enable features, update the permissions in your Firestore database</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 