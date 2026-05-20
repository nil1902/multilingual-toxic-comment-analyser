// Multilingual Sentiment Lexical Engine with Cross-Toxicity Penalty Correction
const SENTIMENT_LEXICON = {
  eng: {
    positive: ['love', 'like', 'good', 'great', 'excellent', 'awesome', 'perfect', 'amazing', 'happy', 'wonderful', 'beautiful', 'thanks', 'thank you', 'glad', 'best', 'super', 'nice', 'helpful', 'fantastic', 'cool', 'brilliant', 'outstanding'],
    negative: ['hate', 'bad', 'terrible', 'stupid', 'ugly', 'worst', 'awful', 'annoying', 'angry', 'sad', 'useless', 'garbage', 'trash', 'loser', 'jerk', 'fool', 'pathetic', 'clown', 'dislike', 'disappointed', 'poor', 'hate you']
  },
  spa: { // Spanish
    positive: ['amar', 'gustar', 'bien', 'bueno', 'excelente', 'increible', 'increíble', 'perfecto', 'maravilloso', 'hermoso', 'gracias', 'feliz', 'mejor', 'super', 'lindo', 'fantastico', 'fantástico', 'genial', 'estupendo', 'bonito'],
    negative: ['odiar', 'malo', 'terrible', 'estupido', 'estúpido', 'feo', 'peor', 'basura', 'inutil', 'inútil', 'payaso', 'decepcionado', 'triste', 'odioso', 'desagradable', 'asco', 'asco de', 'fatal', 'horrible']
  },
  fra: { // French
    positive: ['aimer', 'bien', 'bon', 'excellent', 'super', 'parfait', 'incroyable', 'merveilleux', 'beau', 'belle', 'merci', 'heureux', 'meilleur', 'gentil', 'sympa', 'magnifique', 'genial', 'génial', 'formidable'],
    negative: ['détester', 'detester', 'mauvais', 'terrible', 'stupide', 'moche', 'pire', 'ordure', 'inutile', 'bouffon', 'déçu', 'triste', 'horrible', 'affreux', 'nul', 'naze', 'dégoûtant', 'colere', 'colère']
  },
  deu: { // German
    positive: ['lieben', 'gut', 'toll', 'ausgezeichnet', 'super', 'perfekt', 'unglaublich', 'wunderbar', 'schön', 'danke', 'glücklich', 'beste', 'nett', 'wunderbar', 'genial', 'klasse', 'großartig', 'freude'],
    negative: ['hassen', 'schlecht', 'schrecklich', 'dumm', 'hässlich', 'schlimmste', 'müll', 'nutzlos', 'clown', 'enttäuscht', 'traurig', 'ärgerlich', 'furchtbar', 'mies', 'wertlos', 'doof', 'ätzend']
  },
  hin: { // Hindi (transliterated & devanagari)
    positive: ['pyar', 'achha', 'badhiya', 'sundar', 'shandar', 'dhanyawad', 'khush', 'sabse achha', 'shubh', 'swagat', 'dhanyavad', 'shukriya', 'मस्त', 'अच्छा', 'बढ़िया', 'सुंदर', 'धन्यवाद', 'खुश'],
    negative: ['nafrat', 'bura', 'kharab', 'bakwas', 'badsoorat', 'kachra', 'nikamma', 'fattu', 'namard', 'niraash', 'dukhi', 'घृणा', 'बुरा', 'खराब', 'बकवास', 'बदसूरत', 'कचरा', 'निराश', 'दुखी']
  },
  ara: { // Arabic (transliterated & arabic script)
    positive: ['حب', 'جيد', 'ممتاز', 'رائع', 'جميل', 'شكرا', 'سعيد', 'أفضل', 'لطيف', 'رائع', 'مذهل', 'عظيم', 'hubb', 'jayyid', 'mumtaz', 'raia', 'jameel', 'shukran', 'said', 'afdal'],
    negative: ['كره', 'سيء', 'فظيع', 'غبي', 'قبيح', 'أسوأ', 'خيبة', 'حزين', 'غاضب', 'فاشل', 'حقير', 'kurh', 'sayyi', 'fazeed', 'ghabi', 'qabih', 'aswa', 'hazeen', 'ghadib', 'fashil'],
  },
  rus: { // Russian
    positive: ['любить', 'хорошо', 'отлично', 'супер', 'прекрасно', 'идеально', 'круто', 'красиво', 'спасибо', 'рад', 'лучший', 'приятно', 'замечательно', 'восхитительно', 'класс'],
    negative: ['ненавидеть', 'плохо', 'ужасно', 'тупой', 'уродливый', 'худший', 'мусор', 'бесполезный', 'грустный', 'разочарован', 'зло', 'дерьмо', 'отстой', 'кошмар', 'тупо']
  },
  por: { // Portuguese
    positive: ['amar', 'gostar', 'bem', 'bom', 'excelente', 'incrível', 'perfeito', 'maravilhoso', 'lindo', 'obrigado', 'feliz', 'melhor', 'legal', 'fantástico', 'bonito', 'ótimo', 'otimo', 'bela'],
    negative: ['odiar', 'ruim', 'mau', 'terrível', 'estúpido', 'feio', 'pior', 'lixo', 'inútil', 'palhaço', 'decepcionado', 'triste', 'odioso', 'horrível', 'chato', 'péssimo', 'pessimo']
  }
};

