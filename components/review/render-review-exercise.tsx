"use client"

import { MultipleChoiceExerciseV2 } from "@/components/exercises_v2/multiple-choice-v2"
import { FillBlankExerciseV2 } from "@/components/exercises_v2/fill-blank-v2"
import { DialogueExerciseV2 } from "@/components/exercises_v2/dialogue-v2"
import { ListeningExerciseV2 } from "@/components/exercises_v2/listening-v2"
import { ReorderSentenceExerciseV2 } from "@/components/exercises_v2/reorder-sentence-v2"
import { MatchingExerciseV2 } from "@/components/exercises_v2/matching-v2"
import { TranslationExerciseV2 } from "@/components/exercises_v2/translation-v2"
import type { Exercise } from "@/types/database"

interface RenderExerciseProps {
  exercise: Exercise
  onSubmit: (answer: unknown, isCorrect: boolean) => void
  disabled?: boolean
  onContinue?: () => void
}

export function renderReviewExercise({ exercise, onSubmit, disabled, onContinue }: RenderExerciseProps) {
  const commonProps = {
    exercise,
    onSubmit,
    disabled,
    onContinue,
  }

  switch (exercise.type) {
    case "multiple_choice":
      return <MultipleChoiceExerciseV2 {...commonProps} />

    case "fill_blank":
      return <FillBlankExerciseV2 {...commonProps} />

    case "translation":
      return <TranslationExerciseV2 {...commonProps} />

    case "dialogue":
      return <DialogueExerciseV2 {...commonProps} />

    case "listening":
      return <ListeningExerciseV2 {...commonProps} />

    case "reorder":
    case "reorder_sentence":
      return <ReorderSentenceExerciseV2 {...commonProps} />

    case "matching":
      return <MatchingExerciseV2 {...commonProps} />

    default:
      return <MultipleChoiceExerciseV2 {...commonProps} />
  }
}
