import { pipeline } from '@xenova/transformers';

// Global reference to the ONNX pipeline and active promise
let classifier = null;
let isModelLoading = false;
let isModelLoaded = false;
let modelLoadError = null;
let modelLoadPromise = null;

// Initialize Hugging Face pipeline in the background
export const initializeModel = async () => {
  if (isModelLoaded) return;
  if (isModelLoading) return modelLoadPromise;
  
  isModelLoading = true;
  modelLoadPromise = (async () => {
    console.log('⏳ Loading HuggingFace Toxic-BERT model into memory (via ONNX runtime)...');
    try {
      // We use Xenova/toxic-bert which yields 6 labels: 
      // toxic, severe_toxic, obscene, threat, insult, identity_hate
      classifier = await pipeline('text-classification', 'Xenova/toxic-bert', {
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`📥 Downloading Model File: ${progress.file} - ${Math.round(progress.loaded / 1024 / 1024)}MB / ${Math.round(progress.total / 1024 / 1024)}MB`);
          }
        }
      });
      isModelLoaded = true;
      isModelLoading = false;
      console.log('✅ HuggingFace Toxic-BERT ONNX Model loaded successfully!');
    } catch (error) {
      modelLoadError = error.message;
      isModelLoading = false;
      console.error(`⚠️ Failed to load HuggingFace ONNX model: ${error.message}`);
      console.log('ℹ️ Switched fully to the High-Precision Multilingual Lexical Toxicity Engine.');
    }
  })();

  return modelLoadPromise;
};

// Start initialization in background
initializeModel().catch(() => {});

