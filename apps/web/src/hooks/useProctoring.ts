'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ProctoringViolationType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'COPY_SHORTCUT'
  | 'PASTE_SHORTCUT'
  | 'FULLSCREEN_EXIT'
  | 'GAZE_AWAY';

export interface ProctoringIncident {
  id: string;
  type: ProctoringViolationType;
  timestamp: number;
  message: string;
}

export interface UseProctoringOptions {
  enabled?: boolean;
  onViolation?: (incident: ProctoringIncident) => void;
}

export function useProctoring({ enabled = false, onViolation }: UseProctoringOptions = {}) {
  const [incidents, setIncidents] = useState<ProctoringIncident[]>([]);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reportIncident = useCallback(
    (type: ProctoringViolationType, message: string) => {
      const incident: ProctoringIncident = {
        id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        timestamp: Date.now(),
        message,
      };

      setIncidents((prev) => [...prev, incident]);

      // Trigger warning banner toast
      setActiveToast(`⚠️ Fair-Play Notice: ${message}`);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 4000);

      if (onViolation) {
        onViolation(incident);
      }
    },
    [onViolation]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. Tab switch / visibilitychange handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportIncident('TAB_SWITCH', 'Tab switched or window minimized during live evaluation.');
      }
    };

    // 2. Window blur handler (focus loss)
    const handleWindowBlur = () => {
      reportIncident('WINDOW_BLUR', 'Browser window lost focus. Keep focus on the assessment screen.');
    };

    // 3. Prohibited keyboard shortcuts (Ctrl+C, Ctrl+V, Alt+Tab)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        reportIncident('COPY_SHORTCUT', 'Copy keyboard shortcut detected.');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        reportIncident('PASTE_SHORTCUT', 'Paste shortcut detected.');
      }
    };

    // 4. Fullscreen change handler
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportIncident('FULLSCREEN_EXIT', 'Fullscreen mode was exited.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [enabled, reportIncident]);

  const resetProctoring = useCallback(() => {
    setIncidents([]);
    setActiveToast(null);
  }, []);

  return {
    incidents,
    violationCount: incidents.length,
    activeToast,
    dismissToast: () => setActiveToast(null),
    resetProctoring,
  };
}
