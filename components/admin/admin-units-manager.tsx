"use client"

import { useState } from "react"
import type { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { PlusCircle, Edit, Trash2, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Unit = Database["public"]["Tables"]["units"]["Row"]
type Course = Database["public"]["Tables"]["courses"]["Row"]

interface AdminUnitsManagerProps {
  units: Unit[]
  courses: Course[]
}

export function AdminUnitsManager({ units: initialUnits, courses }: AdminUnitsManagerProps) {
  const [units, setUnits] = useState(initialUnits)
  const [loading, setLoading] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    course_id: "",
  })

  const supabase = createClient()

  const handleCreate = async (fd: FormData) => {
    const title = fd.get("title")?.toString().trim()
    const description = fd.get("description")?.toString().trim() || null
    const courseId = formData.course_id || fd.get("course_id")?.toString()
    const icon = fd.get("icon")?.toString().trim() || null
    const themeColor = fd.get("theme_color")?.toString().trim() || null
    const orderIndex = Number(fd.get("order_index") || 0)

    if (!title || !courseId) {
      toast({ title: "Missing data", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("units")
      .insert({
        title,
        description,
        course_id: courseId,
        icon,
        theme_color: themeColor,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Unit created successfully." })
      setUnits([...units, data])
      setIsDialogOpen(false)
    }
    setLoading(false)
  }

  const handleUpdate = async (fd: FormData) => {
    if (!editingUnit) return

    const title = fd.get("title")?.toString().trim()
    const description = fd.get("description")?.toString().trim() || null
    const courseId = formData.course_id || fd.get("course_id")?.toString()
    const icon = fd.get("icon")?.toString().trim() || null
    const themeColor = fd.get("theme_color")?.toString().trim() || null
    const orderIndex = Number(fd.get("order_index") || 0)

    if (!title || !courseId) {
      toast({ title: "Missing data", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("units")
        .update({
          title,
          description,
          course_id: courseId,
          icon,
          theme_color: themeColor,
          order_index: orderIndex,
        })
        .eq("id", editingUnit.id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        toast({ 
          title: "Error", 
          description: error.message || error.details || "Failed to update unit. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Unit updated:", data)
        toast({ title: "Success", description: "Unit updated successfully." })
        setUnits(units.map((u) => (u.id === editingUnit.id ? data : u)))
        setEditingUnit(null)
        setIsDialogOpen(false)
        setFormData({ course_id: "" })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("units").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        toast({ 
          title: "Error", 
          description: error.message || error.details || "Failed to delete unit. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Unit deleted:", id)
        toast({ title: "Success", description: "Unit deleted successfully." })
        setUnits(units.filter((u) => u.id !== id))
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("order_index", { ascending: true })

      if (error) {
        console.error("Error refreshing units:", error)
        toast({ 
          title: "Error", 
          description: "Failed to refresh units. Please try again.", 
          variant: "destructive" 
        })
      } else {
        setUnits(data || [])
        toast({ title: "Success", description: "Units refreshed successfully." })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Units Management</h1>
          <p className="text-muted-foreground">Create, edit, and delete learning units</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingUnit(null)
                  setFormData({ course_id: "" })
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Edit Unit" : "Create New Unit"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); editingUnit ? handleUpdate(formData) : handleCreate(formData) }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" defaultValue={editingUnit?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingUnit?.description || ""} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course_id">Course *</Label>
                    <Select
                      name="course_id"
                      defaultValue={editingUnit?.course_id || formData.course_id}
                      onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_index">Order Index</Label>
                    <Input
                      id="order_index"
                      name="order_index"
                      type="number"
                      defaultValue={editingUnit?.order_index || 0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Input id="icon" name="icon" defaultValue={editingUnit?.icon || ""} placeholder="star" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme_color">Theme Color</Label>
                    <Input
                      id="theme_color"
                      name="theme_color"
                      defaultValue={editingUnit?.theme_color || ""}
                      placeholder="emerald"
                    />
                  </div>
                </div>
                {/* Hidden input for Select value */}
                <input type="hidden" name="course_id" value={formData.course_id} />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Processing..." : editingUnit ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <CardTitle>{unit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{unit.description || "No description"}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingUnit(unit)
                    setFormData({ course_id: unit.course_id || "" })
                    setIsDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(unit.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