// Comprehensive multilingual lexical dictionary for fallback and hybridization
const MULTILINGUAL_LEXICON = {
  eng: {
    obscene: ['fuck', 'bitch', 'asshole', 'shit', 'cunt', 'dick', 'pussy', 'bastard', 'whore', 'slut', 'motherfucker', 'cocksucker', 'wanker'],
    insult: ['stupid', 'idiot', 'moron', 'dumb', 'loser', 'jerk', 'fool', 'garbage', 'trash', 'useless', 'hate you', 'ugly', 'pathetic', 'clown'],
    threat: ['kill you', 'murder you', 'destroy you', 'slay you', 'die', 'beat you', 'break your face', 'burn down', 'shoot you', 'strangle'],
    identity_hate: ['nigger', 'faggot', 'retard', 'kike', 'tranny', 'dyke', 'spic', 'chink', 'gay lord', 'terrorist scum', 'gypsy', 'illegal immigrant'],
    severe_toxic: ['kill yourself', 'die in a fire', 'hope you get cancer', 'brutally rape', 'fucking cunt', 'motherfucking piece of shit']
  },
  spa: { // Spanish
    obscene: ['mierda', 'puta', 'puto', 'cabron', 'cabrón', 'coño', 'joder', 'pendejo', 'chingar', 'verga', 'maricon', 'maricón', 'gilipollas'],
    insult: ['estupido', 'estúpido', 'idiota', 'tonto', 'imbecil', 'imbécil', 'basura', 'inutil', 'inútil', 'payaso', 'feo', 'patetico', 'patético'],
    threat: ['te voy a matar', 'muérete', 'muerete', 'te destruiré', 'asesinar', 'te golpearé', 'quemar', 'disparar', 'degollar'],
    identity_hate: ['sudaca', 'machurrio', 'negrata', 'retrasado', 'marica', 'feminazi', 'sudaca de mierda', 'panchito'],
    severe_toxic: ['mátate', 'matate', 'hijo de puta', 'chinga tu madre', 'puto de mierda', 'muérete de cáncer']
  },
  fra: { // French
    obscene: ['merde', 'putain', 'salope', 'connard', 'encule', 'enculé', 'chier', 'bite', 'chatte', 'bordel', 'fils de pute'],
    insult: ['stupide', 'idiot', 'debile', 'débile', 'imbecile', 'imbécile', 'bouffon', 'naze', 'minable', 'gros lard', 'crevard'],
    threat: ['je vais te tuer', 'meurs', 'creve', 'crève', 'je vais t\'égorger', 'frapper', 'bruler', 'tuerie'],
    identity_hate: ['bougnoule', 'pd', 'pede', 'négre', 'negre', 'rebeu de merde', 'tarlouze', 'gogol'],
    severe_toxic: ['va te faire foutre', 'crève sale chienne', 'suicide-toi', 'fils de pute de merde']
  },
  deu: { // German
    obscene: ['scheisse', 'scheiße', 'hure', 'arschloch', 'fotze', 'wichser', 'schlampe', 'ficken', 'pisser', 'kacke'],
    insult: ['dumm', 'idiot', 'blödmann', 'depp', 'versager', 'clown', 'hässlich', 'wertlos', 'bastard', 'sau'],
    threat: ['ich bring dich um', 'stirb', 'töten', 'schlagen', 'umbringen', 'ich mache dich kalt', 'verbrennen'],
    identity_hate: ['nigger', 'schwuchtel', 'kanake', 'spasti', 'behindert', 'scheiss ausländer', 'jude', 'ziegeuner'],
    severe_toxic: ['verpiss dich', 'hurensohn', 'geh sterben', 'ich vergewaltige dich', 'fick deine mutter']
  },
  hin: { // Hindi (transliterated & devanagari)
    obscene: ['chutiya', 'गांड', 'gand', 'bhosdike', 'bhenchod', 'madarchod', 'saala', 'choot', 'laund', 'loda', 'harami', 'kuttiya'],
    insult: ['pagal', 'gadha', 'ullu', 'bewakoof', 'kamina', 'kachra', 'badsoorat', 'nikamma', 'fattu', 'namard'],
    threat: ['jaan se maar dunga', 'maar daalunga', 'khoon kar dunga', 'teri gaand phad dunga', 'tabah kar dunga', 'marr ja'],
    identity_hate: ['hijra', 'kulla', 'chamar', 'mulla', 'bhangi', 'mlechha', 'kaluwa'],
    severe_toxic: ['apne aap ko maar de', 'tere pure khandan ko maar dunga', 'randi ki aulad', 'saale kutte ki maut marega']
  },
  ara: { // Arabic (transliterated & arabic script)
    obscene: ['كس', 'kuss', 'شراميط', 'sharmouta', 'قحبة', 'quhba', 'خرا', 'khara', 'عرص', 'ars', 'سكس', 'زب', 'zibb'],
    insult: ['حمار', 'himar', 'غبي', 'ghabi', 'كلب', 'kalb', 'يافه', 'تافه', 'حقير', 'haqeer', 'فاشل', 'fashil'],
    threat: ['سأقتلك', 'sa-aqtuluk', 'موت', 'moot', 'أذبحك', 'adhbahuk', 'تدمير', 'سأبيدك'],
    identity_hate: ['خنيث', 'khanith', 'شاذ', 'لوطي', 'يهودي', 'ملحد', 'يا كافر', 'زنجي', 'zanji'],
    severe_toxic: ['اللعنة عليك', 'ابن الحرام', 'ابن الكلب', 'انتحر', 'كس اختك', 'يلعن دينك']
  },
  rus: { // Russian
    obscene: ['блять', 'хуй', 'пизда', 'сука', 'гондон', 'ебать', 'мудак', 'уебок', 'уёбок', 'заебал', 'дрочить'],
    insult: ['дурак', 'идиот', 'тупой', 'дебил', 'лох', 'придурок', 'тварь', 'урод', 'говноед', 'чмо', 'ничтожество'],
    threat: ['убью тебя', 'умри', 'зарежу', 'уничтожу', 'пришибу', 'сдохни', 'замочу'],
    identity_hate: ['пидор', 'хач', 'хохол', 'ниггер', 'чурка', 'жид', 'даун', 'пидорас'],
    severe_toxic: ['пошел нахуй', 'пошёл нахуй', 'еб твою мать', 'сдохни от рака', 'убейся об стену']
  },
  por: { // Portuguese
    obscene: ['porra', 'caralho', 'merda', 'puta', 'viado', 'foder', 'cú', 'filho da puta', 'arrombado', 'boceta', 'caralhão'],
    insult: ['estúpido', 'idiota', 'burro', 'imbecil', 'otário', 'lixo', 'fracassado', 'feio', 'palhaço', 'inútil'],
    threat: ['vou te matar', 'morra', 'te destruirei', 'assassinar', 'te espancar', 'queimar'],
    identity_hate: ['bicha', 'preto safado', 'retardado', 'traveco', 'feminazi', 'viadinho'],
    severe_toxic: ['vá se foder', 'se mata', 'filho de uma puta de merda', 'morra de câncer']
  }
};

