const assert = require('node:assert');

console.log('[Test Harness] Running Silent Vision Solver & Screenshot Parser Verification (Groq)...');

// 1. Test Base64 Data URL Sanitizer
function sanitizeDataUrl(dataUrl) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
}

const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const cleaned = sanitizeDataUrl(testDataUrl);
assert.strictEqual(cleaned.startsWith('data:'), false, 'Data URL header not stripped');
assert.strictEqual(cleaned, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
console.log('✓ In-memory base64 screenshot sanitization verified');

// 2. Test Vision Solution Markdown Parser
function parseSolution(markdown) {
  const codeMatch = markdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : '';

  const timeMatch = markdown.match(/Time Complexity:?\*\*?\s*O\(([^)]+)\)/i);
  const spaceMatch = markdown.match(/Space Complexity:?\*\*?\s*O\(([^)]+)\)/i);

  const timeComplexity = timeMatch ? `O(${timeMatch[1]})` : 'O(N)';
  const spaceComplexity = spaceMatch ? `O(${spaceMatch[1]})` : 'O(1)';

  return {
    timeComplexity,
    spaceComplexity,
    code,
  };
}

const mockGroqVisionOutput = `### Problem
**Two Sum (LeetCode #1)**: Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

### Complexity
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)

### Optimal Approach
Use a hash map to store elements and their indices in a single pass. For each element \`x\`, check if \`target - x\` already exists in the map.

### Solution (Python)
\`\`\`python
def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
\`\`\`

### Edge Cases
- No two numbers sum to target (return empty list)
- Duplicate values adding up to target`;

const parsed = parseSolution(mockGroqVisionOutput);

assert.strictEqual(parsed.timeComplexity, 'O(N)', 'Failed to parse Time Complexity');
assert.strictEqual(parsed.spaceComplexity, 'O(N)', 'Failed to parse Space Complexity');
assert(parsed.code.includes('seen = {}'), 'Failed to extract clean Python code block');
assert(parsed.code.includes('return [seen[complement], i]'), 'Failed to extract solution body');
console.log('✓ Groq Vision solution parser and code extractor verified');

// 3. Test Groq Llama 4 Multimodal Vision Payload Construction
function constructGroqVisionPayload(apiKey, base64Image, language, systemPrompt = 'You are GhostPilot.', model = 'llama-3.2-11b-vision-preview') {
  const prompt = `Analyze the coding problem on my screen and provide the optimal solution in ${language}.`;

  return {
    model,
    max_tokens: 1500,
    temperature: 0.1,
    stream: true,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  };
}

const payload = constructGroqVisionPayload('gsk_test_key_12345', cleaned, 'Python');
assert.strictEqual(payload.model, 'llama-3.2-11b-vision-preview');
assert.strictEqual(payload.messages[0].role, 'system');
assert.strictEqual(payload.messages[1].role, 'user');
assert.strictEqual(payload.messages[1].content[0].type, 'text');
assert.strictEqual(payload.messages[1].content[0].text.includes('Python'), true);
assert.strictEqual(payload.messages[1].content[1].type, 'image_url');
assert.strictEqual(
  payload.messages[1].content[1].image_url.url,
  `data:image/png;base64,${cleaned}`
);

const fallbackPayload = constructGroqVisionPayload('gsk_test_key_12345', cleaned, 'Python', undefined, 'meta-llama/llama-4-maverick-17b-128e-instruct');
assert.strictEqual(fallbackPayload.model, 'meta-llama/llama-4-maverick-17b-128e-instruct');
console.log('✓ Groq Vision (llama-3.2-11b-vision-preview & llama-4-maverick) payload specification verified');

console.log('\n[Test Harness] ALL SILENT VISION SOLVER TESTS PASSED!\n');
