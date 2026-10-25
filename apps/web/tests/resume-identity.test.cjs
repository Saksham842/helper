const assert = require('assert');

function runIdentityTests() {
  console.log('[Test Harness] Running Resume Identity & Experience Tests...');

  // 1. Email extraction test
  const sample1 = "John Doe\nSoftware Engineer\njohn.doe@example.com | +1 (555) 234-5678\nlinkedin.com/in/johndoe";
  const emailMatch = sample1.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.strictEqual(emailMatch[0].toLowerCase(), 'john.doe@example.com');
  console.log('✓ Email extraction verified');

  // 2. Phone extraction test
  const phoneCandidates = sample1.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
  let foundPhone = '';
  for (const c of phoneCandidates) {
    const digits = c.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      foundPhone = c.replace(/\s+/g, ' ').trim();
      break;
    }
  }
  assert.ok(foundPhone.includes('555'), 'Phone digits extracted');
  console.log('✓ Phone extraction verified');

  // 3. Experience years extraction test
  const sampleExp = "Summary:\nSenior backend engineer with 8+ years of experience in distributed systems.\nWork History: 2016 - 2024 at Google";
  const explicitMatches = [...sampleExp.matchAll(/(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional|industry|relevant|software|hands-on))?\s*experience/gi)];
  assert.ok(explicitMatches.length > 0);
  assert.strictEqual(parseFloat(explicitMatches[0][1]), 8);
  console.log('✓ Experience years regex verified (8 years)');

  // 4. LinkedIn extraction test
  const linkedinMatch = sample1.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s)]+/i);
  assert.ok(linkedinMatch[0].includes('johndoe'));
  console.log('✓ LinkedIn URL extraction verified');

  console.log('[Test Harness] ALL RESUME IDENTITY EXTRACTION CHECKS PASSED!');
}

runIdentityTests();
