/**
 * Delivery Style & Speech Tone Heuristics
 * Evaluates candidate speaking performance, tempo (WPM), filler frequency, and STAR structure.
 */

export type DeliveryStyle =
  | 'Confident & Articulate'
  | 'Hesitant / Pausing'
  | 'Scripted / Monotone'
  | 'Rambling / Run-on';

export interface ToneAnalysisResult {
  deliveryStyle: DeliveryStyle;
  paceRating: 'Too Slow' | 'Optimal Pace' | 'Too Fast';
  wpm: number;
  fillerWordCount: number;
  fillerRatioPercent: number;
  detectedFillers: Record<string, number>;
  starAdherence: {
    hasSituation: boolean;
    hasTask: boolean;
    hasAction: boolean;
    hasResult: boolean;
    scorePercent: number;
  };
  tips: string[];
}

export const COMMON_FILLER_WORDS = [
  'um',
  'uh',
  'like',
  'you know',
  'actually',
  'basically',
  'sort of',
  'kind of',
  'literally',
  'right',
  'i mean',
];

/**
 * Counts filler words in text
 */
export function analyzeFillerWords(text: string): {
  count: number;
  ratioPercent: number;
  details: Record<string, number>;
} {
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const totalWords = Math.max(1, words.length);

  const details: Record<string, number> = {};
  let totalFillers = 0;

  for (const filler of COMMON_FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = normalized.match(regex);
    if (matches && matches.length > 0) {
      details[filler] = matches.length;
      totalFillers += matches.length;
    }
  }

  const ratioPercent = Math.round((totalFillers / totalWords) * 100);

  return {
    count: totalFillers,
    ratioPercent,
    details,
  };
}

/**
 * Checks for STAR method keywords
 */
export function evaluateStarStructure(text: string) {
  const lower = text.toLowerCase();

  const situationKeywords = ['situation', 'context', 'background', 'when i was at', 'we had', 'problem was', 'project was'];
  const taskKeywords = ['task', 'goal', 'objective', 'responsible for', 'my role was', 'needed to', 'assigned'];
  const actionKeywords = ['action', 'i implemented', 'i designed', 'i led', 'i resolved', 'i built', 'i wrote', 'i created', 'steps i took'];
  const resultKeywords = ['result', 'outcome', 'impact', 'delivered', 'improved by', 'reduced by', 'metrics', 'achieved', 'launched'];

  const hasSituation = situationKeywords.some((k) => lower.includes(k));
  const hasTask = taskKeywords.some((k) => lower.includes(k));
  const hasAction = actionKeywords.some((k) => lower.includes(k));
  const hasResult = resultKeywords.some((k) => lower.includes(k));

  const count = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length;
  const scorePercent = count * 25;

  return {
    hasSituation,
    hasTask,
    hasAction,
    hasResult,
    scorePercent,
  };
}

/**
 * Master tone & delivery style evaluation
 */
export function classifyDeliveryTone(
  text: string,
  wpm: number = 135
): ToneAnalysisResult {
  const filler = analyzeFillerWords(text);
  const star = evaluateStarStructure(text);
  const tips: string[] = [];

  // Pace classification (optimal technical interview speech: 120-160 WPM)
  let paceRating: ToneAnalysisResult['paceRating'] = 'Optimal Pace';
  if (wpm < 110) {
    paceRating = 'Too Slow';
    tips.push('Pace is relatively slow; pick up tempo slightly to keep interviewers engaged.');
  } else if (wpm > 175) {
    paceRating = 'Too Fast';
    tips.push('Speaking very fast; pause after key technical points to allow interviewers to absorb your reasoning.');
  }

  // Delivery style classification
  let deliveryStyle: DeliveryStyle = 'Confident & Articulate';

  if (wpm > 170 && filler.ratioPercent > 6) {
    deliveryStyle = 'Rambling / Run-on';
    tips.push('Break answers into discrete paragraphs. Conclude with a clear summarizing takeaway.');
  } else if (wpm < 110 || filler.ratioPercent > 8) {
    deliveryStyle = 'Hesitant / Pausing';
    tips.push('Take 3 seconds to organize thoughts before answering rather than using mid-sentence filler pauses.');
  } else if (filler.count === 0 && text.length > 500 && wpm > 130 && wpm < 155) {
    deliveryStyle = 'Scripted / Monotone';
    tips.push('Add natural conversational cadence and emphasize specific technical choices to sound authentic.');
  } else {
    deliveryStyle = 'Confident & Articulate';
  }

  if (star.scorePercent < 50) {
    tips.push('Structure behavioral answers clearly around STAR (Situation, Task, Action, Result) for higher bar raiser marks.');
  }

  return {
    deliveryStyle,
    paceRating,
    wpm,
    fillerWordCount: filler.count,
    fillerRatioPercent: filler.ratioPercent,
    detectedFillers: filler.details,
    starAdherence: star,
    tips,
  };
}
