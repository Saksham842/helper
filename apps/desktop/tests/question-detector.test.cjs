const assert = require('node:assert');

console.log('[Test Harness] Running Question Detector & Prompt Engine Verification...');

// 1. Question Detector Rule Logic
const questionKeywords = [
  /\b(how|why|what|when|where|who|which)\b/i,
  /\b(can you|could you|would you|will you)\b/i,
  /\b(tell me about|explain|describe|walk me through|clarify)\b/i,
  /\b(have you (ever|worked|used|built|designed))\b/i,
  /\b(what's your experience|how do you handle|what are the trade-offs)\b/i,
  /\?$/,
];

const fillerPhrases = [
  /^(yeah|yes|yep|sure|okay|ok|right|cool|got it|sounds good|mhm|understood|alright)\.?$/i,
  /^(thank you|thanks|no problem|awesome)\.?$/i,
];

function isLikelyQuestion(text) {
  if (text.length < 5) return false;
  if (text.includes('?')) return true;
  return questionKeywords.some((pattern) => pattern.test(text));
}

function isFiller(text) {
  return fillerPhrases.some((pattern) => pattern.test(text.trim()));
}

// Test detection of valid technical interview questions
const validQuestions = [
  'How would you design a distributed cache with high availability?',
  'Can you explain how the React 19 reconciler handles concurrent updates?',
  'Tell me about your past experience migrating monoliths to microservices',
  'What are the trade-offs between PostgreSQL and Cassandra for time-series data?',
  'Have you worked with Kubernetes in production environments?',
  'Could you walk me through your debugging methodology for memory leaks?',
];

for (const q of validQuestions) {
  assert.strictEqual(isLikelyQuestion(q), true, `Failed to detect question: "${q}"`);
  assert.strictEqual(isFiller(q), false, `Wrongly flagged as filler: "${q}"`);
}
console.log(`✓ All ${validQuestions.length} technical interview questions correctly identified`);

// Test rejection of fillers and affirmations
const fillers = [
  'yeah',
  'ok.',
  'sounds good',
  'got it',
  'cool',
  'right',
  'thanks',
  'mhm',
];

for (const f of fillers) {
  assert.strictEqual(isFiller(f), true, `Failed to detect filler: "${f}"`);
}
console.log(`✓ All ${fillers.length} filler phrases filtered out successfully`);

// 2. Prompt Engine Assembly Logic
function buildSystemPrompt() {
  return `You are Parakeet AI, an undetectable, ultra-low latency real-time interview copilot.
1. Ultra-Scannable: Format answers in 3-4 concise bullet points maximum.
2. Bold Key Terms: Bold core technical keywords, metrics, or architecture patterns.
3. First-Person Voice: Speak from the candidate's perspective.
4. Tailor to Resume: Weave in relevant technologies.
5. No Fluff: Zero introductory or concluding remarks.`;
}

function buildUserPrompt(context, question, history) {
  let prompt = '';
  if (context.targetRole) prompt += `Target Role: ${context.targetRole}\n`;
  if (context.customInstructions) prompt += `Custom Instructions: ${context.customInstructions}\n`;
  if (context.resumeText) prompt += `\nCandidate Resume Highlights:\n${context.resumeText}\n`;
  if (history && history.length > 0) prompt += `\nRecent Context:\n${history.join('\n')}\n`;
  prompt += `\nQuestion to Answer:\n"${question}"`;
  return prompt;
}

const sysPrompt = buildSystemPrompt();
assert(sysPrompt.includes('Ultra-Scannable'), 'System prompt missing scannable instruction');
assert(sysPrompt.includes('Bold Key Terms'), 'System prompt missing bold instruction');

const testContext = {
  targetRole: 'Staff Systems Architect',
  customInstructions: 'STAR method with focus on throughput and latency.',
  resumeText: 'Engineered Go & Kafka streaming engine handling 250k events/sec.',
};
const history = [
  'Interviewer: Welcome, let us begin.',
  'Candidate: Glad to be here.',
];
const userPrompt = buildUserPrompt(testContext, validQuestions[0], history);

assert(userPrompt.includes('Staff Systems Architect'), 'User prompt missing target role');
assert(userPrompt.includes('250k events/sec'), 'User prompt missing resume highlights');
assert(userPrompt.includes('STAR method'), 'User prompt missing custom instructions');
assert(userPrompt.includes(validQuestions[0]), 'User prompt missing question');
console.log('✓ Prompt Engine context assembly and resume injection verified');

console.log('\n[Test Harness] ALL QUESTION DETECTOR & PROMPT ENGINE TESTS PASSED!\n');
