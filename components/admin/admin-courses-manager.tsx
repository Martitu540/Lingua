"use client"

import { useState } from "react"
import React from "react"
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

type Course = Database["public"]["Tables"]["courses"]["Row"]
type Language = Database["public"]["Tables"]["languages"]["Row"]

interface AdminCoursesManagerProps {
  courses: Course[]
  languages: Language[]
}

export function AdminCoursesManager({ courses: initialCourses, languages }: AdminCoursesManagerProps) {
  const [courses, setCourses] = useState(initialCourses)
  const [loading, setLoading] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    source_language_id: "",
    target_language_id: "",
    is_premium: "false",
  })

  const supabase = createClient()

  // Debug: Check admin status
  React.useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, email")
          .eq("id", user.id)
          .single()
        console.log("Admin status check:", { 
          userId: user.id, 
          email: profile?.email, 
          isAdmin: profile?.is_admin 
        })
        if (!profile?.is_admin) {
          console.warn("⚠️ User is not set as admin! Run scripts/009-quick-admin-fix.sql in Supabase SQL Editor")
        }
      }
    }
    checkAdmin()
  }, [])

  const handleCreate = async (fd: FormData) => {
    const title = fd.get("title")?.toString().trim()
    const description = fd.get("description")?.toString().trim() || null
    const sourceLanguageId = formData.source_language_id || fd.get("source_language_id")?.toString()
    const targetLanguageId = formData.target_language_id || fd.get("target_language_id")?.toString()
    const isPremium = formData.is_premium === "true" || fd.get("is_premium") === "true"

    console.log("Creating course:", { title, sourceLanguageId, targetLanguageId, isPremium, formData })

    if (!title || !sourceLanguageId || !targetLanguageId) {
      toast({ 
        title: "Missing data", 
        description: `Please fill all required fields. Title: ${!!title}, Source: ${!!sourceLanguageId}, Target: ${!!targetLanguageId}`, 
        variant: "destructive" 
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          source_language_id: sourceLanguageId,
          target_language_id: targetLanguageId,
          is_premium: isPremium,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        toast({ 
          title: "Error", 
          description: error.message || error.details || "Failed to create course. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Course created:", data)
        toast({ title: "Success", description: "Course created successfully." })
        setCourses([...courses, data])
        setIsDialogOpen(false)
        setFormData({ source_language_id: "", target_language_id: "", is_premium: "false" })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (fd: FormData) => {
    if (!editingCourse) return

    const title = fd.get("title")?.toString().trim()
    const description = fd.get("description")?.toString().trim() || null
    const sourceLanguageId = formData.source_language_id || fd.get("source_language_id")?.toString() || editingCourse.source_language_id
    const targetLanguageId = formData.target_language_id || fd.get("target_language_id")?.toString() || editingCourse.target_language_id
    const isPremium = formData.is_premium === "true" || fd.get("is_premium") === "true" || editingCourse.is_premium

    console.log("Updating course:", { title, sourceLanguageId, targetLanguageId, isPremium, formData, editingCourse })

    if (!title || !sourceLanguageId || !targetLanguageId) {
      toast({ 
        title: "Missing data", 
        description: `Please fill all required fields. Title: ${!!title}, Source: ${!!sourceLanguageId}, Target: ${!!targetLanguageId}`, 
        variant: "destructive" 
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("courses")
        .update({
          title,
          description,
          source_language_id: sourceLanguageId,
          target_language_id: targetLanguageId,
          is_premium: isPremium,
        })
        .eq("id", editingCourse.id)
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
          description: error.message || error.details || "Failed to update course. Check console for details.", 
          variant: "destructive" 
        })
      } else {
        console.log("Course updated:", data)
        toast({ title: "Success", description: "Course updated successfully." })
        setCourses(courses.map((c) => (c.id === editingCourse.id ? data : c)))
        setEditingCourse(null)
        setIsDialogOpen(false)
        setFormData({ source_language_id: "", target_language_id: "", is_premium: "false" })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    setLoading(true)
    const { error } = await supabase.from("courses").delete().eq("id", id)

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
        description: error.message || error.details || "Failed to delete course. Check console for details.", 
        variant: "destructive" 
      })
    } else {
      toast({ title: "Success", description: "Course deleted successfully." })
      setCourses(courses.filter((c) => c.id !== id))
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: true })
      if (error) {
        console.error("Refresh error:", error)
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else if (data) {
        setCourses(data)
        toast({ title: "Refreshed", description: "Course list updated." })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: "Failed to refresh courses", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses Management</h1>
          <p className="text-muted-foreground">Create, edit, and delete language courses</p>
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
                  setEditingCourse(null)
                  setFormData({ source_language_id: "", target_language_id: "", is_premium: "false" })
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? "Update course information" : "Add a new language course"}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  editingCourse ? handleUpdate(fd) : handleCreate(fd)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingCourse?.title}
                    placeholder="Spanish for Beginners"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingCourse?.description || ""}
                    placeholder="Course description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source_language_id">Source Language *</Label>
                    <Select
                      name="source_language_id"
                      defaultValue={editingCourse?.source_language_id || formData.source_language_id}
                      onValueChange={(value) => setFormData({ ...formData, source_language_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_language_id">Target Language *</Label>
                    <Select
                      name="target_language_id"
                      defaultValue={editingCourse?.target_language_id || formData.target_language_id}
                      onValueChange={(value) => setFormData({ ...formData, target_language_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_premium">Premium Course</Label>
                  <Select
                    name="is_premium"
                    defaultValue={editingCourse?.is_premium ? "true" : formData.is_premium}
                    onValueChange={(value) => setFormData({ ...formData, is_premium: value })}
                  >
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
                <input type="hidden" name="source_language_id" value={formData.source_language_id} />
                <input type="hidden" name="target_language_id" value={formData.target_language_id} />
                <input type="hidden" name="is_premium" value={formData.is_premium} />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Processing..." : editingCourse ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{course.title}</span>
                {course.is_premium && (
                  <Badge variant="outline" className="border-gold text-gold">
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{course.description || "No description"}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingCourse(course)
                    setFormData({
                      source_language_id: course.source_language_id || "",
                      target_language_id: course.target_language_id || "",
                      is_premium: course.is_premium ? "true" : "false",
                    })
                    setIsDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(course.id)}>
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

