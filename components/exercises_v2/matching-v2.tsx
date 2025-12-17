"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Target } from "lucide-react";


// Basic animation helpers
const disappearAnimation = "animate-[fadeOutScale_0.4s_ease-in-out_forwards]";
const shakeAnimation = "animate-[shake_0.3s_ease-in-out]";

export function MatchingExerciseV2({ exercise, onSubmit, disabled }) {
  const { left, right, correct_pairs } = exercise.content || {};
  
  // Ensure all values are valid arrays
  const safeLeft = Array.isArray(left) ? left : [];
  const safeRight = Array.isArray(right) ? right : [];
  const safeCorrectPairs = Array.isArray(correct_pairs) ? correct_pairs : [];

  // Shuffle right column
  const [rightShuffled, setRightShuffled] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  const [matched, setMatched] = useState<string[]>([]); // store matched pairs for removal
  const [matchedPairs, setMatchedPairs] = useState<[string, string][]>([]);
  const [incorrectPair, setIncorrectPair] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const shuffled = [...safeRight].sort(() => Math.random() - 0.5);
    setRightShuffled(shuffled);
    setCompleted(false);
    setMatched([]);
    setMatchedPairs([]);
    setWrongAttempts(0);
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [exercise.id, safeRight]);

  const tryMatch = (leftWord: string, rightWord: string) => {
    if (disabled || completed) return;
    
    const correct = safeCorrectPairs.some(
      ([l, r]) => l === leftWord && r === rightWord
    );

    if (correct) {
      // Add both sides to matched list
      setMatched((prev) => [...prev, leftWord, rightWord]);

      // Track the actual pair the user formed (for post-submit recap)
      setMatchedPairs((prevPairs) => {
        const nextPairs: [string, string][] = [...prevPairs, [leftWord, rightWord]];

        // If all matched, we finish
        if (nextPairs.length >= safeCorrectPairs.length) {
          setCompleted(true);
          // Small delay to ensure state is set before onSubmit
          setTimeout(() => {
            onSubmit({ pairs: nextPairs, wrongAttempts }, true);
          }, 100);
        }

        return nextPairs;
      });

      // Reset selection
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Incorrect animation
      setIncorrectPair(true);
      setWrongAttempts((prev) => prev + 1);

      setTimeout(() => {
        setIncorrectPair(false);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  useEffect(() => {
    if (selectedLeft && selectedRight && !disabled && !completed) {
      tryMatch(selectedLeft, selectedRight);
    }
  }, [selectedLeft, selectedRight]);

  const totalPairs = safeCorrectPairs.length;
  const progressPairs = matchedPairs.length;

  // Post-submit: show a "completed" state (Duolingo-like) with a recap.
  if (completed || disabled) {
    return (
      <div className="pt-24 px-4 max-w-xl mx-auto min-h-[400px]">
        <div className="relative rounded-3xl border bg-gradient-to-br from-card via-card/95 to-card p-6 shadow-xl">
          <div className="absolute -top-3 right-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold bg-background/60 backdrop-blur shadow-sm border-success/30 text-success">
              <Check className="h-4 w-4" />
              Completed
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success border border-success/20">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">All pairs matched</h2>
                <p className="text-sm text-muted-foreground">
                  {progressPairs}/{totalPairs} pairs · {wrongAttempts} miss{wrongAttempts === 1 ? "" : "es"}
                </p>
              </div>
            </div>
          </div>

          {matchedPairs.length > 0 && (
            <div className="mt-5 grid gap-2">
              {matchedPairs.map(([l, r], idx) => (
                <div
                  key={`${l}-${r}-${idx}`}
                  className="flex items-center gap-2 rounded-2xl border bg-background/60 px-4 py-3 shadow-sm"
                >
                  <span className="flex-1 font-semibold break-words">{l}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 font-semibold break-words text-right">{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto">
      <h1 className="text-center text-2xl font-bold mb-8">Match the pairs</h1>

      <div className="mb-6 rounded-2xl border bg-card/60 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Progress: <span className="text-primary">{progressPairs}</span>/{totalPairs}
          </p>
          <p className="text-xs text-muted-foreground">
            Misses: <span className={cn("font-semibold", wrongAttempts ? "text-destructive" : "text-muted-foreground")}>{wrongAttempts}</span>
          </p>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
            style={{ width: `${totalPairs ? (progressPairs / totalPairs) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          {safeLeft.map((word, i) => {
            const isMatched = matched.includes(word);
            const isSelected = selectedLeft === word;

            return (
              <button
                key={i}
                disabled={isMatched || disabled}
                onClick={() => setSelectedLeft(word)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 shadow-md text-lg text-center transition-all",
                  "hover:bg-accent/10 hover:scale-105 active:scale-[0.97]",
                  isSelected && "border-primary bg-primary/10 ring-4 ring-primary/30 animate-pulse-glow-enhanced",
                  isMatched && "animate-scale-in opacity-0 pointer-events-none"
                )}
              >
                {word}
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {rightShuffled.map((word, i) => {
            const isMatched = matched.includes(word);
            const isSelected = selectedRight === word;

            return (
              <button
                key={i}
                disabled={isMatched || disabled}
                onClick={() => setSelectedRight(word)}
                className={cn(
                  "w-full p-4 rounded-2xl border shadow-md text-lg text-center transition-all",
                  "hover:bg-accent/10 active:scale-[0.97]",
                  isSelected && "border-primary bg-primary/10",
                  incorrectPair && isSelected && shakeAnimation,
                  isMatched && `${disappearAnimation} opacity-0 scale-75`
                )}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
