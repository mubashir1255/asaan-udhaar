export interface DailyQuote {
  ar: string;
  en: string;
  ur: string;
  reference: string;
}

export const QURANIC_QUOTES: DailyQuote[] = [
  {
    ar: "وَأَوْفُوا الْكَيْلَ وَالْمِيزَانَ بِالْقِسْطِ",
    en: "Give full measure and weight with justice.",
    ur: "اور ناپ اور تول انصاف کے ساتھ پورا پورا کرو۔",
    reference: "Al-An'am 6:152",
  },
  {
    ar: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    en: "If you are grateful, I will surely increase you in favor.",
    ur: "اگر تم شکر ادا کرو گے تو میں تمہیں اور زیادہ دوں گا۔",
    reference: "Ibrahim 14:7",
  },
  {
    ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    en: "And whoever relies upon Allah — He is sufficient for him.",
    ur: "اور جو اللہ پر بھروسہ کرتا ہے تو وہ اس کے لیے کافی ہے۔",
    reference: "At-Talaq 65:3",
  },
  {
    ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    en: "Indeed, with hardship comes ease.",
    ur: "بے شک تنگی کے ساتھ آسانی ہے۔",
    reference: "Ash-Sharh 94:6",
  },
  {
    ar: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    en: "And He will provide for him from where he does not expect.",
    ur: "اور اسے ایسی جگہ سے رزق دے گا جہاں سے اس کا گمان بھی نہ ہو۔",
    reference: "At-Talaq 65:3",
  },
  {
    ar: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي",
    en: "Remember Me; I will remember you. And be grateful to Me.",
    ur: "سو تم مجھے یاد رکھو، میں تمہیں یاد رکھوں گا، اور میرا شکر ادا کرو۔",
    reference: "Al-Baqarah 2:152",
  },
];

export function getTodayQuote(): DailyQuote {
  // Selects a stable quote based on the day of the year so it changes every morning
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return QURANIC_QUOTES[dayOfYear % QURANIC_QUOTES.length];
}