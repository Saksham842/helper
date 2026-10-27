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

// 2. Test Vision Solution Markdown Parser with Strict 5-Tier Sequence Ordering
function parseSolution(markdown) {
  const intuitionIdx = markdown.search(/### (?:1\.\s*)?(?:Intuition|What to Say)/i);
  const bruteForceIdx = markdown.search(/### (?:2\.\s*)?Brute Force/i);
  const optimalApproachIdx = markdown.search(/### (?:3\.\s*)?Optimal Approach/i);
  const solutionIdx = markdown.search(/### (?:4\.\s*)?Solution/i);
  const complexityIdx = markdown.search(/### (?:5\.\s*)?Complexity/i);

  // Verify strict ordering: Intuition -> Brute Force -> Optimal Approach Concept -> Solution Code -> Complexity & Edge Cases
  assert(intuitionIdx >= 0, 'Missing Intuition / What to Say section');
  assert(bruteForceIdx > intuitionIdx, 'Brute force section must appear AFTER intuition script');
  assert(optimalApproachIdx > bruteForceIdx, 'Optimal approach concept must appear AFTER brute force approach');
  assert(solutionIdx > optimalApproachIdx, 'Solution code must appear strictly AFTER optimal approach concept');
  assert(complexityIdx > solutionIdx, 'Complexity section must appear strictly AFTER Solution code block');

  const codeMatch = markdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : '';

  // Extract optimal complexity placed strictly after the code block
  const firstCodeFence = markdown.indexOf('```');
  const secondCodeFence = firstCodeFence >= 0 ? markdown.indexOf('```', firstCodeFence + 3) : -1;
  const postCodeSection = secondCodeFence >= 0 ? markdown.slice(secondCodeFence + 3) : markdown;

  const timeMatch = postCodeSection.match(/Time Complexity:?\*\*?\s*O\(([^)]+)\)/i);
  const spaceMatch = postCodeSection.match(/Space Complexity:?\*\*?\s*O\(([^)]+)\)/i);

  const timeComplexity = timeMatch ? `O(${timeMatch[1]})` : 'O(N)';
  const spaceComplexity = spaceMatch ? `O(${spaceMatch[1]})` : 'O(1)';

  // Extract brute force complexity placed in brute force section
  const bruteSection = markdown.slice(bruteForceIdx, optimalApproachIdx);
  const bruteTimeMatch = bruteSection.match(/Time Complexity:?\*\*?\s*O\(([^)]+)\)/i);
  const bruteSpaceMatch = bruteSection.match(/Space Complexity:?\*\*?\s*O\(([^)]+)\)/i);
  const bruteTimeComplexity = bruteTimeMatch ? `O(${bruteTimeMatch[1]})` : 'O(N²)';
  const bruteSpaceComplexity = bruteSpaceMatch ? `O(${bruteSpaceMatch[1]})` : 'O(1)';

  return {
    timeComplexity,
    spaceComplexity,
    bruteTimeComplexity,
    bruteSpaceComplexity,
    code,
  };
}

const mockGroqVisionOutput = `### 1. Intuition / What to Say Out Loud
- My initial intuition here is to use a hash map to achieve single-pass O(N) lookup.
- As we iterate through nums, we can check if target minus the current number already exists in our table.
- If it does, we immediately return the pair of indices; otherwise, we insert the current value and index.

### 2. Brute Force Approach & Complexity
- **Approach:** Iterate through all pairs of elements (i, j) with nested loops and check if nums[i] + nums[j] == target. Suboptimal because of quadratic comparisons.
- **Time Complexity:** O(N²) | **Space Complexity:** O(1)

### 3. Optimal Approach & Concept
- **Concept & Strategy:** Instead of re-scanning previous elements, we use a hash map (unordered_map) storing complement -> index. For each number, we look up its complement in O(1) average time, reducing overall complexity from O(N²) to linear O(N).

### 4. Solution (C++)
\`\`\`cpp
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}
\`\`\`

### 5. Complexity & Edge Cases
- **Time Complexity:** O(N) - Linear scan visiting each element at most once with O(1) hash map lookups.
- **Space Complexity:** O(N) - Hash map storing up to N elements in the worst case.
- **Edge Cases:** Empty vector, duplicate elements adding up to target, negative numbers.`;

const parsed = parseSolution(mockGroqVisionOutput);

assert.strictEqual(parsed.bruteTimeComplexity, 'O(N²)', 'Failed to parse Brute Force Time Complexity');
assert.strictEqual(parsed.timeComplexity, 'O(N)', 'Failed to parse Optimal Time Complexity');
assert.strictEqual(parsed.spaceComplexity, 'O(N)', 'Failed to parse Optimal Space Complexity');
assert(parsed.code.includes('std::unordered_map<int, int> seen;'), 'Failed to extract clean C++ code block');
assert(parsed.code.includes('return {seen[complement], i};'), 'Failed to extract C++ solution body');
console.log('✓ Strict 5-tier sequence ordering (Intuition -> Brute Force -> Optimal Approach Concept -> Solution Code -> Complexity) verified');

// 3. Test Groq Multimodal Vision Payload Construction with C++ Defaults
function constructGroqVisionPayload(apiKey, base64Image, language = 'C++', systemPrompt = 'You are GhostPilot.', model = 'qwen/qwen3.8-27b') {
  const prompt = `Analyze the coding problem on my screen and provide the optimal solution in ${language}.`;

  return {
    model,
    max_tokens: 2500,
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

const payload = constructGroqVisionPayload('gsk_test_key_12345', cleaned, 'C++');
assert.strictEqual(payload.max_tokens, 2500);
assert.strictEqual(payload.model, 'qwen/qwen3.8-27b');
assert.strictEqual(payload.messages[0].role, 'system');
assert.strictEqual(payload.messages[1].role, 'user');
assert.strictEqual(payload.messages[1].content[0].type, 'text');
assert.strictEqual(payload.messages[1].content[0].text.includes('C++'), true);
assert.strictEqual(payload.messages[1].content[1].type, 'image_url');
assert.strictEqual(
  payload.messages[1].content[1].image_url.url,
  `data:image/png;base64,${cleaned}`
);

const fallbackPayload = constructGroqVisionPayload('gsk_test_key_12345', cleaned, 'C++', undefined, 'qwen/qwen3.8-27b');
assert.strictEqual(fallbackPayload.model, 'qwen/qwen3.8-27b');
console.log('✓ Groq Vision C++ default payload specification verified');

console.log('\n[Test Harness] ALL SILENT VISION SOLVER TESTS PASSED!\n');