// Helper to translate/normalize simple common toxic phrases to expand AI coverage
const translateSimpleMock = (text, lang) => {
  if (lang === 'eng') return text;
  
  let processed = text.toLowerCase();
  
  // Lexical mapping translations for key abusive combinations
  const translations = {
    spa: [
      { from: 'hijo de puta', to: 'son of a bitch' },
      { from: 'mátate', to: 'kill yourself' },
      { from: 'matate', to: 'kill yourself' },
      { from: 'te voy a matar', to: 'i will kill you' },
      { from: 'estúpido', to: 'stupid' },
      { from: 'idiota', to: 'idiot' },
      { from: 'mierda', to: 'shit' },
      { from: 'puta', to: 'bitch' }
    ],
    fra: [
      { from: 'fils de pute', to: 'son of a bitch' },
      { from: 'je vais te tuer', to: 'i will kill you' },
      { from: 'suicide-toi', to: 'kill yourself' },
      { from: 'stupide', to: 'stupid' },
      { from: 'connard', to: 'asshole' },
      { from: 'merde', to: 'shit' },
      { from: 'salope', to: 'bitch' }
    ],
    deu: [
      { from: 'hurensohn', to: 'son of a bitch' },
      { from: 'ich bring dich um', to: 'i will kill you' },
      { from: 'geh sterben', to: 'kill yourself' },
      { from: 'dumm', to: 'stupid' },
      { from: 'arschloch', to: 'asshole' },
      { from: 'scheisse', to: 'shit' }
    ]
  };

  if (translations[lang]) {
    translations[lang].forEach(rule => {
      processed = processed.replace(new RegExp(rule.from, 'gi'), rule.to);
    });
  }
  return processed;
};

