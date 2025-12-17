"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MultipleChoiceExerciseV2Props {
  exercise: any;
  onSubmit: (answer: unknown, isCorrect: boolean) => void;
  disabled?: boolean;
  onContinue?: () => void;
}

export function MultipleChoiceExerciseV2({ exercise, onSubmit, disabled, onContinue }: MultipleChoiceExerciseV2Props) {
  const { question, options, correct_index, hint } = exercise.content || {};
  
  // Ensure question is a valid string
  const safeQuestion = typeof question === "string" ? question : ""
  // Ensure options is a valid array
  const safeOptions = Array.isArray(options) ? options : []
  const safeHint = typeof hint === "string" ? hint : null

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const submittingRef = useRef(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const chosenText =
    selected !== null && selected >= 0 && selected < safeOptions.length ? String(safeOptions[selected]) : null
  const correctText =
    typeof correct_index === "number" && correct_index >= 0 && correct_index < safeOptions.length
      ? String(safeOptions[correct_index])
      : null

  // IMPORTANT: reset when exercise changes
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
    submittingRef.current = false;
    optionRefs.current = [];
  }, [exercise.id]);

  // Keyboard navigation
  useEffect(() => {
    if (submitted || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted || disabled) return;

      // Arrow keys for navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = selected === null ? -1 : selected;
        let newIndex: number;

        if (e.key === "ArrowDown") {
          newIndex = currentIndex < safeOptions.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : safeOptions.length - 1;
        }

        setSelected(newIndex);
        optionRefs.current[newIndex]?.focus();
      }

      // Enter to submit
      if (e.key === "Enter" && selected !== null) {
        e.preventDefault();
        handleOptionClick(selected);
      }

      // Number keys 1-4 for direct selection
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= safeOptions.length) {
        e.preventDefault();
        handleOptionClick(numKey - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, submitted, disabled, safeOptions.length]);

  const handleOptionClick = (index: number) => {
    // Prevent double-tapping
    if (submitted || disabled || submittingRef.current) return;

    submittingRef.current = true;
    setSelected(index);

    const correct = index === correct_index;
    setIsCorrect(correct);
    
    // Immediately set submitted to show post-submit state
    setSubmitted(true);
    
    // Call onSubmit immediately
    onSubmit(safeOptions[index], correct);
    
    // Reset submitting ref after a short delay
    setTimeout(() => {
      submittingRef.current = false;
    }, 100);
  };

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto relative min-h-[500px]">
      {/* Celebration confetti/stars removed (kept clean like Duolingo) */}

      {/* Question and answers */}
      <div className="relative">
        {/* Glowing border effect when active */}
        {!submitted && (
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl opacity-50 animate-pulse -z-10" />
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

        {/* Question - becomes a "completed" card after submit */}
        <div
          className={cn(
            "relative mb-6",
            submitted && "pointer-events-none",
            !submitted && "transition-all",
            submitted &&
              (isCorrect
                ? "rounded-3xl border-2 border-green-500/40 bg-gradient-to-br from-green-500/10 via-card/60 to-green-500/5 shadow-xl"
                : "rounded-3xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 via-card/60 to-red-500/5 shadow-xl"),
          )}
        >
          <div className={cn(
            "relative inline-block w-full",
            !submitted && "transition-all duration-500",
          )}>
            {false && (
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 animate-fade-in z-20 mb-4">
                <div className="relative">
                  <Sparkles className="h-10 w-10 text-yellow-400 drop-shadow-2xl" />
                  <div className="absolute inset-0 bg-yellow-400/50 blur-xl animate-pulse" />
                </div>
                <div className="relative px-6 py-2 rounded-2xl bg-gradient-to-r from-green-500/20 via-yellow-400/20 to-green-500/20 border-2 border-yellow-400/50">
                  <span className="text-4xl font-black bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 bg-clip-text text-transparent animate-pulse drop-shadow-lg">
                    Perfect! 🎉
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-yellow-400/30 to-green-500/30 blur-xl -z-10 animate-pulse" />
                </div>
                <div className="relative">
                  <Sparkles className="h-10 w-10 text-yellow-400 drop-shadow-2xl" />
                  <div className="absolute inset-0 bg-yellow-400/50 blur-xl animate-pulse" />
                </div>
              </div>
            )}
            <div className="relative">
              {submitted && (
                <div className="absolute -top-3 right-4 z-20">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur",
                      isCorrect
                        ? "border-green-500/30 bg-green-500/10 text-green-700"
                        : "border-red-500/30 bg-red-500/10 text-red-700",
                    )}
                  >
                    {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Completed
                  </div>
                </div>
              )}
              <h1 className={cn(
                "text-3xl font-bold relative z-10 px-4 py-2 rounded-xl",
                !submitted && "transition-all duration-500",
                !submitted && "bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20",
                submitted &&
                  (isCorrect
                    ? "text-green-800 bg-background/60 border border-green-500/20"
                    : "text-red-800 bg-background/60 border border-red-500/20"),
              )}>
                {safeQuestion}
              </h1>
            </div>
          </div>
        </div>

        {/* Simple in-question recap */}
        {submitted && chosenText && (
          <div
            className={cn(
              "mb-6 rounded-2xl border bg-background/50 px-4 py-3 shadow-sm",
              isCorrect ? "border-success/30" : "border-destructive/30",
            )}
          >
            <p className="text-sm">
              <span className="text-muted-foreground">You answered:</span>{" "}
              <span className={cn("font-semibold", isCorrect ? "text-success" : "text-destructive")}>
                {chosenText}
              </span>
            </p>
            {!isCorrect && correctText && correctText !== chosenText && (
              <p className="mt-1 text-sm text-muted-foreground">
                Correct: <span className="font-semibold text-success">{correctText}</span>
              </p>
            )}
          </div>
        )}

        {/* Answers section - clearly visible with highlighting */}
        <div className="flex flex-col gap-3 relative">
          {safeOptions.map((opt, i) => {
            const isChosen = selected === i;
            const revealCorrect = submitted && i === correct_index;
            const revealIncorrect = submitted && isChosen && !isCorrect;
            // When correct, always highlight the correct answer in green
            const showCorrectGreen = submitted && isCorrect && i === correct_index;

            return (
              <button
                key={i}
                ref={(el) => (optionRefs.current[i] = el)}
                disabled={submitted || disabled || submittingRef.current}
                onClick={() => handleOptionClick(i)}
                tabIndex={submitted || disabled ? -1 : 0}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 shadow-lg text-left text-base relative overflow-hidden group",
                  // NO animations, transitions, or hover effects when submitted
                  submitted && "cursor-default pointer-events-none",
                  !submitted && !disabled && "transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/10 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 cursor-pointer active:scale-[0.98] animate-slide-in-up",
                  isChosen && !submitted && "border-primary bg-gradient-to-r from-primary/20 to-primary/10 ring-4 ring-primary/30 scale-[1.02] shadow-xl shadow-primary/20 animate-pulse-glow-enhanced",
                  // Highlight correct answer in green when answer is correct - VERY VISIBLE
                  showCorrectGreen && "border-green-600 bg-green-500 ring-4 ring-green-500 shadow-2xl animate-success-pop",
                  // Highlight correct answer when user got it wrong - VERY VISIBLE
                  revealCorrect && !isCorrect && "border-green-600 bg-green-500/80 ring-4 ring-green-500 shadow-2xl animate-scale-in",
                  // Highlight incorrect answer - VERY VISIBLE
                  revealIncorrect && "border-red-600 bg-red-500/80 ring-4 ring-red-500 shadow-2xl animate-error-shake",
                  // Default state
                  !submitted && !isChosen && !showCorrectGreen && !revealCorrect && !revealIncorrect && "bg-card/50 border-border/50 hover:border-primary/30"
                )}
                style={!submitted ? { animationDelay: `${i * 50}ms` } : {}}
              >
                {/* NO shine effect when submitted */}
                {!submitted && !disabled && (
                  <div className="absolute inset-0 pointer-events-none opacity-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-[120%] transition-[transform,opacity] duration-700 group-hover:opacity-100 group-hover:translate-x-[120%]" />
                )}
                <div className="flex items-center justify-between relative z-10">
                  <span className={cn(
                    "font-medium text-base",
                    showCorrectGreen && "text-white font-bold",
                    revealCorrect && !isCorrect && "text-white font-bold",
                    revealIncorrect && "text-white font-bold",
                    !submitted && !showCorrectGreen && !revealCorrect && !revealIncorrect && "text-foreground"
                  )}>{opt}</span>
                  {(showCorrectGreen || revealCorrect) && (
                    <Check className={cn("h-7 w-7 text-white drop-shadow-lg", !submitted && "animate-scale-in")} />
                  )}
                  {revealIncorrect && (
                    <X className={cn("h-7 w-7 text-white drop-shadow-lg", !submitted && "animate-scale-in")} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback card - appears above but doesn't block answers */}
      {/* Disabled: use shared bottom feedback bar instead */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <div className={cn(
              "relative bg-gradient-to-br from-card via-card/95 to-card rounded-3xl p-8 shadow-2xl border-2 max-w-md w-full pointer-events-auto animate-bounce-in-enhanced",
              isCorrect ? "border-green-500/50" : "border-red-500/50"
            )}>
              {/* Background glow with animation */}
              <div className={cn(
                "absolute inset-0 rounded-3xl blur-2xl -z-10 animate-pulse",
                isCorrect ? "bg-gradient-to-br from-green-500/40 via-yellow-400/30 to-green-500/40" : "bg-gradient-to-br from-red-500/30 to-red-500/20"
              )} />

            {isCorrect ? (
              <div className="flex flex-col items-center gap-6">
                {/* Success icon */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl">
                    <Check className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-green-500/50 blur-2xl rounded-full" />
                </div>

                {/* Success message */}
                <div className="text-center space-y-2">
                    <h2 className="text-5xl font-black bg-gradient-to-r from-green-500 via-yellow-400 to-green-600 bg-clip-text text-transparent">
                      Excellent!
                    </h2>
                  <p className="text-xl text-muted-foreground font-semibold">
                    Great job! Keep it up! 🎉
                  </p>
                </div>

                {/* Continue button */}
                {onContinue && (
                  <Button
                    onClick={onContinue}
                    size="lg"
                    className="mt-4 h-14 px-10 text-xl font-bold bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-110 active:scale-105 border-2 border-green-400/50 relative overflow-hidden group w-full"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {/* Failure icon */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl">
                    <X className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-red-500/50 blur-2xl rounded-full" />
                </div>

                {/* Failure message */}
                <div className="text-center space-y-2">
                  <h2 className="text-5xl font-black text-red-600">
                    Incorrect
                  </h2>
                  <p className="text-xl text-muted-foreground font-semibold">
                    Don't worry, you'll get it next time!
                  </p>
                </div>

                {/* Continue button */}
                {onContinue && (
                  <Button
                    onClick={onContinue}
                    size="lg"
                    className="mt-4 h-14 px-10 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-2xl transition-all hover:scale-110 active:scale-105 border-2 border-primary/50 relative overflow-hidden group w-full"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
