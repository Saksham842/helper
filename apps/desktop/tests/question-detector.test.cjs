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

// 1b. Candidate Topic Clarification Extraction
const candidateTopicPatterns = [
  /\b(?:so\s+(?:you\s+are|you're)\s+asking\s+about|asking\s+about|asked\s+about)\s+(?:the\s+|how\s+to\s+)?(.+)/i,
  /\b(?:so\s+you\s+want\s+me\s+to|you\s+want\s+me\s+to|you'd\s+like\s+me\s+to)\s+(.+)/i,
  /\b(?:how\s+to\s+design|how\s+do\s+we\s+design|how\s+should\s+we\s+design|design\s+a|design\s+an)\s+(.+)/i,
  /\b(?:can\s+we\s+solve\s+this\s+with|can\s+we\s+use|what\s+if\s+we\s+use)\s+(.+)/i,
  /\b(?:the\s+question\s+is\s+about|the\s+problem\s+is\s+about)\s+(.+)/i,
  /\b(?:let's\s+design|let's\s+implement|let's\s+solve)\s+(.+)/i,
];

function extractCandidateTopic(text) {
  for (const re of candidateTopicPatterns) {
    const match = text.match(re);
    if (match && match[1]) {
      let cleaned = match[1].replace(/[.,?!]+$/, '').trim();
      if (cleaned.length >= 4) {
        if (/how\s+to\s+design/i.test(match[0]) && !/^design/i.test(cleaned)) {
          return `Design ${cleaned}`;
        }
        return cleaned;
      }
    }
  }
  if (text.includes('?') && /\b(how|why|what|can|could|should|which)\b/i.test(text)) {
    return text.trim();
  }
  return null;
}

const testUtterance = "I'm sorry, is there a glitch in the audio? So can you please repeat the question? Thank you. Okay, so you are asking about the how to design rate limiter.";
const extractedTopic = extractCandidateTopic(testUtterance);
assert(extractedTopic && extractedTopic.toLowerCase().includes('rate limiter'), `Failed to extract rate limiter topic: "${extractedTopic}"`);
assert.strictEqual(extractCandidateTopic("Okay, so you want me to implement LRU Cache."), "implement LRU Cache");
assert.strictEqual(extractCandidateTopic("Can we solve this with Two Pointers?"), "Two Pointers");
console.log('✓ Candidate topic clarification extraction verified');

// 2. Prompt Engine Assembly Logic
function buildSystemPrompt(lang = 'C++') {
  return `You are GhostPilot, an undetectable, ultra-low latency real-time interview copilot.
1. Ultra-Scannable: Format answers in 3-4 concise bullet points maximum.
2. Bold Key Terms: Bold core technical keywords, metrics, or architecture patterns.
3. First-Person Voice: Speak from the candidate's perspective.
4. Default Language: Provide modern ${lang} code (C++20 STL) with zero horizontal scroll.
5. Follow-Up Reconciliation: Reconcile candidate spoken responses with interviewer probes.
6. 5-Tier Coding Sequence: 1. Intuition -> 2. Brute Force -> 3. Optimal Approach & Concept -> 4. Optimal Code -> 5. Complexity & Edge Cases.
7. Tailor to Resume: Weave in relevant technologies.
8. No Fluff: Zero introductory or concluding remarks.`;
}

function buildUserPrompt(context, question, history) {
  let prompt = '';
  if (context.targetRole) prompt += `Target Role: ${context.targetRole}\n`;
  if (context.customInstructions) prompt += `Custom Instructions: ${context.customInstructions}\n`;
  if (context.resumeText) prompt += `\nCandidate Resume Highlights:\n${context.resumeText}\n`;
  if (history && history.length > 0) {
    const formatted = history.map((h) => {
      if (typeof h === 'string') return h;
      if (h.role === 'candidate_spoken') return `[Candidate Spoken]: ${h.text}`;
      if (h.role === 'ai_suggestion') return `[AI Copilot Suggested]: ${h.text}`;
      return `[Interviewer]: ${h.text}`;
    });
    prompt += `\nMulti-Turn History:\n${formatted.join('\n')}\n`;
  }
  prompt += `\nQuestion to Answer:\n"${question}"`;
  return prompt;
}

const sysPrompt = buildSystemPrompt('C++');
assert(sysPrompt.includes('Ultra-Scannable'), 'System prompt missing scannable instruction');
assert(sysPrompt.includes('Bold Key Terms'), 'System prompt missing bold instruction');
assert(sysPrompt.includes('C++20 STL'), 'System prompt missing C++ default instruction');
assert(sysPrompt.includes('Follow-Up Reconciliation'), 'System prompt missing follow-up reconciliation instruction');
assert(sysPrompt.includes('5-Tier Coding Sequence'), 'System prompt missing 5-tier coding sequence instruction');

const testContext = {
  targetRole: 'Staff Systems Architect',
  customInstructions: 'STAR method with focus on throughput and latency.',
  resumeText: 'Engineered Go & Kafka streaming engine handling 250k events/sec.',
};
const history = [
  { role: 'interviewer', text: 'How do you handle memory fragmentation in C++?' },
  { role: 'ai_suggestion', text: 'Use custom pool allocators or jemalloc.' },
  { role: 'candidate_spoken', text: 'In my last role, we deployed custom slab allocators to mitigate arena fragmentation.' },
];
const userPrompt = buildUserPrompt(testContext, 'Can you elaborate on why slab allocation was better than buddy allocation?', history);

assert(userPrompt.includes('Staff Systems Architect'), 'User prompt missing target role');
assert(userPrompt.includes('250k events/sec'), 'User prompt missing resume highlights');
assert(userPrompt.includes('STAR method'), 'User prompt missing custom instructions');
assert(userPrompt.includes('[Candidate Spoken]: In my last role, we deployed custom slab allocators'), 'User prompt missing candidate spoken transcript');
assert(userPrompt.includes('slab allocation was better than buddy allocation'), 'User prompt missing follow-up question');
console.log('✓ Prompt Engine multi-turn context assembly and candidate spoken transcript injection verified');

// 3. Groq Messages Payload & Fallback Verification
function buildGroqPayload(sysPrompt, userPrompt, model = 'openai/gpt-oss-120b') {
  return {
    model,
    max_tokens: 600,
    temperature: 0.2,
    stream: true,
    messages: [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
}

const groqPayload = buildGroqPayload(sysPrompt, userPrompt);
assert.strictEqual(groqPayload.messages.length, 2);
assert.strictEqual(groqPayload.messages[0].role, 'system');
assert.strictEqual(groqPayload.messages[0].content, sysPrompt);
assert.strictEqual(groqPayload.messages[1].role, 'user');
assert.strictEqual(groqPayload.messages[1].content, userPrompt);
assert.strictEqual(groqPayload.model, 'openai/gpt-oss-120b');

const groqFallbackPayload = buildGroqPayload(sysPrompt, userPrompt, 'openai/gpt-oss-20b');
assert.strictEqual(groqFallbackPayload.model, 'openai/gpt-oss-20b');
console.log('✓ Groq Chat standard message format and fast fallback model verified');

// 4. Groq API Key Format Verification
function validateGroqApiKey(key) {
  return typeof key === 'string' && key.startsWith('gsk_') && key.length > 10;
}
assert.strictEqual(validateGroqApiKey('gsk_valid_key_sample_1234567890'), true);
assert.strictEqual(validateGroqApiKey('sk-ant-invalid-prefix'), false);
assert.strictEqual(validateGroqApiKey(''), false);
console.log('✓ Groq API Key format (gsk_) verification passed');

console.log('\n[Test Harness] ALL QUESTION DETECTOR & PROMPT ENGINE TESTS PASSED!\n');
