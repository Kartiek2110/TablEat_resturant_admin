"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TableItem {
  id: number
  status: "Occupied" | "Available" | "Cleaning" | "Reserved"
  capacity: number
}

const initialTables: TableItem[] = [
  { id: 1, status: "Occupied", capacity: 4 },
  { id: 2, status: "Available", capacity: 2 },
  { id: 3, status: "Occupied", capacity: 6 },
  { id: 4, status: "Available", capacity: 4 },
  { id: 5, status: "Cleaning", capacity: 2 },
  { id: 6, status: "Available", capacity: 8 },
]

export function TableManagement() {
  const [tables, setTables] = useState<TableItem[]>(initialTables)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentTable, setCurrentTable] = useState<TableItem | null>(null)

  const toggleTableStatus = (id: number) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id
          ? {
              ...table,
              status:
                table.status === "Occupied"
                  ? "Available"
                  : table.status === "Available"
                    ? "Cleaning"
                    : table.status === "Cleaning"
                      ? "Reserved"
                      : "Occupied",
            }
          : table,
      ),
    )
  }

  const handleAddTable = (newTable: Omit<TableItem, "id">) => {
    const newId = Math.max(...tables.map((t) => t.id)) + 1 // Simple ID generation
    setTables((prevTables) => [...prevTables, { id: newId, ...newTable }])
    setIsAddDialogOpen(false)
  }

  const handleEditTable = (updatedTable: TableItem | Omit<TableItem, "id">) => {
    if ('id' in updatedTable) {
      setTables((prevTables) => prevTables.map((table) => (table.id === updatedTable.id ? updatedTable : table)))
    }
    setIsEditDialogOpen(false)
    setCurrentTable(null)
  }

  const handleDeleteTable = (id: number) => {
    setTables((prevTables) => prevTables.filter((table) => table.id !== id))
  }

  const openEditDialog = (table: TableItem) => {
    setCurrentTable(table)
    setIsEditDialogOpen(true)
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Table Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1 bg-primary hover:bg-primary/90">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Table</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>Fill in the details for the new table.</DialogDescription>
            </DialogHeader>
            <TableForm onSubmit={handleAddTable} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="p-4 text-center shadow-sm">
              <CardTitle className="text-xl">Table {table.id}</CardTitle>
              <CardDescription className="mt-1">Capacity: {table.capacity}</CardDescription>
              <Badge
                className={`mt-2 cursor-pointer transition-colors duration-200 ${
                  table.status === "Occupied"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : table.status === "Available"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : table.status === "Cleaning"
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={() => toggleTableStatus(table.id)}
              >
                {table.status}
              </Badge>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => openEditDialog(table)}>
                  <Pencil className="h-4 w-4 text-accent" />
                  <span className="sr-only">Edit Table</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Table</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>

      {currentTable && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
              <DialogDescription>Make changes to the table details.</DialogDescription>
            </DialogHeader>
            <TableForm onSubmit={handleEditTable} initialData={currentTable} />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

interface TableFormProps {
  onSubmit: (table: TableItem | Omit<TableItem, "id">) => void
  initialData?: TableItem | null
}

function TableForm({ onSubmit, initialData }: TableFormProps) {
  const [capacity, setCapacity] = useState(initialData?.capacity.toString() || "")
  const [status, setStatus] = useState(initialData?.status || "Available")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tableData = {
      capacity: Number.parseInt(capacity),
      status: status as TableItem["status"],
    }
    if (initialData) {
      onSubmit({ ...initialData, ...tableData })
    } else {
      onSubmit(tableData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="capacity" className="text-right">
          Capacity
        </Label>
        <Input
          id="capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <Select value={status} onValueChange={(value: TableItem["status"]) => setStatus(value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Cleaning">Cleaning</SelectItem>
            <SelectItem value="Reserved">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {initialData ? "Save changes" : "Add Table"}
        </Button>
      </DialogFooter>
    </form>
  )
}
