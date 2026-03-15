/**
 * Language Guard - Blocks Non-Arabic/English Languages
 * Prevents Chinese, Japanese, Korean, Russian, Hindi, Thai, Hebrew from responses
 */

// Combined regex for all blocked languages
const BLOCKED_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u1100-\u11ff\u0400-\u04ff\u0900-\u097f\u0e00-\u0e7f\u0590-\u05ff]/;

function containsNonArabicEnglish(text) {
  if (!text) return false;
  return BLOCKED_REGEX.test(text);
}

function removeNonArabicEnglish(text) {
  if (!text) return '';
  return text.replace(BLOCKED_REGEX, '');
}

function filterResponse(text) {
  if (containsNonArabicEnglish(text)) {
    console.log('⚠️ Non-Arabic/English detected - filtering');
    return removeNonArabicEnglish(text);
  }
  return text;
}

// Test
const tests = [
  ['English', 'Hello'],
  ['Arabic', 'مرحبا'],
  ['Chinese', '中文'],
  ['Japanese', '日本語'],
  ['Korean', '한국어'],
  ['Russian', 'Русский'],
  ['Thai', 'ไทย'],
  ['Hebrew', 'שלום'],
  ['Hindi', 'नमस्ते'],
];

console.log('=== Language Guard ===');
tests.forEach(([lang, text]) => {
  const blocked = containsNonArabicEnglish(text);
  console.log(lang + ':', blocked ? '❌ BLOCKED' : '✅ ALLOWED');
});

module.exports = {
  containsNonArabicEnglish,
  removeNonArabicEnglish,
  filterResponse
};
