export const COUNTRY_TO_ISO: Record<string, string> = {
  India: "IN",
  "United States": "US",
  "United Kingdom": "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  Spain: "ES",
  Brazil: "BR",
  France: "FR",
  Italy: "IT",
  Japan: "JP",
  "South Korea": "KR",
  Mexico: "MX",
  "United Arab Emirates": "AE",
  Singapore: "SG",
  Argentina: "AR",
  Portugal: "PT",
  Indonesia: "ID",
};

export const LANGUAGE_TO_ISO: Record<string, string> = {
  Arabic: "ar",
  English: "en",
  French: "fr",
  German: "de",
  Hindi: "hi",
  Japanese: "ja",
  Korean: "ko",
  Portuguese: "pt",
  Spanish: "es",
};

export const REGIONAL_DISCOVERY_PROFILES: Record<
  string,
  { languageIso: string | null; browseTopics: string[]; emergingTopics: string[] }
> = {
  BR: {
    languageIso: "pt",
    browseTopics: ["brasil youtubers", "canal brasil vlog jogos musica", "criadores de conteudo brasil"],
    emergingTopics: ["canal brasil podcast", "vlog diario brasil", "gameplay brasil"],
  },
  PT: {
    languageIso: "pt",
    browseTopics: ["portugal youtubers", "canal portugal vlog"],
    emergingTopics: ["portugal podcast", "vlog portugal"],
  },
  IN: {
    languageIso: "hi",
    browseTopics: ["indian creators vlog tech", "hindi gaming comedy channel"],
    emergingTopics: ["hindi podcast review", "indian vlog channel"],
  },
  ES: {
    languageIso: "es",
    browseTopics: ["espana youtubers", "creadores contenido espana"],
    emergingTopics: ["podcast espana", "vlog espana"],
  },
  MX: {
    languageIso: "es",
    browseTopics: ["mexico youtubers", "creadores mexico vlog"],
    emergingTopics: ["podcast mexico", "vlog mexico"],
  },
  AR: {
    languageIso: "es",
    browseTopics: ["argentina youtubers", "creadores argentina"],
    emergingTopics: ["podcast argentina", "vlog argentina"],
  },
  DE: {
    languageIso: "de",
    browseTopics: ["deutschland youtube", "deutsche creator vlog gaming"],
    emergingTopics: ["deutsch podcast", "vlog deutsch"],
  },
  FR: {
    languageIso: "fr",
    browseTopics: ["france youtubeurs", "createurs france vlog"],
    emergingTopics: ["podcast france", "vlog france"],
  },
  JP: {
    languageIso: "ja",
    browseTopics: ["日本 ユーチューバー チャンネル", "japan youtube creators"],
    emergingTopics: ["日本 ポッドキャスト", "日本 ゲーム実況"],
  },
  KR: {
    languageIso: "ko",
    browseTopics: ["한국 유튜버 채널", "korea youtube creators"],
    emergingTopics: ["한국 브이로그", "한국 게임 채널"],
  },
  ID: {
    languageIso: null,
    browseTopics: ["indonesia youtubers", "kreator indonesia vlog"],
    emergingTopics: ["podcast indonesia", "vlog indonesia"],
  },
};

const ISO_TO_LANGUAGE: Record<string, string> = {
  ar: "Arabic",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
};

export function resolveCountryToIso(countryName?: string | null): string | null {
  if (!countryName) return null;
  const trimmed = countryName.trim();
  if (COUNTRY_TO_ISO[trimmed]) return COUNTRY_TO_ISO[trimmed];
  const lower = trimmed.toLowerCase();
  if (lower === "brasil" || lower === "brazilian" || lower === "brasilia") return "BR";
  if (lower === "usa" || lower === "america" || lower === "united states of america") return "US";
  if (lower === "uk" || lower === "england" || lower === "britain") return "GB";
  if (lower === "espana" || lower === "españa") return "ES";
  if (lower === "deutschland") return "DE";
  if (lower === "nippon" || lower === "nihon") return "JP";
  if (lower === "korea") return "KR";
  for (const [name, iso] of Object.entries(COUNTRY_TO_ISO)) {
    if (name.toLowerCase() === lower || iso.toLowerCase() === lower) {
      return iso;
    }
  }
  return null;
}

