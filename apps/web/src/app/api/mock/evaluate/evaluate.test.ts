import { describe, it, expect } from 'vitest';

// Pure rubric calculation logic extracted for unit testing
function calculateRubric(
  candidateAnswers: Array<{ speaker: 'candidate'; text: string }>,
  history: Array<{ speaker: 'interviewer' | 'candidate'; text: string }>
) {
  const answerCount = candidateAnswers.length;
  const totalWords = candidateAnswers.reduce((acc, curr) => acc + curr.text.split(/\s+/).length, 0);
  const avgWordsPerAnswer = answerCount > 0 ? Math.round(totalWords / answerCount) : 0;

  const technicalScore = Math.min(95, Math.max(68, 70 + Math.round(avgWordsPerAnswer / 8)));
  const communicationScore = Math.min(96, Math.max(72, 75 + (answerCount >= 3 ? 15 : 5)));
  const problemSolvingScore = Math.min(94, Math.max(70, 72 + Math.round(avgWordsPerAnswer / 10)));
  const overallScore = Math.round((technicalScore + communicationScore + problemSolvingScore) / 3);

  const questionsAsked = history
    .filter((h) => h.speaker === 'interviewer')
    .map((q, idx) => {
      const correspondingAnswer = history[history.indexOf(q) + 1]?.text || 'No response recorded';
      return {
        id: `q_${idx + 1}`,
        question: q.text,
        candidateAnswer: correspondingAnswer,
        score: Math.min(96, Math.max(70, 75 + ((idx * 7) % 20))),
      };
    });

  return {
    scorecard: {
      overall: overallScore,
      technicalDepth: technicalScore,
      communication: communicationScore,
      problemSolving: problemSolvingScore,
    },
    questions: questionsAsked,
  };
}

describe('Mock Interview Rubric Calculation', () => {
  it('handles empty candidate answers gracefully with baseline scores', () => {
    const result = calculateRubric([], []);
    expect(result.scorecard.overall).toBeGreaterThanOrEqual(68);
    expect(result.scorecard.overall).toBeLessThanOrEqual(95);
    expect(result.scorecard.communication).toBe(80); // 75 + 5
    expect(result.questions).toHaveLength(0);
  });

  it('boosts communication score when answer count >= 3', () => {
    const candidateAnswers: Array<{ speaker: 'candidate'; text: string }> = [
      { speaker: 'candidate', text: 'This is my first detailed answer about databases.' },
      { speaker: 'candidate', text: 'This is my second answer about microservices.' },
      { speaker: 'candidate', text: 'This is my third answer about caching.' },
    ];
    const history: Array<{ speaker: 'interviewer' | 'candidate'; text: string }> = [
      { speaker: 'interviewer', text: 'Q1' },
      candidateAnswers[0],
      { speaker: 'interviewer', text: 'Q2' },
      candidateAnswers[1],
      { speaker: 'interviewer', text: 'Q3' },
      candidateAnswers[2],
    ];

    const result = calculateRubric(candidateAnswers, history);
    expect(result.scorecard.communication).toBe(90); // 75 + 15
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].candidateAnswer).toBe(candidateAnswers[0].text);
  });

  it('correctly reports "No response recorded" when interviewer question has no answer', () => {
    const history: Array<{ speaker: 'interviewer' | 'candidate'; text: string }> = [
      { speaker: 'interviewer', text: 'Unanswered question?' },
    ];
    const result = calculateRubric([], history);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].candidateAnswer).toBe('No response recorded');
  });

  it('clamps scores within valid rubric bounds [68, 96]', () => {
    const veryLongText = new Array(200).fill('architecture').join(' ');
    const candidateAnswers: Array<{ speaker: 'candidate'; text: string }> = [
      { speaker: 'candidate', text: veryLongText },
      { speaker: 'candidate', text: veryLongText },
      { speaker: 'candidate', text: veryLongText },
      { speaker: 'candidate', text: veryLongText },
    ];
    const result = calculateRubric(candidateAnswers, []);
    expect(result.scorecard.technicalDepth).toBeLessThanOrEqual(95);
    expect(result.scorecard.problemSolving).toBeLessThanOrEqual(94);
    expect(result.scorecard.communication).toBeLessThanOrEqual(96);
  });
});
