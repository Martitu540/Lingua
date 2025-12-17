"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Sparkles } from "lucide-react";

type DialogueTurn = {
  speaker: "A" | "B";
  text?: string;
  options?: string[];
  correct_index?: number;
};

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function DialogueExerciseV2({ exercise, onSubmit, disabled }) {
  const content = exercise.content || {};
  const { context, turns, hint } = content as {
    context?: string;
    turns?: DialogueTurn[];
    hint?: string;
  };
  
  // Ensure turns is a valid array
  const safeTurns = Array.isArray(turns) ? turns : [];
  const safeHint = typeof hint === "string" ? hint : null;

  // We'll assume there is exactly ONE turn with options (the user's choice)
  const choiceIndex = safeTurns.findIndex((t) => t && t.options && t.options.length > 0);
  const choiceTurn = choiceIndex >= 0 ? turns[choiceIndex] : null;

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (submitted || disabled || !choiceTurn) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted || disabled) return;

      // Arrow keys for navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = selected === null ? -1 : selected;
        const optionsLength = choiceTurn.options?.length || 0;
        let newIndex: number;

        if (e.key === "ArrowDown") {
          newIndex = currentIndex < optionsLength - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : optionsLength - 1;
        }

        setSelected(newIndex);
      }

      // Enter to submit
      if (e.key === "Enter" && selected !== null) {
        e.preventDefault();
        handleSubmit();
      }

      // Number keys 1-4 for direct selection
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= (choiceTurn.options?.length || 0)) {
        e.preventDefault();
        handleChoose(numKey - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, submitted, disabled, choiceTurn]);

  const handleChoose = (index: number) => {
    if (submitted || disabled) return;
    setSelected(index);
  };

  const handleSubmit = () => {
    if (submitted || disabled || selected === null || !choiceTurn) return;

    const chosenText = choiceTurn.options![selected];
    const correct =
      choiceTurn.correct_index !== undefined &&
      selected === choiceTurn.correct_index;

    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(chosenText, correct);
  };

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto animate-fadeIn relative">
      {submitted && (
        <div className="absolute -top-3 right-4 z-20">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold bg-background/60 backdrop-blur shadow-sm",
              isCorrect ? "border-success/30 text-success" : "border-destructive/30 text-destructive",
            )}
          >
            {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            Completed
          </div>
        </div>
      )}
      {/* Optional context above the dialogue */}
      {context && (
        <div className="mb-4 rounded-2xl border bg-card/50 p-4 text-sm text-muted-foreground text-center">
          {context}
        </div>
      )}

      {/* Hint button */}
      {safeHint && !submitted && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 rounded-full bg-xp/10 px-4 py-2 text-sm font-medium text-xp transition-all hover:bg-xp/20 hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            {showHint ? "Hide hint" : "Need a hint?"}
          </button>
        </div>
      )}

      {/* Hint display */}
      {showHint && safeHint && !submitted && (
        <div className="mb-6 animate-slide-up rounded-xl bg-xp/10 p-4 text-sm text-xp border border-xp/20">
          <p className="font-semibold">💡 Hint:</p>
          <p className="mt-1">{safeHint}</p>
        </div>
      )}

      {/* Show user's choice prominently when submitted */}
      {submitted && selected !== null && choiceTurn && (
        <div className={cn(
          "mb-6 p-6 rounded-2xl border-2 shadow-lg animate-bounce-in-enhanced",
          isCorrect 
            ? "border-success/40 bg-success/10 shadow-success/10 shadow-lg" 
            : "border-destructive/40 bg-destructive/10 shadow-destructive/10 shadow-lg animate-error-shake"
        )}>
          <p className="text-sm font-semibold mb-3 uppercase tracking-wide flex items-center gap-2">
            {isCorrect ? (
              <>
                <Check className="h-5 w-5 text-success animate-success-pop" />
                Your Choice (Correct!)
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-destructive" />
                Your Choice
              </>
            )}
          </p>
          <p className={cn(
            "text-2xl font-bold",
            isCorrect ? "text-success" : "text-destructive"
          )}>
            {choiceTurn.options![selected]}
          </p>
        </div>
      )}

      {/* Chat bubble area */}
      <div className="mb-6 rounded-2xl border bg-card/70 backdrop-blur-sm p-4 space-y-3 max-h-[340px] overflow-y-auto">
        {safeTurns.map((turn, idx) => {
          // For the choice turn: show chosen bubble AFTER submit, or placeholder before submit
          const isChoiceTurn = idx === choiceIndex && choiceTurn;

          if (isChoiceTurn) {
            if (!submitted) {
              // Before submit, show placeholder "Your reply…"
              return (
                <div key={idx} className="flex justify-end">
                  <div className="rounded-2xl px-3 py-2 bg-primary/10 text-sm text-muted-foreground">
                    Your reply…
                  </div>
                </div>
              );
            }

            // After submit, ALWAYS show the chosen reply as a proper bubble (user's choice stays visible)
            const chosenText =
              selected !== null && choiceTurn?.options
                ? choiceTurn.options[selected]
                : "";

            return (
              <div key={idx} className="flex justify-end">
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-base font-semibold shadow-lg border-2",
                    isCorrect
                      ? "bg-green-500 text-white border-green-600"
                      : "bg-red-500 text-white border-red-600"
                  )}
                >
                  {chosenText}
                </div>
              </div>
            );
          }

          // Normal dialogue line
          const isLeft = turn.speaker === "A";

          return (
            <div
              key={idx}
              className={cn(
                "flex w-full",
                isLeft ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  isLeft
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {turn.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show correct sentence when submitted */}
      {submitted && choiceTurn && choiceTurn.correct_index !== undefined && (
        <div className="mb-6 p-4 rounded-2xl bg-success/10 border-2 border-success/30">
          <p className="text-sm text-muted-foreground mb-2">Correct answer:</p>
          <p className="text-lg font-bold text-success">
            {choiceTurn.options![choiceTurn.correct_index]}
          </p>
        </div>
      )}

      {/* Choice buttons (only if this dialogue has a choice turn) */}
      {choiceTurn && !submitted && (
        <div className="flex flex-col gap-3">
          {choiceTurn.options!.map((opt, i) => (
            <button
              key={i}
              disabled={disabled}
              onClick={() => handleChoose(i)}
              className={cn(
                "w-full p-4 rounded-2xl border shadow-md text-left text-base",
                !submitted && "transition-all hover:bg-accent/10 active:scale-[0.98]",
                selected === i && "border-primary bg-primary/10"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Choice buttons when submitted - show with highlighting */}
      {choiceTurn && submitted && (
        <div className="flex flex-col gap-3 pointer-events-none">
          {choiceTurn.options!.map((opt, i) => {
            const isChosen = selected === i;
            const isCorrectOption = i === choiceTurn.correct_index;
            const showIncorrect = isChosen && !isCorrect;
            
            return (
              <div
                key={i}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 shadow-md text-left text-base",
                  isCorrectOption && "border-green-500 bg-gradient-to-r from-green-500/40 via-green-400/30 to-green-500/40 ring-4 ring-green-500/60 shadow-2xl shadow-green-500/40 animate-success-pop",
                  showIncorrect && "border-red-500 bg-gradient-to-r from-red-500/30 to-red-500/20 ring-2 ring-red-500/50 animate-error-shake",
                  !isCorrectOption && !showIncorrect && "border-border bg-card/50 opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "font-medium",
                    isCorrectOption && "text-green-800 font-bold",
                    showIncorrect && "text-red-700 font-semibold"
                  )}>{opt}</span>
                  {isCorrectOption && <Check className="h-6 w-6 text-green-600" />}
                  {showIncorrect && <X className="h-6 w-6 text-red-600" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback & continue */}
      {choiceTurn && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className={cn(
            "mt-6 w-full py-3 rounded-xl bg-primary text-white font-semibold text-lg shadow-md",
            !submitted && "transition-all hover:shadow-lg",
            selected === null && "opacity-40 cursor-default"
          )}
        >
          Continue
        </button>
      )}

      {submitted && (
        <div className="flex justify-center mt-4">
          {isCorrect ? (
            <div className="flex items-center gap-2 text-green-600 text-lg font-semibold">
              <Check className="w-6 h-6" /> Correct!
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 text-lg font-semibold">
              <X className="w-6 h-6" /> Incorrect
            </div>
          )}
        </div>
      )}
    </div>
  );
}
