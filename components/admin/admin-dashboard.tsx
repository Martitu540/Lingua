
"use client"

import { useState } from "react"
import type { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Sparkles, PlusCircle, LayoutGrid, ListOrdered, BookOpen } from "lucide-react"

type Course = Database["public"]["Tables"]["courses"]["Row"]
type Unit = Database["public"]["Tables"]["units"]["Row"]
type Lesson = Database["public"]["Tables"]["lessons"]["Row"]

interface AdminDashboardProps {
  courses: Course[]
  units: Unit[]
  lessons: Lesson[]
}

export function AdminDashboard({ courses, units, lessons }: AdminDashboardProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courses[0]?.id)
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(
    units.find((u) => u.course_id === selectedCourseId)?.id,
  )

  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleCreateUnit = async (formData: FormData) => {
    const title = formData.get("title")?.toString().trim()
    const description = formData.get("description")?.toString().trim() || null
    const icon = formData.get("icon")?.toString().trim() || null
    const theme_color = formData.get("theme_color")?.toString().trim() || null

    if (!title || !selectedCourseId) {
      toast({ title: "Missing data", description: "Please select a course and enter a title.", variant: "destructive" })
      return
    }

    setLoading(true)
    const { error } = await supabase.from("units").insert({
      course_id: selectedCourseId,
      title,
      description,
      icon,
      theme_color,
      order_index:
        (units
          .filter((u) => u.course_id === selectedCourseId)
          .map((u) => u.order_index || 0)
          .sort((a, b) => b - a)[0] ?? 0) + 1,
    })
    setLoading(false)

    if (error) {
      console.error(error)
      toast({ title: "Error creating unit", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Unit created", description: "Refresh the page to see the new unit." })
    }
  }

  const handleCreateLesson = async (formData: FormData) => {
    const title = formData.get("title")?.toString().trim()
    const type = formData.get("type")?.toString().trim() || "vocabulary"
    const xp = Number(formData.get("xp_reward") || 10)
    const minutes = Number(formData.get("estimated_minutes") || 5)

    if (!title || !selectedUnitId) {
      toast({
        title: "Missing data",
        description: "Please select a unit and enter a title.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const { error } = await supabase.from("lessons").insert({
      unit_id: selectedUnitId,
      title,
      type,
      xp_reward: xp,
      estimated_minutes: minutes,
      order_index:
        (lessons
          .filter((l) => l.unit_id === selectedUnitId)
          .map((l) => l.order_index || 0)
          .sort((a, b) => b - a)[0] ?? 0) + 1,
    })
    setLoading(false)

    if (error) {
      console.error(error)
      toast({ title: "Error creating lesson", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Lesson created", description: "Refresh the page to see the new lesson." })
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-8 shadow-lg">
        <div className="absolute inset-0 pointer-events-none mesh-gradient opacity-60" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary">
                Admin workspace
              </Badge>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight">Learning Operations Console</h1>
            <p className="text-muted-foreground">
              Manage courses, units, and lessons with a streamlined, focused experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => location.reload()}>
              <Sparkles className="h-4 w-4" />
              Refresh data
            </Button>
            <Button className="gap-2" onClick={() => setSelectedUnitId(units.find((u) => u.course_id === selectedCourseId)?.id)}>
              <PlusCircle className="h-4 w-4" />
              Quick add
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <LayoutGrid className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{courses.length}</p>
            <p className="text-sm text-muted-foreground">Live language tracks</p>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
            <ListOrdered className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{units.length}</p>
            <p className="text-sm text-muted-foreground">Organized learning paths</p>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lessons.length}</p>
            <p className="text-sm text-muted-foreground">Ready-to-assign content</p>
          </CardContent>
        </Card>
      </div>

      {/* Builder */}
      <Card className="shadow-xl">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Content Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={selectedCourseId}
                onValueChange={(v) => {
                  setSelectedCourseId(v)
                  const firstUnit = units.find((u) => u.course_id === v)
                  setSelectedUnitId(firstUnit?.id)
                }}
              >
                <SelectTrigger className="h-12 rounded-xl">
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
              <Label>Unit</Label>
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units
                    .filter((u) => u.course_id === selectedCourseId)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="units" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="units">Create Unit</TabsTrigger>
              <TabsTrigger value="lessons">Create Lesson</TabsTrigger>
            </TabsList>

            <TabsContent value="units" className="pt-2">
              <form
                className="grid gap-4 md:grid-cols-2"
                action={(formData) => {
                  void handleCreateUnit(formData)
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Unit title</Label>
                  <Input id="title" name="title" placeholder="Basics 3" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon name</Label>
                  <Input id="icon" name="icon" placeholder="star" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Short description of this unit"
                    rows={3}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme_color">Theme color</Label>
                  <Input id="theme_color" name="theme_color" placeholder="emerald" className="h-12 rounded-xl" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={loading} className="w-full gap-2 rounded-xl">
                    <PlusCircle className="h-4 w-4" />
                    Create Unit
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="lessons" className="pt-2">
              <form
                className="grid gap-4 md:grid-cols-2"
                action={(formData) => {
                  void handleCreateLesson(formData)
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="lesson_title">Lesson title</Label>
                  <Input id="lesson_title" name="title" placeholder="Greetings 2" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="type" defaultValue="vocabulary">
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                      <SelectItem value="grammar">Grammar</SelectItem>
                      <SelectItem value="conversation">Conversation</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp_reward">XP reward</Label>
                  <Input id="xp_reward" name="xp_reward" type="number" defaultValue={10} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_minutes">Estimated minutes</Label>
                  <Input
                    id="estimated_minutes"
                    name="estimated_minutes"
                    type="number"
                    defaultValue={5}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={loading} className="w-full gap-2 rounded-xl">
                    <PlusCircle className="h-4 w-4" />
                    Create Lesson
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