export function resolveLanguageToIso(languageName?: string | null): string | null {
  if (!languageName || languageName === "All languages") return null;
  const trimmed = languageName.trim();
  if (LANGUAGE_TO_ISO[trimmed]) return LANGUAGE_TO_ISO[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [name, iso] of Object.entries(LANGUAGE_TO_ISO)) {
    if (name.toLowerCase() === lower || iso === lower) {
      return iso;
    }
  }
  return null;
}

/**
 * Extracts normalized creator primary language from official platform language tags
 * (`defaultAudioLanguage` / `defaultLanguage`) and Unicode script cues (never forces unknown to English).
 */
export function detectCreatorLanguage(
  langCode?: string | null,
  title?: string | null,
  description?: string | null,
): string | null {
  if (langCode && langCode.trim()) {
    const primarySubtag = langCode.trim().toLowerCase().split(/[-_]/)[0];
    if (ISO_TO_LANGUAGE[primarySubtag]) {
      return ISO_TO_LANGUAGE[primarySubtag];
    }
  }

  const combined = `${title || ""} ${description || ""}`;
  if (/[\u0900-\u097F]/.test(combined)) return "Hindi";
  if (/[\u0600-\u06FF]/.test(combined)) return "Arabic";
  if (/[\uAC00-\uD7AF]/.test(combined)) return "Korean";
  if (/[\u3040-\u30FF]/.test(combined)) return "Japanese";

  const lower = combined.toLowerCase();
  if (/\bhindi\b|\bdesi\b|\bbollywood\b|\bshayari\b/.test(lower)) return "Hindi";
  if (/\bespa[nñ]ol\b|\bspanish\b/.test(lower)) return "Spanish";
  if (/\bportugu[eê]s\b|\bbrasil\b/.test(lower)) return "Portuguese";
  if (/\bfran[cç]ais\b/.test(lower)) return "French";
  if (/\bdeutsch\b/.test(lower)) return "German";

  // Return English only when text looks clearly English/Latin rather than unlabeled empty text
  if (/[a-zA-Z]{4,}/.test(combined)) return "English";
  return null;
}

/**
 * Maps YouTube `topicDetails.topicCategories` Wikipedia URLs and channel copy into our standard taxonomy.
 */
export function extractYouTubeCategory(
  topicCategories?: string[] | null,
  title?: string | null,
  description?: string | null,
): string {
  const topics = (topicCategories || []).join(" ").toLowerCase();
  if (/video_game|gaming|role-playing|action-adventure|first-person_shooter|esports/.test(topics)) {
    return "Gaming";
  }
  if (/technology|software|consumer_electronics|computing|science/.test(topics)) {
    return "Technology";
  }
  if (/music|hip_hop|pop_music|rock_music|electronic_music|singing/.test(topics)) {
    return "Music";
  }
  if (/sport|football|basketball|cricket|athletics|fitness/.test(topics)) {
    return "Sports";
  }
  if (/comedy|humour|satire/.test(topics)) {
    return "Comedy";
  }
  if (/business|finance|investing|economics/.test(topics)) {
    return "Finance";
  }
  if (/knowledge|education|university|school/.test(topics)) {
    return "Education";
  }
  if (/news|politics|society|journalism/.test(topics)) {
    return "News & Politics";
  }
  if (/lifestyle|fashion|beauty|food|travel|fitness|vlog/.test(topics)) {
    return "Lifestyle";
  }

  const text = `${title || ""} ${description || ""}`.toLowerCase();
  if (/\bgaming\b|\besports\b|\bminecraft\b|\bvalorant\b|\bfortnite\b|\bgta\b/.test(text)) return "Gaming";
  if (/\btech\b|\breview\b|\bgadget\b|\bprogramming\b|\bcoding\b|\bai\b/.test(text)) return "Technology";
  if (/\bcomedy\b|\bsketch\b|\broast\b|\bfunny\b/.test(text)) return "Comedy";
  if (/\bfinance\b|\binvest\b|\bstock\b|\bcrypto\b/.test(text)) return "Finance";
  if (/\beducation\b|\btutorial\b|\blearn\b/.test(text)) return "Education";
  if (/\bvlog\b|\blifestyle\b|\btravel\b/.test(text)) return "Lifestyle";
  if (/\bmusic\b|\bsong\b|\bpodcast\b/.test(text)) return "Entertainment";

  return "Entertainment";
}
