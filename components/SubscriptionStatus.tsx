import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertTriangle, CheckCircle, CreditCard } from "lucide-react"
import { getSubscriptionStatus, renewSubscription, type Restaurant } from '@/firebase/restaurant-service'
import { toast } from "sonner"

interface SubscriptionStatusProps {
  restaurant: Restaurant | null
  variant?: 'header' | 'card'
  onRenewal?: () => void
}

export default function SubscriptionStatus({ restaurant, variant = 'card', onRenewal }: SubscriptionStatusProps) {
  const [isRenewing, setIsRenewing] = useState(false)

  if (!restaurant) return null

  const subscriptionStatus = getSubscriptionStatus(restaurant)
  const { isValid, daysRemaining, status } = subscriptionStatus

  const handleRenewal = async (months: number = 1) => {
    if (!restaurant) return
    
    try {
      setIsRenewing(true)
      await renewSubscription(restaurant.name, months)
      toast.success(`Subscription renewed for ${months} month${months > 1 ? 's' : ''}!`)
      onRenewal?.()
    } catch (error) {
      console.error('Error renewing subscription:', error)
      toast.error('Failed to renew subscription')
    } finally {
      setIsRenewing(false)
    }
  }

  const getStatusColor = () => {
    if (daysRemaining > 7) return 'green'
    if (daysRemaining > 3) return 'yellow'
    return 'red'
  }

  const getStatusText = () => {
    if (daysRemaining === 0) return 'Expired'
    if (daysRemaining === 1) return '1 day remaining'
    return `${daysRemaining} days remaining`
  }

  if (variant === 'header') {
    return (
      <div className="flex items-center space-x-3">
        <Badge 
          variant={isValid && daysRemaining > 7 ? "secondary" : isValid ? "outline" : "destructive"}
          className={`${
            isValid && daysRemaining > 7 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : isValid 
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <Calendar className="h-3 w-3 mr-1" />
          Service: {getStatusText()}
        </Badge>
        {!isValid && (
          <Button 
            size="sm" 
            onClick={() => handleRenewal(1)}
            disabled={isRenewing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Renew Now
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={`${!isValid ? 'border-red-200 bg-red-50' : daysRemaining <= 7 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className={`h-5 w-5 ${daysRemaining > 7 ? 'text-green-600' : 'text-yellow-600'}`} />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span>Service Subscription</span>
        </CardTitle>
        <CardDescription>
          Monthly TablEat service subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`font-semibold ${
              isValid && daysRemaining > 7 
                ? 'text-green-700' 
                : isValid 
                  ? 'text-yellow-700'
                  : 'text-red-700'
            }`}>
              {getStatusText()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Valid Until</p>
            <p className="font-medium">
              {restaurant.subscriptionEnd.toLocaleDateString()}
            </p>
          </div>
        </div>

        {!isValid && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Your service has expired. Renew now to continue using TablEat services.
            </AlertDescription>
          </Alert>
        )}

        {isValid && daysRemaining <= 7 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your service expires soon. Consider renewing to avoid interruption.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={() => handleRenewal(1)}
            disabled={isRenewing}
            variant={!isValid ? "default" : "outline"}
            className={!isValid ? "bg-blue-600 hover:bg-blue-700 flex-1" : "flex-1"}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isRenewing ? 'Processing...' : 'Renew 1 Month'}
          </Button>
          <Button 
            onClick={() => handleRenewal(3)}
            disabled={isRenewing}
            variant="outline"
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Renew 3 Months
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Account created: {restaurant.createdAt.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )
} 