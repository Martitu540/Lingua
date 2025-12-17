"use client";

import { MultipleChoiceExerciseV2 } from "@/components/exercises_v2/multiple-choice-v2";

export default function TestPage() {
  const fakeExercise = {
    id: "test-123",
    content: {
      question: "How do you say 'Hello' in Spanish?",
      options: ["Hola", "Adiós", "Gracias", "Por favor"],
      correct_index: 0,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <MultipleChoiceExerciseV2
        exercise={fakeExercise}
        onSubmit={(answer, isCorrect) =>
          alert(`You clicked: ${answer} - Correct: ${isCorrect}`)
        }
        disabled={false}
        selectedAnswer={null}
      />
    </div>
  );
}
