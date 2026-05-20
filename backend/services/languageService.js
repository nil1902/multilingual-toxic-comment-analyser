import { franc } from 'franc-min';

// Mapping ISO 639-3 codes to Readable Names and Flags
const LANGUAGE_MAP = {
  eng: { name: 'English', emoji: '🇺🇸' },
  spa: { name: 'Spanish', emoji: '🇪🇸' },
  fra: { name: 'French', emoji: '🇫🇷' },
  deu: { name: 'German', emoji: '🇩🇪' },
  rus: { name: 'Russian', emoji: '🇷🇺' },
  hin: { name: 'Hindi', emoji: '🇮🇳' },
  ara: { name: 'Arabic', emoji: '🇸🇦' },
  por: { name: 'Portuguese', emoji: '🇵🇹' },
  ita: { name: 'Italian', emoji: '🇮🇹' },
  nld: { name: 'Dutch', emoji: '🇳🇱' },
  swe: { name: 'Swedish', emoji: '🇸🇪' },
  tur: { name: 'Turkish', emoji: '🇹🇷' },
  ukr: { name: 'Ukrainian', emoji: '🇺🇦' },
  vie: { name: 'Vietnamese', emoji: '🇻🇳' },
  cmn: { name: 'Chinese', emoji: '🇨🇳' },
  jpn: { name: 'Japanese', emoji: '🇯🇵' },
  kor: { name: 'Korean', emoji: '🇰🇷' },
  und: { name: 'Undetermined', emoji: '❓' }
};

export const detectLanguage = (text) => {
  if (!text || text.trim().length < 3) {
    return { code: 'eng', name: 'English', emoji: '🇺🇸' };
  }

  // Detect using franc-min
  const langCode = franc(text, { minLength: 3 });

  if (langCode === 'und' || !LANGUAGE_MAP[langCode]) {
    // Check if it contains mostly English characters
    const asciiRegex = /^[\x00-\x7F]*$/;
    if (asciiRegex.test(text)) {
      return { code: 'eng', name: 'English', emoji: '🇺🇸' };
    }
    return { code: 'und', name: 'Undetermined', emoji: '❓' };
  }

  return {
    code: langCode,
    name: LANGUAGE_MAP[langCode].name,
    emoji: LANGUAGE_MAP[langCode].emoji,
  };
};
