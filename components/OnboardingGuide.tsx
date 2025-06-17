'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  X, 
  Lightbulb,
  Menu,
  Users,
  Tags,
  Receipt,
  Settings,
  Crown,
  ChefHat
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  path?: string
  action?: string
}

interface OnboardingGuideProps {
  onComplete?: () => void
  onSkip?: () => void
}

export default function OnboardingGuide({ onComplete, onSkip }: OnboardingGuideProps) {
  const { restaurantName } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [showGuide, setShowGuide] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Restaurant Dashboard',
      description: `Welcome to ${restaurantName?.replace(/_/g, ' ') || 'your restaurant'} admin panel! This is your central hub for managing all restaurant operations.`,
      icon: <Crown className="h-6 w-6 text-blue-600" />,
      completed: true,
    },
    {
      id: 'menu',
      title: 'Add Your Menu Items',
      description: 'Start by adding your restaurant\'s menu items. Include prices, descriptions, categories, and allergen information.',
      icon: <ChefHat className="h-6 w-6 text-green-600" />,
      completed: false,
      path: '/dashboard/menu',
      action: 'Add menu items with categories like appetizers, main courses, desserts, and beverages.'
    },
    {
      id: 'tables',
      title: 'Set Up Your Tables',
      description: 'Configure your restaurant tables with seating capacity and location (indoor/outdoor/private).',
      icon: <Users className="h-6 w-6 text-purple-600" />,
      completed: false,
      path: '/dashboard/tables',
      action: 'Add tables with their capacity and preferred locations.'
    },
    {
      id: 'discounts',
      title: 'Create Discount Campaigns',
      description: 'Set up promotional offers, happy hour discounts, or seasonal campaigns to attract customers.',
      icon: <Tags className="h-6 w-6 text-orange-600" />,
      completed: false,
      path: '/dashboard/discounts',
      action: 'Create discounts for different time periods and customer segments.'
    },
    {
      id: 'billing',
      title: 'Use the Billing System',
      description: 'Learn how to generate bills, process payments, and print professional invoices for customers.',
      icon: <Receipt className="h-6 w-6 text-red-600" />,
      completed: false,
      path: '/dashboard/billing',
      action: 'Generate bills and print invoices with your restaurant branding.'
    },
    {
      id: 'settings',
      title: 'Customize Settings',
      description: 'Update restaurant information, operating hours, contact details, and other preferences.',
      icon: <Settings className="h-6 w-6 text-gray-600" />,
      completed: false,
      path: '/dashboard/settings',
      action: 'Configure restaurant details and operational preferences.'
    }
  ]

  const progress = (completedSteps.length / steps.length) * 100

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem(`onboarding-${restaurantName}`)
    if (hasSeenOnboarding) {
      setShowGuide(false)
    }
  }, [restaurantName])

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(`onboarding-${restaurantName}`, 'completed')
    setShowGuide(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(`onboarding-${restaurantName}`, 'skipped')
    setShowGuide(false)
    onSkip?.()
  }

  if (!showGuide) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep].title}
              </CardTitle>
              <Badge variant="outline" className="mb-4">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div className="flex justify-center mb-4">
            {steps[currentStep].icon}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          {steps[currentStep].action && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">What to do:</h4>
                  <p className="text-blue-700 text-sm">{steps[currentStep].action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  index === currentStep
                    ? 'bg-blue-50 border-blue-200'
                    : index < currentStep
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : index === currentStep ? (
                    <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${
                    index === currentStep ? 'text-blue-900' : 
                    index < currentStep ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
              >
                Skip Tour
              </Button>
              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Quick Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>All data is saved automatically and synced in real-time</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>You can edit any information anytime from the dashboard</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Invoices include your restaurant branding automatically</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>TablEat support is available for any assistance needed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick Help Button Component
export function QuickHelpButton() {
  const [showHelp, setShowHelp] = useState(false)
  const { restaurantName } = useAuth()

  const showOnboardingAgain = () => {
    localStorage.removeItem(`onboarding-${restaurantName}`)
    setShowHelp(true)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={showOnboardingAgain}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 shadow-lg"
      >
        <Lightbulb className="h-4 w-4" />
        Help
      </Button>

      {showHelp && (
        <OnboardingGuide
          onComplete={() => setShowHelp(false)}
          onSkip={() => setShowHelp(false)}
        />
      )}
    </>
  )
} 