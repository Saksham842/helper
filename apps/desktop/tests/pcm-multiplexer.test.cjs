const assert = require('node:assert');

console.log('[Test Harness] Running Dual-Channel PCM Multiplexer Verification...');

// 1. Test Float32 to Int16 PCM conversion & interleaving math
function convertAndInterleave(leftChannel, rightChannel) {
  const sampleCount = leftChannel.length;
  const interleavedPCM = new Int16Array(sampleCount * 2);

  for (let i = 0; i < sampleCount; i++) {
    const leftSample = Math.max(-1, Math.min(1, leftChannel[i]));
    interleavedPCM[i * 2] = leftSample < 0 ? leftSample * 32768 : leftSample * 32767;

    const rightSample = Math.max(-1, Math.min(1, rightChannel[i]));
    interleavedPCM[i * 2 + 1] = rightSample < 0 ? rightSample * 32768 : rightSample * 32767;
  }

  return interleavedPCM;
}

// 2. Test RMS calculation
function calculateRMS(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sum / samples.length);
  return Math.min(1.0, rms * 5);
}

// Test case 1: Standard signals
const left = new Float32Array([1.0, 0.0, -1.0]);
const right = new Float32Array([0.5, -0.5, 0.0]);

const pcm = convertAndInterleave(left, right);
assert.strictEqual(pcm.length, 6, 'Output length must be 2 * sampleCount');

assert.strictEqual(pcm[0], 32767, 'Left channel positive full scale');
assert.strictEqual(pcm[1], 16383, 'Right channel half scale');
assert.strictEqual(pcm[2], 0, 'Left channel silence');
assert.strictEqual(pcm[3], -16384, 'Right channel negative half scale');
assert.strictEqual(pcm[4], -32768, 'Left channel negative full scale');
assert.strictEqual(pcm[5], 0, 'Right channel silence');
console.log('✓ Dual-channel Linear16 PCM conversion and interleaving verified');

// Test case 2: Clamping extremes
const leftExtreme = new Float32Array([2.5, -3.0]);
const rightExtreme = new Float32Array([-1.5, 1.2]);
const pcmClamped = convertAndInterleave(leftExtreme, rightExtreme);

assert.strictEqual(pcmClamped[0], 32767, 'Exceeded positive must clamp to 32767');
assert.strictEqual(pcmClamped[1], -32768, 'Exceeded negative must clamp to -32768');
assert.strictEqual(pcmClamped[2], -32768, 'Exceeded negative must clamp to -32768');
assert.strictEqual(pcmClamped[3], 32767, 'Exceeded positive must clamp to 32767');
console.log('✓ PCM audio signal clamping verified');

// Test case 3: RMS calculation
const silence = new Float32Array([0, 0, 0, 0]);
assert.strictEqual(calculateRMS(silence), 0, 'Silence must produce 0 RMS');

const signal = new Float32Array([0.2, 0.2, 0.2, 0.2]);
const signalRMS = calculateRMS(signal);
assert(signalRMS > 0 && signalRMS <= 1.0, 'Active audio must produce normalized RMS > 0');
console.log('✓ VU meter RMS level calculation verified');

console.log('\n[Test Harness] ALL AUDIO MULTIPLEXER TESTS PASSED!\n');
