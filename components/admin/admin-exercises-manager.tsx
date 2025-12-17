"use client"

import { useMemo, useState } from "react"
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

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type Lesson = Database["public"]["Tables"]["lessons"]["Row"]

interface AdminExercisesManagerProps {
  exercises: Exercise[]
  lessons: Lesson[]
}

type ExerciseType = "multiple_choice" | "fill_blank" | "translation" | "listening" | "matching" | "reorder_sentence" | "dialogue" | "drag_drop" | "speaking"

export function AdminExercisesManager({ exercises: initialExercises, lessons }: AdminExercisesManagerProps) {
  const [exercises, setExercises] = useState(initialExercises || [])
  const [loading, setLoading] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [exerciseType, setExerciseType] = useState<ExerciseType>("multiple_choice")
  const [formData, setFormData] = useState<any>({})

  const supabase = createClient()

  const exercisesByLesson = useMemo(() => {
    const grouped: Record<string, Exercise[]> = {}
    lessons.forEach((lesson) => {
      grouped[lesson.id] = []
    })

    exercises.forEach((exercise) => {
      const bucket = grouped[exercise.lesson_id] || []
      bucket.push(exercise)
      grouped[exercise.lesson_id] = bucket.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    })

    return grouped
  }, [exercises, lessons])

  const ungroupedExercises = useMemo(
    () => exercises.filter((exercise) => !lessons.find((lesson) => lesson.id === exercise.lesson_id)),
    [exercises, lessons],
  )

  // Debug: Log initial data
  console.log("AdminExercisesManager - Initial exercises:", initialExercises?.length || 0)
  console.log("AdminExercisesManager - Initial lessons:", lessons?.length || 0)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("exercises").select("*").order("order_index", { ascending: true })
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else if (data) {
        setExercises(data)
        toast({ title: "Refreshed", description: "Exercise list updated." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (fd: FormData) => {
    const lessonId = formData.lesson_id || fd.get("lesson_id")?.toString()
    const type = exerciseType || fd.get("type")?.toString() || "multiple_choice"
    const orderIndex = Number(fd.get("order_index") || 0)
    const difficulty = Number(fd.get("difficulty") || 1)
    const explanation = fd.get("explanation")?.toString() || ""

    if (!lessonId) {
      toast({ title: "Missing data", description: "Please select a lesson.", variant: "destructive" })
      return
    }

    // Build content based on exercise type
    const content = buildContentFromForm(fd, type)

    if (!content) {
      toast({ title: "Invalid data", description: "Please fill all required fields for this exercise type.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          lesson_id: lessonId,
          type,
          order_index: orderIndex,
          difficulty,
          content,
          explanation,
        })
        .select()
        .single()

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Exercise created successfully." })
        setExercises([...exercises, data])
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (fd: FormData) => {
    if (!editingExercise) return

    const lessonId = formData.lesson_id || fd.get("lesson_id")?.toString()
    const type = exerciseType || editingExercise.type
    const orderIndex = Number(fd.get("order_index") || editingExercise.order_index)
    const difficulty = Number(fd.get("difficulty") || editingExercise.difficulty)
    const explanation = fd.get("explanation")?.toString() || editingExercise.explanation || ""

    if (!lessonId) {
      toast({ title: "Missing data", description: "Please select a lesson.", variant: "destructive" })
      return
    }

    const content = buildContentFromForm(fd, type)

    if (!content) {
      toast({ title: "Invalid data", description: "Please fill all required fields for this exercise type.", variant: "destructive" })
      return
    }

    // Clean the content to remove empty/undefined fields
    const cleanedContent = cleanContent(content)

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("exercises")
        .update({
          lesson_id: lessonId,
          type,
          order_index: orderIndex,
          difficulty,
          content: cleanedContent, // Use cleaned content
          explanation: explanation || null, // Set to null if empty
        })
        .eq("id", editingExercise.id)
        .select()
        .single()

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Exercise updated successfully." })
        setExercises(exercises.map((e) => (e.id === editingExercise.id ? data : e)))
        setEditingExercise(null)
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exercise?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id)

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Exercise deleted successfully." })
        setExercises(exercises.filter((e) => e.id !== id))
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Clean object: remove undefined, null, and empty string values
  // This ensures that when updating, removed fields are actually removed from the database
  const cleanContent = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.length > 0 ? obj : undefined
    }
    if (typeof obj !== "object" || obj === null) {
      return obj
    }
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values (they won't be included in JSON)
      if (value === undefined) {
        continue
      }
      // Include null values (they explicitly clear fields)
      if (value === null) {
        cleaned[key] = null
        continue
      }
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value
        }
        // Skip empty arrays (they'll be removed)
        continue
      }
      // Handle strings - only include non-empty strings
      if (typeof value === "string") {
        if (value.trim() !== "") {
          cleaned[key] = value
        }
        // Skip empty strings (they'll be removed)
        continue
      }
      // Include other types (numbers, booleans, objects)
      cleaned[key] = value
    }
    return cleaned
  }

  const buildContentFromForm = (fd: FormData, type: ExerciseType): any => {
    switch (type) {
      case "multiple_choice":
        const question = fd.get("question")?.toString()?.trim()
        const optionsStr = fd.get("options")?.toString() || ""
        const options = optionsStr.split("\n").filter((o) => o.trim())
        const correctIndex = Number(fd.get("correct_index") || 0)
        if (!question || options.length < 2) return null
        // Return only fields for multiple_choice, explicitly exclude others
        return { question, options, correct_index: correctIndex }

      case "fill_blank":
        const sentence = fd.get("sentence")?.toString()?.trim()
        const blankIndex = Number(fd.get("blank_index") || 0)
        const correctAnswersStr = fd.get("correct_answers")?.toString() || ""
        const correctAnswers = correctAnswersStr.split("\n").filter((a) => a.trim())
        const hint = fd.get("hint")?.toString()?.trim() || ""
        const translation = fd.get("translation")?.toString()?.trim() || ""
        if (!sentence || correctAnswers.length === 0) return null
        // Return only fill_blank fields - empty optional fields will be removed by cleanContent
        return { 
          sentence, 
          blank_index: blankIndex, 
          correct_answers: correctAnswers, 
          ...(hint ? { hint } : {}),
          ...(translation ? { translation } : {})
        }

      case "translation":
        const prompt = fd.get("prompt")?.toString()?.trim()
        const transCorrectAnswersStr = fd.get("trans_correct_answers")?.toString() || ""
        const transCorrectAnswers = transCorrectAnswersStr.split("\n").filter((a) => a.trim())
        const transHint = fd.get("trans_hint")?.toString()?.trim() || ""
        if (!prompt || transCorrectAnswers.length === 0) return null
        // Return only translation fields - empty hint will be removed
        return { 
          prompt, 
          correct_answers: transCorrectAnswers, 
          ...(transHint ? { hint: transHint } : {})
        }

      case "listening":
        const audioText = fd.get("audio_text")?.toString()?.trim()
        const listenCorrectAnswersStr = fd.get("listen_correct_answers")?.toString() || ""
        const listenCorrectAnswers = listenCorrectAnswersStr.split("\n").filter((a) => a.trim())
        const mode = fd.get("listen_mode")?.toString() || "input"
        const listenOptionsStr = fd.get("listen_options")?.toString() || ""
        const listenOptions = listenOptionsStr.split("\n").filter((o) => o.trim())
        const language = fd.get("language")?.toString() || "es"
        if (!audioText || listenCorrectAnswers.length === 0) return null
        // Return only listening fields, conditionally include options
        const listeningContent: any = {
          audio_text: audioText,
          correct_answers: listenCorrectAnswers,
          mode,
          language,
        }
        if (mode === "choice" && listenOptions.length > 0) {
          listeningContent.options = listenOptions
        }
        return listeningContent

      case "matching":
        const leftStr = fd.get("matching_left")?.toString() || ""
        const rightStr = fd.get("matching_right")?.toString() || ""
        const left = leftStr.split("\n").filter((l) => l.trim())
        const right = rightStr.split("\n").filter((r) => r.trim())
        const correctPairsStr = fd.get("correct_pairs")?.toString() || ""
        const correctPairs = correctPairsStr.split("\n")
          .filter((p) => p.trim())
          .map((p) => {
            const [l, r] = p.split(":").map((s) => s.trim())
            return l && r ? [l, r] : null
          })
          .filter((p) => p !== null)
        if (left.length === 0 || right.length === 0 || left.length !== right.length) return null
        // Return only matching fields - empty correct_pairs will be removed
        return { 
          left, 
          right, 
          ...(correctPairs.length > 0 ? { correct_pairs: correctPairs } : {})
        }

      case "reorder_sentence":
        const reorderQuestion = fd.get("reorder_question")?.toString()?.trim() || ""
        const wordsStr = fd.get("reorder_words")?.toString() || ""
        const words = wordsStr.split("\n").filter((w) => w.trim())
        const correctOrderStr = fd.get("correct_order")?.toString() || ""
        const correctOrder = correctOrderStr.split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n))
        if (words.length === 0 || correctOrder.length !== words.length) return null
        // Return only reorder_sentence fields (uses "correct" not "correct_order")
        return { 
          ...(reorderQuestion ? { question: reorderQuestion } : {}),
          words, 
          correct: correctOrder 
        }

      case "dialogue":
        const turnsStr = fd.get("dialogue_turns")?.toString() || ""
        const turns = turnsStr.split("\n\n")
          .filter((turn) => turn.trim())
          .map((turn) => {
            const [speaker, text] = turn.split(":").map((s) => s.trim())
            return speaker && text ? { speaker, text } : null
          })
          .filter((t) => t !== null)
        if (turns.length === 0) return null
        // Return only dialogue fields
        return { turns }

      case "drag_drop":
        const itemsStr = fd.get("drag_items")?.toString() || ""
        const items = itemsStr.split("\n").filter((i) => i.trim())
        const dragCorrectOrderStr = fd.get("drag_correct_order")?.toString() || ""
        const dragCorrectOrder = dragCorrectOrderStr.split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n))
        if (items.length === 0 || dragCorrectOrder.length !== items.length) return null
        // Return only drag_drop fields
        return { items, correct_order: dragCorrectOrder }

      default:
        return null
    }
  }

  const resetForm = () => {
    setFormData({})
    setExerciseType("multiple_choice")
  }

  const loadExerciseForEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setExerciseType(exercise.type as ExerciseType)
    const content = exercise.content as any
    
    // Format content for form fields
    const formattedData: any = {
      lesson_id: exercise.lesson_id,
    }
    
    // Format arrays as newline-separated strings
    if (content.options) formattedData.options = content.options
    if (content.correct_answers) formattedData.correct_answers = content.correct_answers
    if (content.left) formattedData.left = content.left
    if (content.right) formattedData.right = content.right
    if (content.words) formattedData.words = content.words
    if (content.items) formattedData.items = content.items
    if (content.turns) formattedData.turns = content.turns
    if (content.correct_pairs) formattedData.correct_pairs = content.correct_pairs
    if (content.correct_order) formattedData.correct_order = content.correct_order
    if (content.correct) formattedData.correct_order = content.correct // reorder_sentence uses "correct"
    if (content.options) formattedData.listen_options = content.options
    
    // Copy other fields
    Object.keys(content).forEach(key => {
      if (!['options', 'correct_answers', 'left', 'right', 'words', 'items', 'turns', 'correct_pairs', 'correct_order', 'correct'].includes(key)) {
        formattedData[key] = content[key]
      }
    })
    
    setFormData(formattedData)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercises Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and delete exercises ({exercises.length} total, {lessons.length} lessons available)
          </p>
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
                  setEditingExercise(null)
                  resetForm()
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExercise ? "Edit Exercise" : "Create New Exercise"}</DialogTitle>
                <DialogDescription>
                  Select exercise type and fill in the required fields
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  editingExercise ? handleUpdate(formData) : handleCreate(formData)
                }}
                className="space-y-4"
              >
                {/* Common fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson_id">Lesson *</Label>
                    <Select
                      name="lesson_id"
                      defaultValue={editingExercise?.lesson_id || formData.lesson_id || ""}
                      onValueChange={(value) => setFormData({ ...formData, lesson_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lesson" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="lesson_id" value={formData.lesson_id ?? editingExercise?.lesson_id ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exercise_type">Exercise Type *</Label>
                    <Select
                      value={exerciseType}
                      onValueChange={(value) => {
                        setExerciseType(value as ExerciseType)
                        setFormData({})
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                        <SelectItem value="translation">Translation</SelectItem>
                        <SelectItem value="listening">Listening</SelectItem>
                        <SelectItem value="matching">Matching</SelectItem>
                        <SelectItem value="reorder_sentence">Reorder Sentence</SelectItem>
                        <SelectItem value="dialogue">Dialogue</SelectItem>
                        <SelectItem value="drag_drop">Drag & Drop</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="type" value={exerciseType} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_index">Order Index</Label>
                    <Input
                      id="order_index"
                      name="order_index"
                      type="number"
                      defaultValue={editingExercise?.order_index || 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                    <Input
                      id="difficulty"
                      name="difficulty"
                      type="number"
                      min="1"
                      max="5"
                      defaultValue={editingExercise?.difficulty || 1}
                    />
                  </div>
                </div>

                {/* Type-specific fields */}
                {exerciseType === "multiple_choice" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Question *</Label>
                      <Textarea
                        id="question"
                        name="question"
                        defaultValue={formData.question || editingExercise?.content?.question || ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="options">Options (one per line) *</Label>
                      <Textarea
                        id="options"
                        name="options"
                        defaultValue={Array.isArray(formData.options) ? formData.options.join("\n") : ""}
                        placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correct_index">Correct Option Index (0-based) *</Label>
                      <Input
                        id="correct_index"
                        name="correct_index"
                        type="number"
                        min="0"
                        defaultValue={String(formData.correct_index ?? editingExercise?.content?.correct_index ?? 0)}
                        required
                      />
                    </div>
                  </div>
                )}

                {exerciseType === "fill_blank" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sentence">Sentence with blank (use ___ for blank) *</Label>
                      <Input
                        id="sentence"
                        name="sentence"
                        defaultValue={formData.sentence || editingExercise?.content?.sentence || ""}
                        placeholder="Buenas ___"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blank_index">Blank Index (position of blank word, 0-based)</Label>
                      <Input
                        id="blank_index"
                        name="blank_index"
                        type="number"
                        min="0"
                        defaultValue={String(formData.blank_index ?? editingExercise?.content?.blank_index ?? 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correct_answers">Correct Answers (one per line) *</Label>
                      <Textarea
                        id="correct_answers"
                        name="correct_answers"
                        defaultValue={Array.isArray(formData.correct_answers) ? formData.correct_answers.join("\n") : ""}
                        placeholder="noches&#10;tardes"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hint">Hint</Label>
                        <Input id="hint" name="hint" defaultValue={formData.hint || ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="translation">Translation</Label>
                        <Input id="translation" name="translation" defaultValue={formData.translation || ""} />
                      </div>
                    </div>
                  </div>
                )}

                {exerciseType === "translation" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Translation Prompt *</Label>
                      <Textarea
                        id="prompt"
                        name="prompt"
                        defaultValue={formData.prompt || editingExercise?.content?.prompt || ""}
                        placeholder="Translate to Spanish: Good morning"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trans_correct_answers">Correct Answers (one per line) *</Label>
                      <Textarea
                        id="trans_correct_answers"
                        name="trans_correct_answers"
                        defaultValue={Array.isArray(formData.correct_answers) ? formData.correct_answers.join("\n") : ""}
                        placeholder="Buenos días&#10;buenos dias"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trans_hint">Hint</Label>
                      <Input id="trans_hint" name="trans_hint" defaultValue={formData.hint || ""} />
                    </div>
                  </div>
                )}

                {exerciseType === "listening" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="audio_text">Text to Speak *</Label>
                      <Textarea
                        id="audio_text"
                        name="audio_text"
                        defaultValue={formData.audio_text || editingExercise?.content?.audio_text || ""}
                        placeholder="Hola, ¿cómo estás?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="listen_correct_answers">Correct Answers (one per line) *</Label>
                      <Textarea
                        id="listen_correct_answers"
                        name="listen_correct_answers"
                        defaultValue={Array.isArray(formData.correct_answers) ? formData.correct_answers.join("\n") : ""}
                        placeholder="Hola, ¿cómo estás?&#10;Hola como estas"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="listen_mode">Mode</Label>
                        <Select
                          name="listen_mode"
                          defaultValue={formData.mode || editingExercise?.content?.mode || "input"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="input">Type Answer</SelectItem>
                            <SelectItem value="choice">Multiple Choice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          name="language"
                          defaultValue={formData.language || editingExercise?.content?.language || "es"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {formData.mode === "choice" && (
                      <div className="space-y-2">
                        <Label htmlFor="listen_options">Options (one per line)</Label>
                        <Textarea
                          id="listen_options"
                          name="listen_options"
                          defaultValue={Array.isArray(formData.options) ? formData.options.join("\n") : ""}
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                )}

                {exerciseType === "matching" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="matching_left">Left Column Items (one per line) *</Label>
                      <Textarea
                        id="matching_left"
                        name="matching_left"
                        defaultValue={Array.isArray(formData.left) ? formData.left.join("\n") : ""}
                        placeholder="Hello&#10;Goodbye"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="matching_right">Right Column Items (one per line) *</Label>
                      <Textarea
                        id="matching_right"
                        name="matching_right"
                        defaultValue={Array.isArray(formData.right) ? formData.right.join("\n") : ""}
                        placeholder="Hola&#10;Adiós"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correct_pairs">Correct Pairs (format: left:right, one per line)</Label>
                      <Textarea
                        id="correct_pairs"
                        name="correct_pairs"
                        defaultValue={
                          Array.isArray(formData.correct_pairs) 
                            ? formData.correct_pairs.map((p: any) => `${p[0]}:${p[1]}`).join("\n") 
                            : ""
                        }
                        placeholder="Hello:Hola&#10;Goodbye:Adiós"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {exerciseType === "reorder_sentence" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reorder_question">Question/Instruction</Label>
                      <Input
                        id="reorder_question"
                        name="reorder_question"
                        defaultValue={formData.question || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorder_words">Words (one per line) *</Label>
                      <Textarea
                        id="reorder_words"
                        name="reorder_words"
                        defaultValue={Array.isArray(formData.words) ? formData.words.join("\n") : ""}
                        placeholder="Hasta&#10;luego"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correct_order">Correct Order (comma-separated indices, 0-based) *</Label>
                      <Input
                        id="correct_order"
                        name="correct_order"
                        defaultValue={
                          Array.isArray(formData.correct_order) 
                            ? formData.correct_order.join(",") 
                            : Array.isArray(formData.correct) 
                            ? formData.correct.join(",") 
                            : ""
                        }
                        placeholder="0,1"
                        required
                      />
                    </div>
                  </div>
                )}

                {exerciseType === "dialogue" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialogue_turns">Dialogue Turns (format: Speaker: Text, separated by blank lines) *</Label>
                      <Textarea
                        id="dialogue_turns"
                        name="dialogue_turns"
                        defaultValue={
                          Array.isArray(formData.turns) 
                            ? formData.turns.map((t: any) => `${t.speaker}: ${t.text}`).join("\n\n") 
                            : ""
                        }
                        placeholder="A: Hola&#10;&#10;B: ¿Cómo estás?"
                        rows={6}
                        required
                      />
                    </div>
                  </div>
                )}

                {exerciseType === "drag_drop" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="drag_items">Items (one per line) *</Label>
                      <Textarea
                        id="drag_items"
                        name="drag_items"
                        defaultValue={Array.isArray(formData.items) ? formData.items.join("\n") : ""}
                        placeholder="Hasta&#10;luego"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="drag_correct_order">Correct Order (comma-separated indices, 0-based) *</Label>
                      <Input
                        id="drag_correct_order"
                        name="drag_correct_order"
                        defaultValue={Array.isArray(formData.correct_order) ? formData.correct_order.join(",") : ""}
                        placeholder="0,1"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="explanation">Explanation</Label>
                  <Textarea
                    id="explanation"
                    name="explanation"
                    defaultValue={editingExercise?.explanation || ""}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Processing..." : editingExercise ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No exercises found.</p>
            <p className="text-sm text-muted-foreground">Click "New Exercise" to create your first exercise.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const lessonExercises = exercisesByLesson[lesson.id] || []
            return (
              <Card key={lesson.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {lessonExercises.length} exercise{lessonExercises.length === 1 ? "" : "s"} in this lesson
                  </p>
                </CardHeader>
                <CardContent>
                  {lessonExercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No exercises in this lesson yet.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {lessonExercises.map((exercise) => {
                        const content = exercise.content as any
                        const summary =
                          content?.question ||
                          content?.prompt ||
                          content?.sentence ||
                          content?.audio_text ||
                          "Exercise"

                        return (
                          <div key={exercise.id} className="rounded-lg border bg-card p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {exercise.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Order {exercise.order_index} · Difficulty {exercise.difficulty}
                                </p>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{summary}</p>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => loadExerciseForEdit(exercise)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDelete(exercise.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {ungroupedExercises.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ungrouped Exercises</CardTitle>
                <p className="text-sm text-muted-foreground">Exercises without a lesson</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ungroupedExercises.map((exercise) => {
                    const content = exercise.content as any
                    const summary =
                      content?.question || content?.prompt || content?.sentence || content?.audio_text || "Exercise"
                    return (
                      <div key={exercise.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {exercise.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Order {exercise.order_index} · Difficulty {exercise.difficulty}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{summary}</p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => loadExerciseForEdit(exercise)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(exercise.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
