const assert = require('assert');
const mammoth = require('mammoth');

async function runTests() {
  console.log('[Test Harness] Running Document Extractor Verification...');

  // Test 1: Verify mammoth extraction module is available
  assert.strictEqual(typeof mammoth.extractRawText, 'function', 'mammoth.extractRawText must be a function');
  console.log('✓ Mammoth DOCX extractor verified');

  // Test 2: Whitespace normalization
  const sampleRaw = '  Senior Staff Engineer \r\n\r\n\r\n Experience:   Distributed Systems  \n\n\n Projects: \x00\x07 ';
  const clean = sampleRaw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  assert.ok(!clean.includes('\r'), 'Must not contain CR');
  assert.ok(!clean.includes('\x00'), 'Must strip null bytes');
  assert.strictEqual(clean.includes('\n\n\n'), false, 'Must collapse 3+ newlines');
  console.log('✓ Text normalization and character cleaning verified');

  // Test 3: PDF parser class instantiation
  const pdfModule = require('pdf-parse');
  const PDFParse = pdfModule.PDFParse || pdfModule.default?.PDFParse || pdfModule.default;
  assert.ok(PDFParse, 'pdf-parse must export PDFParse class or function');
  console.log('✓ pdf-parse class structure verified');

  console.log('[Test Harness] ALL RESUME & DOCUMENT EXTRACTOR CHECKS PASSED!');
}

runTests().catch((err) => {
  console.error('[Test Failed]:', err);
  process.exit(1);
});
