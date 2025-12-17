"use client"

import { useState } from "react"
import type { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type Lesson = Database["public"]["Tables"]["lessons"]["Row"]
type Unit = Database["public"]["Tables"]["units"]["Row"]

interface AdminLessonsManagerProps {
  lessons: Lesson[]
  units: Unit[]
}

export function AdminLessonsManager({ lessons: initialLessons, units }: AdminLessonsManagerProps) {
  const [lessons, setLessons] = useState(initialLessons)
  const [loading, setLoading] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    unit_id: "",
    type: "vocabulary",
    is_premium: "false",
  })

  const supabase = createClient()

  const handleCreate = async (fd: FormData) => {
    const title = fd.get("title")?.toString().trim()
    const unitId = formData.unit_id || fd.get("unit_id")?.toString()
    const type = formData.type || fd.get("type")?.toString() || "vocabulary"
    const xpReward = Number(fd.get("xp_reward") || 10)
    const estimatedMinutes = Number(fd.get("estimated_minutes") || 5)
    const orderIndex = Number(fd.get("order_index") || 0)
    const isPremium = formData.is_premium === "true" || fd.get("is_premium") === "true"

    if (!title || !unitId) {
      toast({ title: "Missing data", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          title,
          unit_id: unitId,
          type,
          xp_reward: xpReward,
          estimated_minutes: estimatedMinutes,
          order_index: orderIndex,
          is_premium: isPremium,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        toast({ 
          title: "Error", 
          description: error.message || error.details || "Failed to create lesson. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Lesson created:", data)
        toast({ title: "Success", description: "Lesson created successfully." })
        setLessons([...lessons, data])
        setIsDialogOpen(false)
        setFormData({ unit_id: "", type: "vocabulary", is_premium: "false" })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (fd: FormData) => {
    if (!editingLesson) return

    const title = fd.get("title")?.toString().trim()
    const unitId = formData.unit_id || fd.get("unit_id")?.toString()
    const type = formData.type || fd.get("type")?.toString() || "vocabulary"
    const xpReward = Number(fd.get("xp_reward") || 10)
    const estimatedMinutes = Number(fd.get("estimated_minutes") || 5)
    const orderIndex = Number(fd.get("order_index") || 0)
    const isPremium = formData.is_premium === "true" || fd.get("is_premium") === "true"

    if (!title || !unitId) {
      toast({ title: "Missing data", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("lessons")
        .update({
          title,
          unit_id: unitId,
          type,
          xp_reward: xpReward,
          estimated_minutes: estimatedMinutes,
          order_index: orderIndex,
          is_premium: isPremium,
        })
        .eq("id", editingLesson.id)
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
          description: error.message || error.details || "Failed to update lesson. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Lesson updated:", data)
        toast({ title: "Success", description: "Lesson updated successfully." })
        setLessons(lessons.map((l) => (l.id === editingLesson.id ? data : l)))
        setEditingLesson(null)
        setIsDialogOpen(false)
        setFormData({ unit_id: "", type: "vocabulary", is_premium: "false" })
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
      const { data, error } = await supabase.from("lessons").select("*").order("order_index", { ascending: true })
      if (error) {
        console.error("Refresh error:", error)
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else if (data) {
        setLessons(data)
        toast({ title: "Refreshed", description: "Lesson list updated." })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: "Failed to refresh lessons", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id)

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
          description: error.message || error.details || "Failed to delete lesson. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Lesson deleted:", id)
        toast({ title: "Success", description: "Lesson deleted successfully." })
        setLessons(lessons.filter((l) => l.id !== id))
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
          <h1 className="text-3xl font-bold">Lessons Management</h1>
          <p className="text-muted-foreground">Create, edit, and delete lessons</p>
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
                  setEditingLesson(null)
                  setFormData({ unit_id: "", type: "vocabulary", is_premium: "false" })
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingLesson ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); editingLesson ? handleUpdate(formData) : handleCreate(formData) }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" defaultValue={editingLesson?.title} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_id">Unit *</Label>
                    <Select
                      name="unit_id"
                      defaultValue={editingLesson?.unit_id || formData.unit_id}
                      onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      name="type"
                      defaultValue={editingLesson?.type || formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="conversation">Conversation</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="xp_reward">XP Reward</Label>
                    <Input
                      id="xp_reward"
                      name="xp_reward"
                      type="number"
                      defaultValue={editingLesson?.xp_reward || 10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_minutes">Minutes</Label>
                    <Input
                      id="estimated_minutes"
                      name="estimated_minutes"
                      type="number"
                      defaultValue={editingLesson?.estimated_minutes || 5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_index">Order</Label>
                    <Input
                      id="order_index"
                      name="order_index"
                      type="number"
                      defaultValue={editingLesson?.order_index || 0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_premium">Premium</Label>
                  <Select name="is_premium" defaultValue={editingLesson?.is_premium ? "true" : "false"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Free</SelectItem>
                      <SelectItem value="true">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Hidden inputs for Select values */}
                <input type="hidden" name="unit_id" value={formData.unit_id} />
                <input type="hidden" name="type" value={formData.type} />
                <input type="hidden" name="is_premium" value={formData.is_premium} />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Processing..." : editingLesson ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <CardTitle>{lesson.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Type: {lesson.type}</p>
              <p className="text-sm text-muted-foreground mb-4">XP: {lesson.xp_reward}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingLesson(lesson)
                    setFormData({
                      unit_id: lesson.unit_id || "",
                      type: lesson.type || "vocabulary",
                      is_premium: lesson.is_premium ? "true" : "false",
                    })
                    setIsDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(lesson.id)}>
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

