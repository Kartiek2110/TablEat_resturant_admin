"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  onAuthStateChange,
  firebaseSignIn,
  firebaseSignOut,
  extractRestaurantName,
  completeRestaurantSetup,
} from "../firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  getRestaurantByAdminEmail,
  type Restaurant,
} from "../firebase/restaurant-service";
import { auth } from "../firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createAccount: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<void>;
  restaurantName: string | null;
  restaurant: Restaurant | null;
  setupCompleted: boolean;
  completeSetup: (
    restaurantName: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshRestaurant: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch by only mounting on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't run on server

    const unsubscribe = onAuthStateChange(async (user, restaurantName) => {
      setUser(user);

      if (user && db) {
        try {
          // Check user's setup status
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            setSetupCompleted(adminData.setupCompleted || false);
            setRestaurantName(adminData.restaurantName || null);
          } else {
            setSetupCompleted(false);
            setRestaurantName(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setSetupCompleted(false);
          setRestaurantName(restaurantName || null);
        }
      } else {
        setSetupCompleted(false);
        setRestaurantName(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await firebaseSignIn(email, password);
      if (result.success) {
        // User state will be updated by the auth listener
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: "Login failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut();
      setUser(null);
      setRestaurantName(null);
      setSetupCompleted(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async (restaurantName: string) => {
    if (!user) return { success: false, error: "User not authenticated" };

    setLoading(true);
    try {
      const result = await completeRestaurantSetup(user.uid, restaurantName);
      if (result.success) {
        setRestaurantName(
          restaurantName
            .replace(/[^a-zA-Z0-9_\s]/g, "")
            .replace(/\s+/g, "_")
            .toUpperCase()
        );
        setSetupCompleted(true);
      }
      return result;
    } catch (error) {
      return { success: false, error: "Setup failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  // Create account wrapper
  const createAccount = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Reset password wrapper
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  // Function to refresh restaurant data
  const refreshRestaurant = async () => {
    if (user?.email) {
      try {
        console.log("🔍 AuthContext: Fetching restaurant data...");
        const restaurantData = await getRestaurantByAdminEmail(user.email);
        console.log("🔍 AuthContext: Restaurant data loaded:", restaurantData);
        console.log("🔍 AuthContext: Permissions:", {
          quick_order_approved: restaurantData?.quick_order_approved,
          analytics_approved: restaurantData?.analytics_approved,
          customer_approved: restaurantData?.customer_approved,
          inventory_management_approved:
            restaurantData?.inventory_management_approved,
          staff_management_approved: restaurantData?.staff_management_approved,
        });
        setRestaurant(restaurantData);
      } catch (error) {
        console.warn("Could not load restaurant data:", error);
      }
    } else {
      setRestaurant(null);
    }
  };

  // Load restaurant data when user changes
  useEffect(() => {
    if (user?.email) {
      console.log("🔍 AuthContext: Loading restaurant data for:", user.email);
      refreshRestaurant();
    }
  }, [user?.email]);

  // Also refresh when mounted and user exists
  useEffect(() => {
    if (mounted && user?.email) {
      console.log(
        "🔍 AuthContext: Component mounted, refreshing restaurant data"
      );
      refreshRestaurant();
    }
  }, [mounted, user?.email]);

  const value: AuthContextType = {
    user,
    loading,
    restaurantName,
    restaurant,
    setupCompleted,
    login,
    logout,
    createAccount,
    resetPassword,
    completeSetup,
    refreshRestaurant,
    isAuthenticated: !!user,
  };

  // Prevent rendering until mounted on client
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Authentication guard component
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push("/login");
    }
  }, [user, loading, router, mounted]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
