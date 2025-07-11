"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
  Users,
  Clock,
  Star,
  Smartphone,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Target,
  Award,
  TrendingUp,
  Globe,
  Calendar,
  DollarSign,
  ShoppingCart,
  Utensils,
  Heart,
  Coffee,
  Pizza,
  Cake,
  Check,
  Headphones,
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img
                src="/TablEat_Logo.png"
                alt="TablEat"
                className="h-40 w-40"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("offerings")}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Our Offerings
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("restaurants")}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Restaurants
              </button>
              <button
                onClick={() => scrollToSection("journey")}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Our Journey
              </button>
              <button
                onClick={() => scrollToSection("founders")}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Founders
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Contact
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/login")}
                className="text-gray-700 hover:text-blue-600 hidden md:flex"
              >
                Login
              </Button>
              <Button
                onClick={() => router.push("/setup")}
                className="bg-blue-600 hover:bg-blue-700 hidden md:flex"
              >
                Get Started
              </Button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection("offerings")}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Our Offerings
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection("restaurants")}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Restaurants
                </button>
                <button
                  onClick={() => scrollToSection("journey")}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Our Journey
                </button>
                <button
                  onClick={() => scrollToSection("founders")}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Founders
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Contact
                </button>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/login")}
                    className="text-gray-700 hover:text-blue-600 justify-start"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => router.push("/setup")}
                    className="bg-blue-600 hover:bg-blue-700 justify-start"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              🚀 Trusted by 100+ Restaurants Across India
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Restaurant with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-600">
                {" "}
                TablEat
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Complete restaurant management solution with real-time orders,
              analytics, table management, and seamless customer experience.
              Join the digital revolution in dining.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push("/setup")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("restaurants")}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
              >
                See Success Stories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Offerings Section */}
      <section id="offerings" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Offerings
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for modern restaurants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 rounded-lg p-3 w-fit">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Real-time Order Management</CardTitle>
                <CardDescription>
                  Receive and manage orders instantly with live notifications
                  and automated workflow
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-green-100 rounded-lg p-3 w-fit">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Track sales, popular items, customer insights, and revenue
                  trends with detailed reports
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 rounded-lg p-3 w-fit">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Table Management</CardTitle>
                <CardDescription>
                  Manage reservations, table assignments, and dining flow
                  efficiently
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Menu Management</CardTitle>
                <CardDescription>
                  Update menu items, prices, and availability in real-time with
                  inventory tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-red-100 rounded-lg p-3 w-fit">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Secure Payment Processing</CardTitle>
                <CardDescription>
                  Multiple payment options with secure processing and automated
                  billing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-yellow-100 rounded-lg p-3 w-fit">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Manage staff schedules, permissions, and performance tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your restaurant. All plans include
              core features with no hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="relative border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-600">
                  Starter
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹999</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="mt-2">
                  Perfect for small restaurants and cafes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Menu Management (Unlimited items)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Table Management (Up to 20 tables)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Order Processing & Billing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Professional PDF Bills</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Customer Database</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Basic Analytics Dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Print-ready Invoices</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Real-time Order Updates</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Mobile-responsive Design</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative border-2 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-blue-600">
                  Professional
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹2,499</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="mt-2">
                  Ideal for growing restaurants with advanced needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-semibold">
                      Everything in Starter, plus:
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Advanced Analytics & Reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Staff Management & Attendance</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Inventory Management & Tracking</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>WhatsApp Bill Integration</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Real-time Notifications & Alerts</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Date-filtered Analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Revenue & Performance Tracking</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Stock Level Monitoring</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-blue-500 hover:bg-blue-600">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-purple-600">
                  Enterprise
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹4,999</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="mt-2">
                  Complete solution for large restaurants and chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-semibold">
                      Everything in Professional, plus:
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Multi-location Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Advanced Reporting & Export</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>API Access & Integrations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Priority Support (24/7)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Custom Branding & White-label</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Advanced Security Features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Dedicated Account Manager</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Custom Feature Development</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features Section */}
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-center mb-8">
              All Plans Include
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Secure & Reliable</h4>
                <p className="text-sm text-gray-600">
                  Bank-level security with 99.9% uptime guarantee
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Mobile Optimized</h4>
                <p className="text-sm text-gray-600">
                  Works perfectly on all devices - desktop, tablet, mobile
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Real-time Updates</h4>
                <p className="text-sm text-gray-600">
                  Instant synchronization across all connected devices
                </p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Headphones className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2">Expert Support</h4>
                <p className="text-sm text-gray-600">
                  Dedicated support team to help you succeed
                </p>
              </div>
            </div>
          </div>

          {/* Money-back Guarantee */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-2">
                30-Day Money-Back Guarantee
              </h3>
              <p className="text-green-100">
                Not satisfied? Get a full refund within 30 days, no questions
                asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section id="restaurants" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Leading Restaurants
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join successful restaurants that have transformed their operations
              with TablEat
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* BYTHEWAY Restaurant */}
            <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-orange-50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-full p-4 shadow-lg">
                    <ChefHat className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900">
                  BYTHEWAY Restaurant
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Premium dining experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">500+</div>
                    <div className="text-gray-500">Monthly Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600">4.8★</div>
                    <div className="text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">12 min</div>
                    <div className="text-gray-500">Avg Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">₹12.4K</div>
                    <div className="text-gray-500">Daily Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other Restaurants */}
            <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-full p-4 shadow-lg">
                    <Pizza className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900">
                  Spice Garden
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Authentic Indian cuisine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">750+</div>
                    <div className="text-gray-500">Monthly Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600">4.9★</div>
                    <div className="text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">8 min</div>
                    <div className="text-gray-500">Avg Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">₹18.2K</div>
                    <div className="text-gray-500">Daily Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-red-50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-full p-4 shadow-lg">
                    <Coffee className="h-12 w-12 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900">
                  Café Mocha
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Artisan coffee & pastries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">300+</div>
                    <div className="text-gray-500">Monthly Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600">4.7★</div>
                    <div className="text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">5 min</div>
                    <div className="text-gray-500">Avg Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">₹8.5K</div>
                    <div className="text-gray-500">Daily Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Journey Section */}
      <section id="journey" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From a simple idea to transforming the restaurant industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    2022 - The Vision
                  </h3>
                  <p className="text-gray-600">
                    Started with a vision to digitize restaurant operations and
                    improve customer dining experiences across India.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    2023 - First Launch
                  </h3>
                  <p className="text-gray-600">
                    Launched our MVP with 5 restaurants and processed over 1,000
                    orders in the first month.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    2025 - Rapid Growth
                  </h3>
                  <p className="text-gray-600">
                    Scaled to 100+ restaurants across 15 cities, processing over
                    50,000 orders monthly.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 rounded-full p-3">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    2025 - Future Vision
                  </h3>
                  <p className="text-gray-600">
                    Expanding to 1,000+ restaurants and introducing AI-powered
                    features for predictive analytics.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-orange-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">100+</div>
                    <div className="text-sm text-gray-600">Restaurants</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      50K+
                    </div>
                    <div className="text-sm text-gray-600">Monthly Orders</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">15</div>
                    <div className="text-sm text-gray-600">Cities</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600">
                      4.8★
                    </div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "Transforming the way restaurants operate, one order at a
                  time."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section id="founders" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Founders
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Passionate entrepreneurs with a vision to revolutionize the
              restaurant industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">Kaku</span>
                </div>
                <CardTitle className="text-xl">Kartiekey Bhardwaj</CardTitle>
                <CardDescription>Co-Founder & CEO</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Former tech lead with 8+ years of experience in building
                  scalable platforms. Passionate about using technology to solve
                  real-world problems.
                </p>
                <div className="flex justify-center space-x-2">
                  <Badge variant="secondary">Full-Stack Development</Badge>
                  <Badge variant="secondary">Operations</Badge>
                  <Badge variant="secondary">AI/ML</Badge>
                  <Badge variant="secondary">Product Strategy</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">Monu</span>
                </div>
                <CardTitle className="text-xl">Mandeep Choudhary</CardTitle>
                <CardDescription>Co-Founder & CEO</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Restaurant industry veteran with 10+ years of experience in
                  operations and management. Understands the pain points of
                  restaurant owners.
                </p>
                <div className="flex justify-center space-x-2">
                  <Badge variant="secondary">Restaurant Operations</Badge>
                  <Badge variant="secondary">Business Development</Badge>
                  <Badge variant="secondary">Marketing and Operations</Badge>
                  <Badge variant="secondary">Analytics</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join BYTHEWAY, Spice Garden, Café Mocha and hundreds of other
            restaurants already using TablEat
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/setup")}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">TablEat</span>
              </div>
              <p className="text-gray-400 mb-4">
                Complete restaurant management solution for modern businesses.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => scrollToSection("offerings")}
                    className="hover:text-white"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-white"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/login")}
                    className="hover:text-white"
                  >
                    Demo
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("restaurants")}
                    className="hover:text-white"
                  >
                    Case Studies
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => scrollToSection("journey")}
                    className="hover:text-white"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("founders")}
                    className="hover:text-white"
                  >
                    Team
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@tableat.in</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Bangalore, India</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 TablEat. All rights reserved. | Privacy Policy | Terms
              of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
