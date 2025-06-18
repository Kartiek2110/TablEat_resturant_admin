'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit2, Trash2, Users, Clock, Shield, Eye, EyeOff, UserCheck, UserX, Calendar, Download, FileText } from "lucide-react"
import { 
  verifyStaffManagementCode,
  subscribeToStaffMembers,
  addStaffMember,
  updateStaffMember,
  subscribeToAttendance,
  markAttendance,
  getRestaurantByAdminEmail,
  type StaffMember,
  type AttendanceRecord,
  type Restaurant
} from '@/firebase/restaurant-service'
import { toast } from "sonner"
import * as XLSX from 'xlsx'

export default function StaffManagement() {
  const { restaurantName, user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authCode, setAuthCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false)
  const [isEditStaffDialogOpen, setIsEditStaffDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [exporting, setExporting] = useState(false)
  
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    phone: '',
    email: '',
    position: '' as StaffMember['position'] | '',
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true
  })

  const [attendanceFormData, setAttendanceFormData] = useState({
    status: 'present' as AttendanceRecord['status'],
    checkIn: '',
    checkOut: '',
    notes: ''
  })

  const positions: StaffMember['position'][] = ['waiter', 'chef', 'cashier', 'manager', 'cleaner']

  useEffect(() => {
    // Fetch restaurant data
    const fetchRestaurant = async () => {
      if (user?.email) {
        const restaurantData = await getRestaurantByAdminEmail(user.email)
        setRestaurant(restaurantData)
      }
    }
    fetchRestaurant()

    if (!restaurantName || !isAuthorized || !restaurant?.staff_management_approved) return

    const unsubscribeStaff = subscribeToStaffMembers(restaurantName, (staff) => {
      setStaffMembers(staff)
    })

    const unsubscribeAttendance = subscribeToAttendance(restaurantName, (attendance) => {
      setAttendanceRecords(attendance)
    })

    return () => {
      unsubscribeStaff()
      unsubscribeAttendance()
    }
  }, [restaurantName, isAuthorized, user?.email])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantName) return

    setLoading(true)
    try {
      const isValid = await verifyStaffManagementCode(restaurantName, authCode)
      if (isValid) {
        setIsAuthorized(true)
        toast.success("Access granted!")
      } else {
        toast.error("Invalid access code")
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      toast.error("Failed to verify access code")
    } finally {
      setLoading(false)
    }
  }

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantName) return

    try {
      if (!staffFormData.position) {
        toast.error("Please select a position")
        return
      }

      const staffData = {
        name: staffFormData.name.trim(),
        phone: staffFormData.phone.trim(),
        email: staffFormData.email.trim(),
        position: staffFormData.position,
        joinDate: new Date(staffFormData.joinDate),
        isActive: staffFormData.isActive
      }

      if (editingStaff) {
        await updateStaffMember(restaurantName, editingStaff.id, staffData)
        toast.success("Staff member updated successfully!")
        setIsEditStaffDialogOpen(false)
        setEditingStaff(null)
      } else {
        await addStaffMember(restaurantName, staffData)
        toast.success("Staff member added successfully!")
        setIsAddStaffDialogOpen(false)
      }

      resetStaffForm()
    } catch (error) {
      console.error('Error saving staff member:', error)
      toast.error("Failed to save staff member")
    }
  }

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff)
    setStaffFormData({
      name: staff.name,
      phone: staff.phone,
      email: staff.email || '',
      position: staff.position,
      joinDate: staff.joinDate.toISOString().split('T')[0],
      isActive: staff.isActive
    })
    setIsEditStaffDialogOpen(true)
  }

  const resetStaffForm = () => {
    setStaffFormData({
      name: '',
      phone: '',
      email: '',
      position: '',
      joinDate: new Date().toISOString().split('T')[0],
      isActive: true
    })
  }

  const handleMarkAttendance = (staff: StaffMember) => {
    setSelectedStaff(staff)
    const today = new Date()
    setAttendanceDate(today.toISOString().split('T')[0])
    
    const existingAttendance = attendanceRecords.find(
      record => record.staffId === staff.id && 
      record.date.toDateString() === today.toDateString()
    )
    
    if (existingAttendance) {
      setAttendanceFormData({
        status: existingAttendance.status,
        checkIn: existingAttendance.checkIn ? existingAttendance.checkIn.toTimeString().slice(0, 5) : '',
        checkOut: existingAttendance.checkOut ? existingAttendance.checkOut.toTimeString().slice(0, 5) : '',
        notes: existingAttendance.notes || ''
      })
    } else {
      setAttendanceFormData({
        status: 'present',
        checkIn: new Date().toTimeString().slice(0, 5),
        checkOut: '',
        notes: ''
      })
    }
    
    setIsAttendanceDialogOpen(true)
  }

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantName || !selectedStaff) return

    try {
      const attendanceData = {
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        date: new Date(attendanceDate),
        status: attendanceFormData.status,
        checkIn: attendanceFormData.checkIn ? new Date(`${attendanceDate}T${attendanceFormData.checkIn}`) : undefined,
        checkOut: attendanceFormData.checkOut ? new Date(`${attendanceDate}T${attendanceFormData.checkOut}`) : undefined,
        notes: attendanceFormData.notes.trim()
      }

      await markAttendance(restaurantName, attendanceData)
      toast.success("Attendance marked successfully!")
      setIsAttendanceDialogOpen(false)
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error("Failed to mark attendance")
    }
  }

  const getAttendanceForDate = (staffId: string, date: Date) => {
    return attendanceRecords.find(
      record => record.staffId === staffId && 
      record.date.toDateString() === date.toDateString()
    )
  }

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const styles = {
      present: "bg-green-50 text-green-700 border-green-200",
      absent: "bg-red-50 text-red-700 border-red-200",
      half_day: "bg-yellow-50 text-yellow-700 border-yellow-200",
      late: "bg-orange-50 text-orange-700 border-orange-200"
    }
    
    const labels = {
      present: "Present",
      absent: "Absent",
      half_day: "Half Day",
      late: "Late"
    }

    return (
      <Badge variant="secondary" className={styles[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const getPositionBadge = (position: StaffMember['position']) => {
    const styles = {
      manager: "bg-purple-50 text-purple-700 border-purple-200",
      chef: "bg-orange-50 text-orange-700 border-orange-200",
      waiter: "bg-blue-50 text-blue-700 border-blue-200",
      cashier: "bg-green-50 text-green-700 border-green-200",
      cleaner: "bg-gray-50 text-gray-700 border-gray-200"
    }

    return (
      <Badge variant="secondary" className={styles[position]}>
        {position.charAt(0).toUpperCase() + position.slice(1)}
      </Badge>
    )
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date
  }).reverse()

  // Export attendance to Excel
  const exportAttendanceToExcel = async () => {
    if (attendanceRecords.length === 0) {
      toast.error("No attendance data to export")
      return
    }

    setExporting(true)
    try {
      // Prepare data for Excel
      const excelData = attendanceRecords.map((record, index) => ({
        'S.No': index + 1,
        'Staff Name': record.staffName,
        'Date': record.date.toLocaleDateString(),
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
        'Check In': record.checkIn ? record.checkIn.toLocaleTimeString() : 'N/A',
        'Check Out': record.checkOut ? record.checkOut.toLocaleTimeString() : 'N/A',
        'Working Hours': record.checkIn && record.checkOut 
          ? ((record.checkOut.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) 
          : 'N/A',
        'Notes': record.notes || 'None',
        'Created At': record.createdAt.toLocaleDateString(),
        'Created Time': record.createdAt.toLocaleTimeString(),
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // S.No
        { wch: 20 },  // Staff Name
        { wch: 12 },  // Date
        { wch: 12 },  // Status
        { wch: 12 },  // Check In
        { wch: 12 },  // Check Out
        { wch: 15 },  // Working Hours
        { wch: 30 },  // Notes
        { wch: 12 },  // Created At
        { wch: 12 }   // Created Time
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0]
      const filename = `attendance_${restaurantName}_${currentDate}.xlsx`

      // Write and download file
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Attendance data exported successfully! (${attendanceRecords.length} records)`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error("Failed to export attendance data")
    } finally {
      setExporting(false)
    }
  }

  const isStaffApproved = restaurant?.staff_management_approved === true

  // Show approval required screen if not approved
  if (!isStaffApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle>Feature Not Approved</CardTitle>
            <CardDescription>
              Staff management feature is pending approval for your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2 text-sm text-gray-500">
              <p>⏳ <strong>Status:</strong> Waiting for admin approval</p>
              <p>📞 <strong>Contact:</strong> Reach out to support for activation</p>
              <p>🚀 <strong>Soon:</strong> Full staff management capabilities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Staff Management Access</CardTitle>
            <CardDescription>
              Enter the access code to manage staff and attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <Label htmlFor="authCode">Access Code</Label>
                <div className="relative">
                  <Input
                    id="authCode"
                    type={showPassword ? "text" : "password"}
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Enter access code"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Access Staff Management"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff members and track attendance
          </p>
        </div>
        <Button onClick={() => setIsAddStaffDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {staffMembers.filter(staff => staff.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {attendanceRecords.filter(record => 
                record.date.toDateString() === new Date().toDateString() && 
                ['present', 'late'].includes(record.status)
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {attendanceRecords.filter(record => 
                record.date.toDateString() === new Date().toDateString() && 
                record.status === 'absent'
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>Manage your restaurant staff members</CardDescription>
            </CardHeader>
            <CardContent>
              {staffMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            {staff.email && (
                              <div className="text-sm text-gray-500">{staff.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getPositionBadge(staff.position)}</TableCell>
                        <TableCell>{staff.phone}</TableCell>
                        <TableCell>{staff.joinDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {staff.isActive ? (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStaff(staff)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAttendance(staff)}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff members found</p>
                  <p className="text-sm">Add your first staff member to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendance Overview (Last 7 Days)</CardTitle>
                <CardDescription>Track staff attendance and working hours</CardDescription>
              </div>
              <Button
                onClick={exportAttendanceToExcel}
                disabled={exporting || attendanceRecords.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </CardHeader>
            <CardContent>
              {staffMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        {last7Days.map((date) => (
                          <TableHead key={date.toDateString()}>
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffMembers.filter(staff => staff.isActive).map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-gray-500">{staff.position}</div>
                            </div>
                          </TableCell>
                          {last7Days.map((date) => {
                            const attendance = getAttendanceForDate(staff.id, date)
                            return (
                              <TableCell key={`${staff.id}-${date.toDateString()}`}>
                                {attendance ? (
                                  <div className="space-y-1">
                                    {getStatusBadge(attendance.status)}
                                    {attendance.checkIn && (
                                      <div className="text-xs text-gray-500">
                                        In: {attendance.checkIn.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </div>
                                    )}
                                    {attendance.checkOut && (
                                      <div className="text-xs text-gray-500">
                                        Out: {attendance.checkOut.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </div>
                                    )}
                                    {attendance.notes && (
                                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded max-w-24 truncate" title={attendance.notes}>
                                        <FileText className="h-3 w-3 inline mr-1" />
                                        {attendance.notes}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline">No Record</Badge>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={isAddStaffDialogOpen || isEditStaffDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddStaffDialogOpen(false)
          setIsEditStaffDialogOpen(false)
          setEditingStaff(null)
          resetStaffForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update the staff member details.' : 'Add a new member to your team.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staffName">Name *</Label>
                <Input
                  id="staffName"
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({...staffFormData, name: e.target.value})}
                  placeholder="Staff member name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="staffPhone">Phone *</Label>
                <Input
                  id="staffPhone"
                  value={staffFormData.phone}
                  onChange={(e) => setStaffFormData({...staffFormData, phone: e.target.value})}
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="staffEmail">Email</Label>
              <Input
                id="staffEmail"
                type="email"
                value={staffFormData.email}
                onChange={(e) => setStaffFormData({...staffFormData, email: e.target.value})}
                placeholder="Email address (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staffPosition">Position *</Label>
                <Select 
                  value={staffFormData.position} 
                  onValueChange={(value: StaffMember['position']) => setStaffFormData({...staffFormData, position: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(position => (
                      <SelectItem key={position} value={position}>
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="staffJoinDate">Join Date *</Label>
                <Input
                  id="staffJoinDate"
                  type="date"
                  value={staffFormData.joinDate}
                  onChange={(e) => setStaffFormData({...staffFormData, joinDate: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="staffActive"
                checked={staffFormData.isActive}
                onChange={(e) => setStaffFormData({...staffFormData, isActive: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="staffActive">Active staff member</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddStaffDialogOpen(false)
                setIsEditStaffDialogOpen(false)
                setEditingStaff(null)
                resetStaffForm()
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingStaff ? 'Update' : 'Add'} Staff Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Attendance - {selectedStaff?.name}</DialogTitle>
            <DialogDescription>
              Record attendance for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAttendanceSubmit} className="space-y-4">
            <div>
              <Label htmlFor="attendanceDate">Date *</Label>
              <Input
                id="attendanceDate"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="attendanceStatus">Status *</Label>
              <Select 
                value={attendanceFormData.status} 
                onValueChange={(value: AttendanceRecord['status']) => 
                  setAttendanceFormData({...attendanceFormData, status: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {attendanceFormData.status !== 'absent' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">Check In</Label>
                  <Input
                    id="checkIn"
                    type="time"
                    value={attendanceFormData.checkIn}
                    onChange={(e) => setAttendanceFormData({...attendanceFormData, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check Out</Label>
                  <Input
                    id="checkOut"
                    type="time"
                    value={attendanceFormData.checkOut}
                    onChange={(e) => setAttendanceFormData({...attendanceFormData, checkOut: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="attendanceNotes">Notes</Label>
              <Textarea
                id="attendanceNotes"
                value={attendanceFormData.notes}
                onChange={(e) => setAttendanceFormData({...attendanceFormData, notes: e.target.value})}
                placeholder="Additional notes (optional)"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Mark Attendance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 