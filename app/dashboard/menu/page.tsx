"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  ChefHat,
  DollarSign,
  Tag,
  ImageIcon,
  AlertCircle,
  Star,
  Package,
  Upload,
  Search,
} from "lucide-react";
import {
  subscribeToMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  calculateDiscountedPrice,
  getDiscountDisplayText,
  subscribeToInventoryItems,
  updateMenuItemIngredients,
  getRestaurantByAdminEmail,
  checkPremiumSubscription,
  type MenuItem,
  type InventoryItem,
  type MenuItemIngredient,
  type Restaurant
} from "@/firebase/restaurant-service";
import { toast } from "sonner";

export default function MenuManagement() {
  const { restaurantName, user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newlyCreatedItem, setNewlyCreatedItem] = useState<MenuItem | null>(null);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    available: true,
    isBestSeller: false,
    isCombo: false,
    hasDiscount: false,
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    discountValidFrom: "",
    discountValidTo: "",
    imageSource: "url",
  });
  
  const [comboItems, setComboItems] = useState<{name: string, price: string}[]>([{ name: "", price: "" }])

  // Compress image to reduce size
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Handle image file upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploadingImage(true)
    
    try {
      // Compress image to reduce size for Firestore storage
      const compressedBase64 = await compressImage(file, 800, 0.7)
      
      // Check if compressed image is still too large (Firebase limit is ~1MB)
      // Base64 adds ~33% overhead, so we need to be well under 1MB
      const sizeInBytes = (compressedBase64.length * 3) / 4
      if (sizeInBytes > 700000) { // 700KB limit to be safe
        // Try with higher compression
        const moreCompressed = await compressImage(file, 600, 0.5)
        const newSize = (moreCompressed.length * 3) / 4
        if (newSize > 700000) {
          toast.error('Image is too large even after compression. Please use a smaller image.')
          return
        }
        setFormData(prev => ({ ...prev, image: moreCompressed }))
      } else {
        setFormData(prev => ({ ...prev, image: compressedBase64 }))
      }
      
      toast.success('Image uploaded and compressed successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Categories for dropdown
  const categories = [
    "Appetizers",
    "Baked",
    "Barbecue",
    "Beverages",
    "Biryani",
    "Bread",
    "Breakfast",
    "Burgers",
    "Burritos",
    "Cakes",
    "Chicken",
    "Chinese",
    "Cold Coffee", 
    "Coffee",
    "Combo",
    "Continental",
    "Curry",
    "Desserts",
    "Dim Sum",
    "Dips",
    "Drinks",
    "Eggs",
    "Fast Food",
    "Fish",
    "Fries",
    "Hot Chocolate",
    "Hot Coffee",
    "Ice Cream",
    "Indian",
    "Indo-Chinese",
    "Italian",
    "Japanese",
    "Juices",
    "Korean",
    "Lebanese",
    "Main Course",
    "Mediterranean",
    "Mexican",
    "Middle Eastern",
    "Milkshakes",
    "Mocktails",
    "Momos",
    "Mutton",
    "Nachos",
    "Noodles",
    "North Indian",
    "Pasta",
    "Pastries",
    "Pizza",
    "Pork",
    "Quesadillas",
    "Rice",
    "Rolls",
    "Salads",
    "Sandwiches",
    "Seafood",
    "Shakes",
    "Sides",
    "Smoothies",
    "Snacks",
    "South Indian",
    "Soups",
    "Steaks",
    "Street Food",
    "Sushi",
    "Tacos",
    "Tea",
    "Thai",
    "Thalis",
    "Vegan",
    "Vegetarian",
    "Vietnamese",
    "Wings",
    "Wraps"
  ];

  useEffect(() => {
    if (!restaurantName) return;

    // Always subscribe to menu items (no authentication required)
    const unsubscribeMenu = subscribeToMenuItems(restaurantName, (items) => {
      setMenuItems(items);
      setLoading(false); // Menu is loaded, that's all we need for basic functionality
    });

    // Fetch restaurant data for premium features (optional)
    let inventoryUnsubscribe: (() => void) | undefined;
    
    if (user?.email && restaurantName) {
      const fetchRestaurant = async () => {
        try {
          const restaurantData = await getRestaurantByAdminEmail(user.email!);
          setRestaurant(restaurantData);
          
          // Only subscribe to inventory if approved for inventory management
          if (restaurantData?.inventory_management_approved === true) {
            try {
              inventoryUnsubscribe = subscribeToInventoryItems(restaurantName, (items) => {
                setInventoryItems(items);
              });
            } catch (inventoryError) {
              console.warn('Could not subscribe to inventory items:', inventoryError);
              // This is fine - inventory is optional for menu management
            }
          }
        } catch (error) {
          console.warn('Could not fetch restaurant data:', error);
          // This is fine - restaurant data is optional for basic menu management
        }
      };
      
      fetchRestaurant();
    }

    return () => {
      unsubscribeMenu();
      if (inventoryUnsubscribe) {
        inventoryUnsubscribe();
      }
    };
  }, [restaurantName, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantName) return;

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        toast.error("Please enter a valid price");
        return;
      }

      // Prepare discount data
      let discountData = undefined;
      if (formData.hasDiscount && formData.discountValue) {
        const discountValue = parseFloat(formData.discountValue);
        if (!isNaN(discountValue) && discountValue > 0) {
          discountData = {
            isActive: true,
            type: formData.discountType,
            value: discountValue,
            validFrom: formData.discountValidFrom ? new Date(formData.discountValidFrom) : undefined,
            validTo: formData.discountValidTo ? new Date(formData.discountValidTo) : undefined,
          };
        }
      }

      const itemData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price,
        available: formData.available,
        isBestSeller: formData.isBestSeller,
        isCombo: formData.category === "Combo",
      };

      // Only add fields if they have values (avoid undefined)
      if (formData.image.trim()) {
        // Final safety check for image size before sending to Firebase
        const imageSizeInBytes = (formData.image.length * 3) / 4
        if (imageSizeInBytes > 700000) { // 700KB limit to be safe
          toast.error('Image is too large for Firebase storage. Please use a smaller image or compress it further.')
          return
        }
        itemData.image = formData.image.trim();
      }

      if (discountData) {
        itemData.discount = discountData;
      }

      if (editingItem) {
        await updateMenuItem(restaurantName, editingItem.id, itemData);
        toast.success("Menu item updated successfully!");
        setIsEditDialogOpen(false);
        setEditingItem(null);
      } else {
        const newItem = await addMenuItem(restaurantName, itemData);
        toast.success("Menu item added successfully!");
        setIsAddDialogOpen(false);
        
        // Show ingredients popup for newly created items (premium + approved + inventory available)
        const isPremium = restaurant ? checkPremiumSubscription(restaurant) : false;
        const isInventoryApproved = restaurant?.inventory_management_approved === true;
        if (isPremium && isInventoryApproved && inventoryItems.length > 0) {
          setNewlyCreatedItem(newItem);
          setIngredients([]);
          setIsIngredientsDialogOpen(true);
        }
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        image: "",
        available: true,
        isBestSeller: false,
        isCombo: false,
        hasDiscount: false,
        discountType: "percentage",
        discountValue: "",
        discountValidFrom: "",
        discountValidTo: "",
        imageSource: "url",
      });
      setComboItems([]);
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast.error("Failed to save menu item");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    
    // Determine image source - if image starts with data: it's a base64 uploaded image
    const isUploadedImage = item.image?.startsWith('data:') || false
    
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price.toString(),
      image: item.image || "",
      available: item.available,
      isBestSeller: item.isBestSeller || false,
      isCombo: item.isCombo || false,
      hasDiscount: Boolean(item.discount?.isActive),
      discountType: item.discount?.type || "percentage",
      discountValue: item.discount?.value?.toString() || "",
      discountValidFrom: item.discount?.validFrom ? item.discount.validFrom.toISOString().split('T')[0] : "",
      discountValidTo: item.discount?.validTo ? item.discount.validTo.toISOString().split('T')[0] : "",
      imageSource: isUploadedImage ? "file" : "url",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!restaurantName) return;

    try {
      await deleteMenuItem(restaurantName, itemId);
      toast.success("Menu item deleted successfully!");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      image: "",
      available: true,
      isBestSeller: false,
      isCombo: false,
      hasDiscount: false,
      discountType: "percentage",
      discountValue: "",
      discountValidFrom: "",
      discountValidTo: "",
      imageSource: "url",
    });
    setComboItems([]);
    setEditingItem(null);
  };

  // Ingredients management functions
  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: '', name: '', quantity: 0, unit: '' }]);
  };

  const updateIngredient = (index: number, field: keyof MenuItemIngredient, value: string | number) => {
    const updated = [...ingredients];
    if (field === 'inventoryItemId' && typeof value === 'string') {
      const inventoryItem = inventoryItems.find(item => item.id === value);
      if (inventoryItem) {
        updated[index] = {
          ...updated[index],
          inventoryItemId: value,
          name: inventoryItem.name,
          unit: inventoryItem.unit
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const saveIngredients = async () => {
    if (!restaurantName || !newlyCreatedItem) return;

    try {
      const validIngredients = ingredients.filter(ing => ing.inventoryItemId && ing.quantity > 0);
      if (validIngredients.length > 0) {
        await updateMenuItemIngredients(restaurantName, newlyCreatedItem.id, validIngredients);
        toast.success("Ingredients added successfully!");
      }
      setIsIngredientsDialogOpen(false);
      setNewlyCreatedItem(null);
    } catch (error) {
      console.error('Error updating ingredients:', error);
      toast.error("Failed to add ingredients");
    }
  };

  const skipIngredients = () => {
    setIsIngredientsDialogOpen(false);
    setNewlyCreatedItem(null);
    setIngredients([]);
  };

  // Filter menu items based on search term
  const filteredMenuItems = menuItems.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage your restaurant's menu items, categories, and pricing
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:h-12 text-sm md:text-base"
            />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
              <Button onClick={resetForm} className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-base whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
                Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Add a new item to your restaurant menu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the menu item"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="space-y-4">
                  {/* Image Source Selection */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="imageUrl"
                        name="imageSource"
                        checked={formData.imageSource === 'url'}
                        onChange={() => setFormData({ ...formData, imageSource: 'url', image: '' })}
                      />
                      <Label htmlFor="imageUrl">Image URL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="imageFile"
                        name="imageSource"
                        checked={formData.imageSource === 'file'} 
                        onChange={() => setFormData({ ...formData, imageSource: 'file', image: '' })}
                      />
                      <Label htmlFor="imageFile">Upload from Computer</Label>
                    </div>
                  </div>

                  {/* URL Input */}
                  {formData.imageSource === 'url' && (
                    <Input
                      id="image"
                      type="url" 
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  )}

                  {/* File Upload */}
                  {formData.imageSource === 'file' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {formData.image ? (
                            <div className="space-y-2">
                              <img 
                                src={formData.image} 
                                alt="Preview" 
                                className="w-24 h-24 object-cover rounded-lg mx-auto"
                              />
                              <p className="text-sm text-green-600 font-medium">Image uploaded successfully!</p>
                              <p className="text-xs text-gray-500">Click to change image</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-12 w-12 mx-auto text-gray-400" />
                              <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                              <p className="text-xs text-gray-500">Max 5MB • JPG, PNG, GIF</p>
                            </div>
                          )}
                          
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {formData.image && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="w-full"
                        >
                          Remove Image
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, available: checked })
                  }
                />
                <Label htmlFor="available">Available for order</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="bestSeller"
                  checked={formData.isBestSeller}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBestSeller: checked })
                  }
                />
                <Label htmlFor="bestSeller">Mark as Best Seller</Label>
              </div>

              {/* Discount Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasDiscount"
                    checked={formData.hasDiscount}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasDiscount: checked })
                    }
                  />
                  <Label htmlFor="hasDiscount">Add Discount</Label>
                </div>

                {formData.hasDiscount && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Discount Type</Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={(value: "percentage" | "fixed") =>
                            setFormData({ ...formData, discountType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountValue">
                          {formData.discountType === "percentage" 
                            ? "Percentage (0-100)" 
                            : "Amount (₹)"}
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          step={formData.discountType === "percentage" ? "1" : "0.01"}
                          min="0"
                          max={formData.discountType === "percentage" ? "100" : undefined}
                          value={formData.discountValue}
                          onChange={(e) =>
                            setFormData({ ...formData, discountValue: e.target.value })
                          }
                          placeholder={formData.discountType === "percentage" ? "10" : "50.00"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="discountValidFrom">Valid From (Optional)</Label>
                        <Input
                          id="discountValidFrom"
                          type="date"
                          value={formData.discountValidFrom}
                          onChange={(e) =>
                            setFormData({ ...formData, discountValidFrom: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountValidTo">Valid To (Optional)</Label>
                        <Input
                          id="discountValidTo"
                          type="date"
                          value={formData.discountValidTo}
                          onChange={(e) =>
                            setFormData({ ...formData, discountValidTo: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {formData.discountValue && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        💡 Preview: Original price ₹{formData.price || "0"} → 
                        Discounted price ₹{
                          formData.price && formData.discountValue 
                            ? formData.discountType === "percentage"
                              ? (parseFloat(formData.price) * (1 - parseFloat(formData.discountValue) / 100)).toFixed(2)
                              : Math.max(parseFloat(formData.price) - parseFloat(formData.discountValue), 0).toFixed(2)
                            : "0"
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.category === "Combo" && (
                <div className="space-y-3">
                  <Label className="font-medium">Combo Items</Label>
                  <div className="space-y-2">
                    {comboItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...comboItems]
                            newItems[index].name = e.target.value
                            setComboItems(newItems)
                          }}
                        />
                        <Input
                          placeholder="Price (₹)"
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const newItems = [...comboItems]
                            newItems[index].price = e.target.value
                            setComboItems(newItems)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setComboItems([...comboItems, { name: "", price: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Menu Statistics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {menuItems.filter((item) => item.available).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(menuItems.map((item) => item.category)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Sale</CardTitle>
            🏷️
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {menuItems.filter(item => getDiscountDisplayText(item)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>
            {searchTerm ? `Found ${filteredMenuItems.length} items matching "${searchTerm}"` : 'Manage your restaurant\'s menu items'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No items found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try a different search term or add a new menu item
                  </p>
                </>
              ) : (
                <>
              <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No menu items yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start building your menu by adding your first item
              </p>
                </>
              )}
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredMenuItems.map((item) => (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base md:text-lg line-clamp-1">{item.name}</CardTitle>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={item.available ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                          {item.isBestSeller && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                              ⭐ Best Seller
                            </Badge>
                          )}
                          {item.isCombo && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              🍽️ Combo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Menu Item
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.name}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.image && (
                      <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.isCombo && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                            🍽️ Combo
                          </Badge>
                        )}
                        {item.isBestSeller && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                            ⭐ Best Seller
                          </Badge>
                        )}
                        {getDiscountDisplayText(item) && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                            🏷️ {getDiscountDisplayText(item)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        <div className="text-right">
                          {(() => {
                            const { originalPrice, discountedPrice, hasDiscount } = calculateDiscountedPrice(item)
                            return hasDiscount ? (
                              <div className="space-y-1">
                                <div className="text-sm text-gray-500 line-through">
                                  ₹{originalPrice.toFixed(2)}
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  ₹{discountedPrice.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-green-600">
                                ₹{originalPrice.toFixed(2)}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Make changes to your menu item
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe the menu item"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, price: e.target.value }))
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div className="space-y-4">
                {/* Image Source Selection */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-imageUrl"
                      name="edit-imageSource"
                      checked={formData.imageSource === 'url'}
                      onChange={() => setFormData(prev => ({ ...prev, imageSource: 'url' }))}
                    />
                    <Label htmlFor="edit-imageUrl">Image URL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-imageFile"
                      name="edit-imageSource"
                      checked={formData.imageSource === 'file'} 
                      onChange={() => setFormData(prev => ({ ...prev, imageSource: 'file' }))}
                    />
                    <Label htmlFor="edit-imageFile">Upload from Computer</Label>
                  </div>
                </div>

                {/* URL Input */}
                {formData.imageSource === 'url' && (
                  <Input
                    id="edit-image"
                    type="url" 
                    value={formData.image}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, image: e.target.value }))
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                )}

                {/* File Upload */}
                {formData.imageSource === 'file' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.image ? (
                          <div className="space-y-2">
                            <img 
                              src={formData.image} 
                              alt="Preview" 
                              className="w-24 h-24 object-cover rounded-lg mx-auto"
                            />
                            <p className="text-sm text-green-600 font-medium">Image uploaded successfully!</p>
                            <p className="text-xs text-gray-500">Click to change image</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                            <p className="text-xs text-gray-500">Max 5MB • JPG, PNG, GIF</p>
                          </div>
                        )}
                        
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Uploading...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.image && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="w-full"
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-available"
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, available: checked }))
                }
              />
              <Label htmlFor="edit-available">Available for order</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-bestSeller"
                checked={formData.isBestSeller}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, isBestSeller: checked }))
                }
              />
              <Label htmlFor="edit-bestSeller">Mark as Best Seller</Label>
            </div>

            {/* Discount Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-hasDiscount"
                  checked={formData.hasDiscount}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, hasDiscount: checked }))
                  }
                />
                <Label htmlFor="edit-hasDiscount">Add Discount</Label>
              </div>

              {formData.hasDiscount && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-discountType">Discount Type</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value: "percentage" | "fixed") =>
                          setFormData({ ...formData, discountType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-discountValue">
                        {formData.discountType === "percentage" 
                          ? "Percentage (0-100)" 
                          : "Amount (₹)"}
                      </Label>
                      <Input
                        id="edit-discountValue"
                        type="number"
                        step={formData.discountType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={formData.discountType === "percentage" ? "100" : undefined}
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValue: e.target.value })
                        }
                        placeholder={formData.discountType === "percentage" ? "10" : "50.00"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-discountValidFrom">Valid From (Optional)</Label>
                      <Input
                        id="edit-discountValidFrom"
                        type="date"
                        value={formData.discountValidFrom}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValidFrom: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-discountValidTo">Valid To (Optional)</Label>
                      <Input
                        id="edit-discountValidTo"
                        type="date"
                        value={formData.discountValidTo}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValidTo: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {formData.discountValue && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      💡 Preview: Original price ₹{formData.price || "0"} → 
                      Discounted price ₹{
                        formData.price && formData.discountValue 
                          ? formData.discountType === "percentage"
                            ? (parseFloat(formData.price) * (1 - parseFloat(formData.discountValue) / 100)).toFixed(2)
                            : Math.max(parseFloat(formData.price) - parseFloat(formData.discountValue), 0).toFixed(2)
                          : "0"
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            {formData.category === "Combo" && (
              <div className="space-y-3">
                <Label className="font-medium">Combo Items</Label>
                <div className="space-y-2">
                  {comboItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...comboItems]
                          newItems[index].name = e.target.value
                          setComboItems(newItems)
                        }}
                      />
                      <Input
                        placeholder="Price (₹)"
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...comboItems]
                          newItems[index].price = e.target.value
                          setComboItems(newItems)
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setComboItems([...comboItems, { name: "", price: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ingredients Dialog - Premium Feature */}
      <Dialog open={isIngredientsDialogOpen} onOpenChange={(open) => {
        if (!open) {
          skipIngredients();
        }
      }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              🍽️ Define Ingredients - {newlyCreatedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Help us track inventory by defining what ingredients are used to make this item.
              This will automatically update your inventory when orders are served.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {ingredients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No ingredients added yet</p>
                <p className="text-sm">Click "Add Ingredient" to start defining ingredients</p>
              </div>
            ) : (
              ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Inventory Item</Label>
                    <Select
                      value={ingredient.inventoryItemId}
                      onValueChange={(value) => updateIngredient(index, 'inventoryItemId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Unit</Label>
                    <Input
                      value={ingredient.unit}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button type="button" variant="outline" onClick={addIngredient} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-gray-500">
              💡 You can always add ingredients later from the Inventory page
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={skipIngredients}>
                Skip for Now
              </Button>
              <Button type="button" onClick={saveIngredients}>
                Save Ingredients
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
}
