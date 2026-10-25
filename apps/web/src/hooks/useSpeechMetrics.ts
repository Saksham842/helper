'use client';

import { useState, useRef, useCallback } from 'react';
import { analyzeFillerWords, classifyDeliveryTone, ToneAnalysisResult } from '@ghostpilot/shared';

export interface SpeechMetricsState {
  wordCount: number;
  elapsedSpeakingSeconds: number;
  wpm: number;
  fillerWordCount: number;
  fillerRatioPercent: number;
  confidenceScore: number; // 0-100
  tone: ToneAnalysisResult | null;
}

export function useSpeechMetrics() {
  const [metrics, setMetrics] = useState<SpeechMetricsState>({
    wordCount: 0,
    elapsedSpeakingSeconds: 0,
    wpm: 0,
    fillerWordCount: 0,
    fillerRatioPercent: 0,
    confidenceScore: 85,
    tone: null,
  });

  const questionEndedAtRef = useRef<number>(Date.now());
  const speechStartedAtRef = useRef<number | null>(null);

  /**
   * Call when interviewer finishes speaking and candidate turn begins
   */
  const markInterviewerFinished = useCallback(() => {
    questionEndedAtRef.current = Date.now();
    speechStartedAtRef.current = null;
  }, []);

  /**
   * Feed new or cumulative candidate transcript text to compute real-time metrics
   */
  const processTranscript = useCallback((cumulativeText: string) => {
    if (!cumulativeText.trim()) return;

    if (!speechStartedAtRef.current) {
      speechStartedAtRef.current = Date.now();
    }

    const words = cumulativeText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Elapsed speaking time in minutes
    const elapsedSeconds = Math.max(1, (Date.now() - speechStartedAtRef.current) / 1000);
    const minutes = elapsedSeconds / 60;
    const rawWpm = Math.round(wordCount / minutes);
    const wpm = Math.min(300, Math.max(20, rawWpm));

    // Analyze fillers
    const filler = analyzeFillerWords(cumulativeText);

    // Compute delivery tone & STAR adherence
    const tone = classifyDeliveryTone(cumulativeText, wpm);

    // Confidence formula: starts at 100, penalized by high filler ratio or irregular pace
    let confidence = 100;
    // Penalty for fillers (up to -35)
    confidence -= Math.min(35, filler.ratioPercent * 4);
    // Penalty for extreme slow or fast pace
    if (wpm < 110) confidence -= Math.min(25, (110 - wpm) * 0.5);
    if (wpm > 180) confidence -= Math.min(25, (wpm - 180) * 0.5);

    const confidenceScore = Math.max(20, Math.min(99, Math.round(confidence)));

    setMetrics({
      wordCount,
      elapsedSpeakingSeconds: Math.round(elapsedSeconds),
      wpm,
      fillerWordCount: filler.count,
      fillerRatioPercent: filler.ratioPercent,
      confidenceScore,
      tone,
    });
  }, []);

  const resetMetrics = useCallback(() => {
    questionEndedAtRef.current = Date.now();
    speechStartedAtRef.current = null;
    setMetrics({
      wordCount: 0,
      elapsedSpeakingSeconds: 0,
      wpm: 0,
      fillerWordCount: 0,
      fillerRatioPercent: 0,
      confidenceScore: 85,
      tone: null,
    });
  }, []);

  return {
    metrics,
    markInterviewerFinished,
    processTranscript,
    resetMetrics,
  };
}