// Core Lexical Toxicity Classifier
const runLexicalClassifier = (text, langCode) => {
  const normalizedText = text.toLowerCase();
  const lexicon = MULTILINGUAL_LEXICON[langCode] || MULTILINGUAL_LEXICON.eng;
  
  const scores = {
    toxic: 0.0,
    severe_toxic: 0.0,
    obscene: 0.0,
    threat: 0.0,
    insult: 0.0,
    identity_hate: 0.0
  };

  // 1. Obscene check
  let obsceneCount = 0;
  lexicon.obscene.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b|${w}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) obsceneCount += matches.length;
  });
  scores.obscene = Math.min(1.0, obsceneCount * 0.35);

  // 2. Insult check
  let insultCount = 0;
  lexicon.insult.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b|${w}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) insultCount += matches.length;
  });
  scores.insult = Math.min(1.0, insultCount * 0.30);

  // 3. Threat check
  let threatCount = 0;
  lexicon.threat.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b|${w}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) threatCount += matches.length;
  });
  scores.threat = Math.min(1.0, threatCount * 0.45);

  // 4. Identity hate check
  let identityCount = 0;
  lexicon.identity_hate.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b|${w}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) identityCount += matches.length;
  });
  scores.identity_hate = Math.min(1.0, identityCount * 0.50);

  // 5. Severe toxic check
  let severeCount = 0;
  lexicon.severe_toxic.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b|${w}`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) severeCount += matches.length;
  });
  scores.severe_toxic = Math.min(1.0, severeCount * 0.60);

  // Calculate composite 'toxic' base score
  const maxSubScore = Math.max(scores.severe_toxic, scores.obscene, scores.threat, scores.insult, scores.identity_hate);
  const averageSubScore = (scores.severe_toxic + scores.obscene + scores.threat + scores.insult + scores.identity_hate) / 5;
  
  if (maxSubScore > 0) {
    scores.toxic = Math.min(1.0, maxSubScore * 0.8 + averageSubScore * 0.4 + 0.1);
  } else {
    // Check general vocabulary match
    const generalMatches = normalizedText.match(/(bad|hate|ugly|kill|fuck|bitch|shit|crap)/gi);
    if (generalMatches) {
      scores.toxic = Math.min(0.2, generalMatches.length * 0.05);
    }
  }

  // Cap values to 4 decimal places
  Object.keys(scores).forEach(key => {
    scores[key] = parseFloat(scores[key].toFixed(4));
  });

  return scores;
};

// Main Analysis Function
export const analyzeTextToxicity = async (text, langCode = 'eng') => {
  const startTime = Date.now();
  
  // Clean / Preprocess Text
  const cleanedText = text.trim();
  
  // 1. Get Lexical Scores (works in <1ms for any language)
  const lexicalScores = runLexicalClassifier(cleanedText, langCode);

  let finalScores = { ...lexicalScores };
  let method = 'Multilingual Lexical Engine (Fallback)';

  let prediction = null;
  let predictionMethod = null;

  // 2. Try Hugging Face Inference API if HF_TOKEN is configured
  if (process.env.HF_TOKEN) {
    try {
      const translatedText = translateSimpleMock(cleanedText, langCode);
      const response = await fetch(
        'https://api-inference.huggingface.co/models/unitary/toxic-bert',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: translatedText })
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Hugging Face returns [[{label: 'toxic', score: 0.98}, ...]] or [{label: 'toxic', score: 0.98}, ...]
        if (Array.isArray(result)) {
          prediction = Array.isArray(result[0]) ? result[0] : result;
          predictionMethod = 'HuggingFace Inference API';
        }
      } else {
        const errText = await response.text();
        console.warn(`⚠️ Hugging Face Inference API error: ${response.status} - ${errText}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error calling Hugging Face Inference API: ${err.message}`);
    }
  }

  // 3. Fallback to local HuggingFace Toxic-BERT ONNX Model if API was not used or failed
  if (!prediction && isModelLoaded && classifier) {
    try {
      const translatedText = translateSimpleMock(cleanedText, langCode);
      const localResult = await classifier(translatedText);
      if (localResult && Array.isArray(localResult)) {
        prediction = localResult;
        predictionMethod = 'HuggingFace Toxic-BERT ONNX';
      }
    } catch (err) {
      console.warn(`⚠️ Error running inference in local HuggingFace ONNX: ${err.message}`);
    }
  }

  // 4. Process predictions if any AI classifier succeeded
  if (prediction) {
    method = predictionMethod;
    const aiScores = {
      toxic: 0.0,
      severe_toxic: 0.0,
      obscene: 0.0,
      threat: 0.0,
      insult: 0.0,
      identity_hate: 0.0
    };

    prediction.forEach((item) => {
      const label = item.label.toLowerCase();
      const score = item.score;
      // Mapping labels
      if (label === 'toxic' || label === 'LABEL_0') aiScores.toxic = score;
      else if (label === 'severe_toxic' || label === 'LABEL_1') aiScores.severe_toxic = score;
      else if (label === 'obscene' || label === 'LABEL_2') aiScores.obscene = score;
      else if (label === 'threat' || label === 'LABEL_3') aiScores.threat = score;
      else if (label === 'insult' || label === 'LABEL_4') aiScores.insult = score;
      else if (label === 'identity_hate' || label === 'identity_attack' || label === 'LABEL_5') aiScores.identity_hate = score;
    });

    // Hybrid Blend: We merge AI scores with lexical scores for optimal multi-language confidence
    // For English, we heavily weight AI (85% AI, 15% Lexical)
    // For other languages, we weight AI (45% AI - via translated mock, 55% Lexical)
    const aiWeight = langCode === 'eng' ? 0.85 : 0.45;
    const lexWeight = 1.0 - aiWeight;

    Object.keys(finalScores).forEach((key) => {
      finalScores[key] = parseFloat(
        (aiScores[key] * aiWeight + lexicalScores[key] * lexWeight).toFixed(4)
      );
    });
  }

  // Calculate aggregate isToxic and toxicityScore
  // We identify comment as toxic if general toxicity score > 0.45 or if any specific subcategory > 0.50
  const maxSubscore = Math.max(
    finalScores.severe_toxic,
    finalScores.obscene,
    finalScores.threat,
    finalScores.insult,
    finalScores.identity_hate
  );
  
  const toxicityScore = finalScores.toxic;
  const isToxic = toxicityScore > 0.45 || maxSubscore > 0.50;
  
  const durationMs = Date.now() - startTime;

  return {
    isToxic,
    toxicityScore,
    categories: finalScores,
    metadata: {
      method,
      durationMs,
      isModelLoaded,
      isModelLoading,
      modelLoadError
    }
  };
};
