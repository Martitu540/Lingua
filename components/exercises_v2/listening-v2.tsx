"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Volume2, Volume1, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Normalize accents
function normalize(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function ListeningExerciseV2({ exercise, onSubmit, disabled }) {
  const content = exercise.content || {};
  const { audio_text, correct_answers, mode, options, language, question, sentence, prompt } = content;
  
  // Ensure all values are valid
  const safeCorrectAnswers = Array.isArray(correct_answers) ? correct_answers : [];
  const safeOptions = Array.isArray(options) ? options : [];
  const safeMode = mode === "input" || mode === "choice" ? mode : "input";
  
  // Try multiple fields to find text to speak - check all possible fields
  // For listening exercises, we want to speak the text the user should hear
  let textToSpeak = "";
  
  // Priority order:
  // 1. audio_text (explicit audio text field)
  // 2. correct_answers[0] (what they should hear/type)
  // 3. question (if it's the text to listen to)
  // 4. sentence (for fill-in-the-blank style)
  // 5. prompt (for translation style)
  // 6. options[0] (last resort)
  
  if (audio_text && typeof audio_text === "string" && audio_text.trim()) {
    textToSpeak = audio_text.trim();
  } else if (safeCorrectAnswers.length > 0 && safeCorrectAnswers[0]) {
    // For listening, the correct answer is usually what they should hear
    textToSpeak = String(safeCorrectAnswers[0]).trim();
  } else if (question && typeof question === "string" && question.trim()) {
    textToSpeak = question.trim();
  } else if (sentence && typeof sentence === "string" && sentence.trim()) {
    textToSpeak = sentence.trim();
  } else if (prompt && typeof prompt === "string" && prompt.trim()) {
    textToSpeak = prompt.trim();
  } else if (safeOptions.length > 0 && safeOptions[0]) {
    // Last resort: use first option
    textToSpeak = String(safeOptions[0]).trim();
  }
  

  const [playing, setPlaying] = useState(false);
  const [slowPlaying, setSlowPlaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [funnierMode, setFunnierMode] = useState(false);
  const primaryCorrect = safeCorrectAnswers.length > 0 && safeCorrectAnswers[0] ? String(safeCorrectAnswers[0]) : "";

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Get user settings for funnier mode
  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("settings")
          .eq("id", user.id)
          .single();
        if (profile?.settings?.learning?.funnierMode) {
          setFunnierMode(profile.settings.learning.funnierMode);
        }
      }
    }
    loadSettings();
  }, []);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string, slow: boolean = false) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const synth = window.speechSynthesis;
    
    // Cancel any ongoing speech
    synth.cancel();

    // Wait a bit for cancel to complete
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      // Set language based on exercise or default to Spanish
      const lang = language === "en" ? "en-US" : "es-ES";
      utterance.lang = lang;
      
      // Natural speech settings
      utterance.rate = slow ? 0.5 : (funnierMode ? 1.1 : 0.95);
      utterance.pitch = funnierMode ? 1.2 : 1.0;
      utterance.volume = 1.0;

      // Get voices (may need to wait for them to load)
      const voices = synth.getVoices();
      
      // Try to use a natural voice
      const preferredVoices = lang === "es-ES" 
        ? voices.filter(v => v.lang.includes("es") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium")))
        : voices.filter(v => v.lang.includes("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium")));
      
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      } else {
        // Fallback to any voice in the language
        const langVoices = voices.filter(v => v.lang.startsWith(lang.split("-")[0]));
        if (langVoices.length > 0) {
          utterance.voice = langVoices[0];
        }
      }

      utterance.onstart = () => {
        if (slow) {
          setSlowPlaying(true);
        } else {
          setPlaying(true);
        }
      };

      utterance.onend = () => {
        setPlaying(false);
        setSlowPlaying(false);
      };

      utterance.onerror = () => {
        setPlaying(false);
        setSlowPlaying(false);
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }, 100);
  };

  const handlePlay = () => {
    if (playing || disabled) {
      if (playing) stop();
      return;
    }
    if (!textToSpeak || textToSpeak.trim().length === 0) {
      return;
    }
    speak(textToSpeak, false);
  };

  const handleSlowPlay = () => {
    if (slowPlaying || disabled) {
      if (slowPlaying) stop();
      return;
    }
    if (!textToSpeak || textToSpeak.trim().length === 0) {
      return;
    }
    speak(textToSpeak, true);
  };

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setPlaying(false);
      setSlowPlaying(false);
    }
  };

  // Load voices when available (Chrome loads voices asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const synth = window.speechSynthesis;
    synthRef.current = synth;

    // Load voices immediately
    synth.getVoices();

    // Also listen for voices to be loaded (Chrome)
    const loadVoices = () => {
      synth.getVoices();
    };
    
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.cancel();
    };
  }, []);

  const checkCorrect = (val) => {
    if (!val || typeof val !== "string") return false;
    const normalized = normalize(val);
    return safeCorrectAnswers.some((ans) => ans && normalize(ans) === normalized);
  };

  // Reset when exercise changes
  useEffect(() => {
    setSubmitted(false);
    setIsCorrect(false);
    setUserAnswer("");
    setSelectedOptionIndex(null);
    setPlaying(false);
    setSlowPlaying(false);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, [exercise.id]);

  const handleSubmit = (answer) => {
    if (submitted) return;

    const correct = checkCorrect(answer ?? userAnswer);
    setIsCorrect(correct);
    setSubmitted(true);

    onSubmit(answer ?? userAnswer, correct);
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

      {/* Audio Player */}
      <div className="flex flex-col items-center gap-4 mb-10">
        {/* Debug info */}
        {!textToSpeak && (
          <p className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded">
            ⚠️ No text found to speak. Check exercise content.
          </p>
        )}
        
        {/* Main Play Button */}
        <button
          onClick={playing ? stop : handlePlay}
          disabled={disabled || !textToSpeak}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center shadow-lg border bg-primary text-white transition-all",
            playing && "scale-105 shadow-xl animate-pulse",
            (!textToSpeak || disabled) && "opacity-50 cursor-not-allowed",
            "active:scale-95"
          )}
        >
          <Volume2 className="w-10 h-10" />
        </button>

        {/* Slow Audio Button */}
        <button
          onClick={slowPlaying ? stop : handleSlowPlay}
          disabled={disabled || !textToSpeak}
          className={cn(
            "px-5 py-2 rounded-xl border shadow-sm bg-card hover:bg-accent/10 transition-all text-sm font-medium flex items-center gap-2",
            slowPlaying && "opacity-70 bg-primary/10",
            (!textToSpeak || disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Volume1 className="w-4 h-4" /> {slowPlaying ? "Stop" : "Play Slowly"}
        </button>
        
      </div>

      {/* MODE A: Type the answer */}
      {safeMode === "input" && (
        <>
          <input
            className={cn(
              "w-full p-4 text-lg border rounded-xl bg-card shadow-md",
              !submitted && "transition-all focus:outline-none focus:ring-2 focus:ring-primary",
              submitted && "cursor-default pointer-events-none",
              submitted && isCorrect && "border-success bg-success/5 text-success",
              submitted && !isCorrect && "border-destructive bg-destructive/5 text-destructive"
            )}
            type="text"
            placeholder="Type what you heard..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !submitted && userAnswer.trim()) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            disabled={submitted}
          />

          {submitted && (
            <div className="mt-5 rounded-2xl border bg-background/50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your answer</p>
              <p className={cn("mt-2 text-xl font-bold break-words", isCorrect ? "text-success" : "text-destructive")}>
                {userAnswer.trim() ? userAnswer : "—"}
              </p>
              {!isCorrect && primaryCorrect && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Correct: <span className="font-semibold text-success">{primaryCorrect}</span>
                </p>
              )}
            </div>
          )}

          {!submitted && (
            <button
              onClick={() => handleSubmit()}
              disabled={!userAnswer.trim()}
              className={cn(
                "mt-10 w-full py-4 rounded-xl bg-primary text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all",
                !userAnswer.trim() && "opacity-40 cursor-default"
              )}
            >
              Continue
            </button>
          )}
        </>
      )}

      {/* MODE B: Multiple choice */}
      {safeMode === "choice" && (
        <div className="flex flex-col gap-4">
          {safeOptions.map((opt, i) => {
            const isCorrectOption = checkCorrect(opt);
            const isChosen = submitted && selectedOptionIndex === i;
            const showIncorrect = submitted && isChosen && !isCorrect;
            
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => {
                  setSelectedOptionIndex(i);
                  handleSubmit(opt);
                }}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 shadow-md text-lg text-left relative overflow-hidden",
                  !submitted && "transition-all hover:bg-accent/10 active:scale-[0.98] cursor-pointer",
                  submitted && "cursor-default pointer-events-none",
                  // Highlight correct answer in green (always show when submitted)
                  submitted && isCorrectOption && "border-success/50 bg-success/10 ring-4 ring-success/20 shadow-lg shadow-success/10",
                  // Highlight incorrect chosen answer in red
                  showIncorrect && "border-destructive/50 bg-destructive/10 ring-2 ring-destructive/20",
                  // Dim other options when submitted
                  submitted && !isCorrectOption && !showIncorrect && "border-border bg-card/50 opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "font-medium",
                    submitted && isCorrectOption && "text-success font-bold",
                    showIncorrect && "text-destructive font-semibold"
                  )}>{opt}</span>
                  {submitted && isCorrectOption && (
                    <Check className="h-6 w-6 text-success" />
                  )}
                  {showIncorrect && (
                    <X className="h-6 w-6 text-destructive" />
                  )}
                </div>
              </button>
            );
          })}

          {submitted && selectedOptionIndex !== null && (
            <div className="mt-2 rounded-2xl border bg-background/50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your choice</p>
              <p className={cn("mt-2 text-xl font-bold break-words", isCorrect ? "text-success" : "text-destructive")}>
                {String(safeOptions[selectedOptionIndex] ?? "—")}
              </p>
              {!isCorrect && primaryCorrect && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Correct: <span className="font-semibold text-success">{primaryCorrect}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post-submit feedback uses shared bottom bar in lessons; cards above cover review mode too. */}
    </div>
  );
}
