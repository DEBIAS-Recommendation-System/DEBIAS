export function slugify(text: string): string {
  const arabicMap: Record<string, string> = {
    ا: "a", أ: "a", إ: "i", آ: "a",
    ب: "b",
    ت: "t",
    ث: "th",
    ج: "j",
    ح: "h",
    خ: "kh",
    د: "d",
    ذ: "dh",
    ر: "r",
    ز: "z",
    س: "s",
    ش: "sh",
    ص: "s",
    ض: "d",
    ط: "t",
    ظ: "z",
    ع: "3",  
    غ: "gh",
    ف: "f",
    ق: "9",  
    ك: "k",
    ل: "l",
    م: "m",
    ن: "n",
    ه: "h",
    و: "w",
    ي: "y",
    ة: "a",
    ى: "a",
    ء: "a",
  };

  return text
    .split("")
    .map(char => arabicMap[char] || char) // transliterate Arabic if exists
    .join("")
    .normalize("NFD")                         // split accents
    .replace(/[\u0300-\u036f]/g, "")         // remove accents
    .replace(/[^a-zA-Z0-9\s-]/g, "")         // keep only latin + numbers
    .trim()
    .replace(/\s+/g, "-")                     // spaces → dashes
    .replace(/-+/g, "-")                      // collapse multiple dashes
    .toLowerCase();
}
