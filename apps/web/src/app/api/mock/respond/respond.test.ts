import { describe, it, expect } from 'vitest';

// Test the simulated response selection logic directly
// (extracted from route handler for unit testability)

const simulatedResponses: Record<string, string[]> = {
  'System Design & Architecture': [
    "That's a sound architectural foundation. How would you handle hot partition keys if 80% of read traffic suddenly concentrates on 1% of the database shards?",
    "Good intuition on caching. If the cache nodes experience a network partition, what consistency model would you choose between AP and CP, and why?",
    "How would you ensure exactly-once processing semantics across your message queues and downstream worker pools without introducing unbounded latency?",
    "Let's wrap up this track. Can you summarize the end-to-end SLA, estimated cost, and single point of failure in this design?",
  ],
  'Frontend & Full-Stack': [
    "Great explanation. In React 19, how does concurrent rendering interact with Suspense boundaries during heavy client-side state transitions?",
    "How would you optimize the Core Web Vitals (specifically INP and LCP) on a page rendering dynamic, high-frequency stock ticker updates?",
    "Walk me through how you would architect a resilient offline-first data layer with IndexedDB and background Service Worker sync.",
    "How would you mitigate Cross-Site Scripting (XSS) in an application rendering user-supplied markdown and rich text widgets?",
  ],
  'Algorithms & Problem Solving': [
    "Good approach. What is the precise time and space complexity of your solution, and can you optimize the extra auxiliary space to O(1)?",
    "What edge cases could cause this algorithm to degrade to quadratic time, and how would you restructure the traversal to prevent it?",
    "Could you walk me through how a sliding window or monotonic queue would improve the time complexity for streaming inputs?",
    "Excellent breakdown. Let's analyze how this algorithm scales if the input dataset exceeds available RAM by 10x.",
  ],
  'Behavioral & Leadership': [
    "Thank you for sharing that experience. Can you tell me about a time when you strongly disagreed with a tech lead's architectural decision and how you handled the disagreement?",
    "Tell me about a project that fell behind schedule. What proactive steps did you take to re-align stakeholders and deliver the critical path?",
    "How do you approach mentoring junior engineers when their code contributions consistently fail quality gates or unit tests?",
    "Describe a high-stakes production incident you led resolution for. What was the root cause, and how did you prevent recurrence in the post-mortem?",
  ],
};

function selectSimulatedResponse(track: string, historyLength: number): string {
  const trackList = simulatedResponses[track] || simulatedResponses['System Design & Architecture'];
  const questionIndex = Math.min(Math.floor(historyLength / 2), trackList.length - 1);
  return trackList[questionIndex];
}

describe('mock/respond - simulated response selection (no API key)', () => {
  it('returns first question when history is empty (length 0)', () => {
    const result = selectSimulatedResponse('System Design & Architecture', 0);
    expect(result).toBe(simulatedResponses['System Design & Architecture'][0]);
  });

  it('returns second question when history has 2 entries (1 exchange)', () => {
    const result = selectSimulatedResponse('System Design & Architecture', 2);
    expect(result).toBe(simulatedResponses['System Design & Architecture'][1]);
  });

  it('returns third question when history has 4 entries (2 exchanges)', () => {
    const result = selectSimulatedResponse('System Design & Architecture', 4);
    expect(result).toBe(simulatedResponses['System Design & Architecture'][2]);
  });

  it('clamps to last question when history is very long', () => {
    const trackList = simulatedResponses['System Design & Architecture'];
    const result = selectSimulatedResponse('System Design & Architecture', 100);
    expect(result).toBe(trackList[trackList.length - 1]);
  });

  it('falls back to System Design track for unknown track names', () => {
    const result = selectSimulatedResponse('Unknown Track Name', 0);
    expect(result).toBe(simulatedResponses['System Design & Architecture'][0]);
  });

  it('selects from Frontend track correctly', () => {
    const result = selectSimulatedResponse('Frontend & Full-Stack', 0);
    expect(result).toBe(simulatedResponses['Frontend & Full-Stack'][0]);
  });

  it('selects from Behavioral track correctly', () => {
    const result = selectSimulatedResponse('Behavioral & Leadership', 0);
    expect(result).toBe(simulatedResponses['Behavioral & Leadership'][0]);
  });
});