export const analyzeSentiment = (text, langCode = 'eng', toxicityScore = 0.0) => {
  const normalizedText = text.toLowerCase();
  const lexicon = SENTIMENT_LEXICON[langCode] || SENTIMENT_LEXICON.eng;

  let positiveMatches = 0;
  let negativeMatches = 0;
  const matchedPositives = [];
  const matchedNegatives = [];

  // 1. Scan for positive matches
  lexicon.positive.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) {
      positiveMatches += matches.length;
      matchedPositives.push(word);
    }
  });

  // 2. Scan for negative matches
  lexicon.negative.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) {
      negativeMatches += matches.length;
      matchedNegatives.push(word);
    }
  });

  // 3. Compute continuous valence score (-1.0 to 1.0)
  let rawScore = 0.0;
  const totalMatches = positiveMatches + negativeMatches;

  if (totalMatches > 0) {
    rawScore = (positiveMatches - negativeMatches) / totalMatches;
  } else {
    // Look for common valence expressions if no direct dictionary matches
    const positiveGeneral = normalizedText.match(/(good|nice|happy|glad|love|cool|wow|great|super|yes)/gi);
    const negativeGeneral = normalizedText.match(/(bad|no|sad|hate|ugly|unhappy|fail|worst|mad|nope)/gi);
    
    const posGenCount = positiveGeneral ? positiveGeneral.length : 0;
    const negGenCount = negativeGeneral ? negativeGeneral.length : 0;
    const genTotal = posGenCount + negGenCount;
    if (genTotal > 0) {
      rawScore = (posGenCount - negGenCount) / genTotal;
    }
  }

  // 4. Cross-Toxicity Semantic Correction (Penalty)
  // If the comment is highly toxic (e.g., toxicityScore > 0.45), we force a severe penalty.
  // This prevents comments like "I love watching you get hurt you stupid idiot" from having positive sentiment.
  let score = rawScore;
  if (toxicityScore > 0.45) {
    const penalty = toxicityScore * 0.8;
    score = Math.max(-1.0, score - penalty);
  }

  // 5. Establish categorical labels
  let label = 'neutral';
  if (score > 0.15) {
    label = 'positive';
  } else if (score < -0.15) {
    label = 'negative';
  }

  // Round to 4 decimal places
  score = parseFloat(score.toFixed(4));

  return {
    score, // -1.0 (Highly Negative) to +1.0 (Highly Positive)
    label, // 'positive' | 'neutral' | 'negative'
    details: {
      positiveMatches,
      negativeMatches,
      matchedPositives,
      matchedNegatives,
      rawScore
    }
  };
};
