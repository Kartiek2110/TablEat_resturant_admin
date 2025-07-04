"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createAdminAccount, resetPassword } from "@/firebase/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, LogIn, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const [userNotFound, setUserNotFound] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUserNotFound(false)
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        router.push("/dashboard")
      } else {
        // Check if user doesn't exist
        if (result.error?.includes('auth/user-not-found') || result.error?.includes('user-not-found')) {
          setUserNotFound(true)
          setError(null)
        } else if (result.error?.includes('auth/wrong-password') || result.error?.includes('wrong-password')) {
          setError("Incorrect password. Please try again.")
        } else {
          setError(result.error || "Login failed. Please try again.")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    


    setLoading(true)

    try {
      const result = await createAdminAccount(email, password)
      
      if (result.success) {
        // Redirect to setup page after account creation
        router.push('/setup')
      } else {
        setError(result.error || 'Failed to create admin account')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await resetPassword(email)
      if (result.success) {
        setResetEmailSent(true)
        setShowForgotPassword(false)
        setError(null)
        setTimeout(() => setResetEmailSent(false), 10000)
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowCreateAccount(false)
    setShowForgotPassword(false)
    setError(null)
    setUserNotFound(false)
    setResetEmailSent(false)
    setPassword("")
    setConfirmPassword("")
  }

  const switchToCreateAccount = () => {
    setShowCreateAccount(true)
    setShowForgotPassword(false)
    setError(null)
    setUserNotFound(false)
    setResetEmailSent(false)
  }

  const switchToForgotPassword = () => {
    setShowForgotPassword(true)
    setShowCreateAccount(false)
    setError(null)
    setUserNotFound(false)
    setResetEmailSent(false)
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 px-4">
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-gradient-to-br from-orange-100/20 to-pink-100/20"></div>
        </div>
        
        <Card className="mx-auto max-w-lg w-full border-0 shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
          <CardHeader className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white rounded-t-lg p-10">
            <div className="text-center">
              <div className="flex items-center justify-center bg-white rounded-full w-24 h-24 mx-auto mb-6 backdrop-blur-sm">
                <img src="/TablEat_Logo.png" alt="TablEat Logo" className="w-24 h-24 mx-auto " />
              </div>
              <CardTitle className="text-3xl font-bold mb-2">Reset Password</CardTitle>
              <CardDescription className="text-orange-100 text-lg font-medium">
                Enter your email to receive a reset link
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-semibold text-gray-700 flex items-center">
                  Email Address
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your.restaurant@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  💡 We'll send a password reset link to this email
                </p>
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
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Sending Reset Email...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      📧 Send Reset Email
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showCreateAccount) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 px-4">
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-gradient-to-br from-emerald-100/20 to-teal-100/20"></div>
        </div>
        
        <Card className="mx-auto max-w-lg w-full border-0 shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
          <CardHeader className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-t-lg p-10">
            <div className="text-center">
              <div className="flex items-center justify-center bg-white rounded-full w-24 h-24 mx-auto mb-6 backdrop-blur-sm">
                <img src="/TablEat_Logo.png" alt="TablEat Logo" className="w-24 h-24 mx-auto " />
              </div>
              <CardTitle className="text-3xl font-bold mb-2">Create Restaurant Account</CardTitle>
              <CardDescription className="text-emerald-100 text-lg font-medium">
                Set up your restaurant account
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="create-email" className="text-sm font-semibold text-gray-700 flex items-center">
                  Email Address
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="your.restaurant@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  💡 Use your restaurant's email address
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Enter a secure password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  disabled={loading}
                  minLength={6}
                />
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
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus className="h-6 w-6 mr-3" />
                      Create Restaurant Account
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

      return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 px-4">
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-gradient-to-br from-blue-100/20 to-purple-100/20"></div>
        </div>
      
      <Card className="mx-auto max-w-lg w-full border-0 shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg p-10">
          <div className="text-center">
            <div className="bg-white rounded-full w-24 h-24 mx-auto mb-6 backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <img src="/TablEat_Logo.png" alt="TablEat Logo" className="w-24 h-24" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Restaurant Login</CardTitle>
            <CardDescription className="text-blue-100 text-lg font-medium">
              Restaurant Management System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          {accountCreated && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-medium text-base">
                ✅ Restaurant account created successfully! You can now login.
              </AlertDescription>
            </Alert>
          )}

          {resetEmailSent && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-800 font-medium text-base">
                📧 Password reset email sent! Check your inbox for the reset link.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.restaurant@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                disabled={loading}
              />
            </div>

            {userNotFound && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  <div className="space-y-2">
                    <p>User does not exist. Would you like to create a new account?</p>
                    <Button 
                      type="button"
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={switchToCreateAccount}
                    >
                      Create Account
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="h-6 w-6 mr-3" />
                    Login to Dashboard
                  </div>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline"
                  className="h-12 text-sm font-medium border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
                onClick={switchToCreateAccount}
                disabled={loading}
              >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="h-12 text-sm font-medium border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
                  onClick={switchToForgotPassword}
                  disabled={loading}
                >
                  🔑 Reset Password
              </Button>
              </div>
            </div>
          </form>
          <h1 className="text-center text-sm text-gray-500 mt-4">Version 1.0.0</h1>
        </CardContent>
      </Card>
    </div>
  )
}
