export const COMMON_COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Spain",
  "Brazil",
  "France",
  "Italy",
  "Japan",
  "South Korea",
  "Mexico",
  "United Arab Emirates",
  "Singapore",
  "Argentina",
  "Portugal",
  "Indonesia",
  "Global",
];

export const COUNTRY_CODE_MAP: Record<string, string> = {
  IN: "India",
  US: "United States",
  USA: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  ES: "Spain",
  BR: "Brazil",
  IT: "Italy",
  FR: "France",
  JP: "Japan",
  KR: "South Korea",
  MX: "Mexico",
  AE: "United Arab Emirates",
  NP: "Nepal",
  BD: "Bangladesh",
  PK: "Pakistan",
  PT: "Portugal",
  AR: "Argentina",
  CO: "Colombia",
  IE: "Ireland",
  NZ: "New Zealand",
  SG: "Singapore",
};

export function resolveCountryCode(codeOrName: string | null | undefined): string | null {
  if (!codeOrName) return null;
  const upper = codeOrName.trim().toUpperCase();
  if (COUNTRY_CODE_MAP[upper]) return COUNTRY_CODE_MAP[upper];
  return codeOrName.trim();
}

export function getCountryFlag(countryName: string | null | undefined): string {
  if (!countryName) return "🌐";
  const name = countryName.toLowerCase();
  if (name.includes("india")) return "🇮🇳";
  if (name.includes("united states") || name.includes("usa") || name.includes("america")) return "🇺🇸";
  if (
    name.includes("united kingdom") ||
    name.includes("uk") ||
    name.includes("england") ||
    name.includes("britain")
  )
    return "🇬🇧";
  if (name.includes("canada")) return "🇨🇦";
  if (name.includes("australia")) return "🇦🇺";
  if (name.includes("germany")) return "🇩🇪";
  if (name.includes("spain")) return "🇪🇸";
  if (name.includes("brazil")) return "🇧🇷";
  if (name.includes("italy")) return "🇮🇹";
  if (name.includes("france")) return "🇫🇷";
  if (name.includes("japan")) return "🇯🇵";
  if (name.includes("korea")) return "🇰🇷";
  if (name.includes("argentina")) return "🇦🇷";
  if (name.includes("portugal")) return "🇵🇹";
  if (name.includes("mexico")) return "🇲🇽";
  if (name.includes("emirates") || name.includes("uae") || name.includes("dubai")) return "🇦🇪";
  if (name.includes("nepal")) return "🇳🇵";
  if (name.includes("singapore")) return "🇸🇬";
  return "🌐";
}

export function detectCreatorCountry(handle: string, displayName?: string | null, bio?: string | null): string | null {
  const text = `${handle} ${displayName || ""} ${bio || ""}`.toLowerCase();

  // Known Indian keywords, cities, languages, and creators
  if (
    /india|delhi|mumbai|bangalore|bengaluru|hyderabad|pune|noida|kolkata|chennai|ahmedabad|gurgaon|jaipur|lucknow|patna|chandigarh|surat|indore|bhopal|hindi|punjabi|tamil|telugu|bengali|marathi|gujarati|malayalam|kannada|carryminati|bhuvan|bbkivines|technogamerz|totalgaming|ashish|guruji|dhruv|tanmay|beerbiceps|mortal|scout|triggered|warikoo|sandeep|mythpat|payal|elvish|fukra|bhadana|beniwal|sourav|taneja|kusha|shamani|rachana|flyingbeast|round2hell|pranjal|khansir|zakir|techburner|mostlysane|nitish|lla|labourlaw|samay|dynamo|jonathan|trakin|gyantherapy|ranveerbrar|kabita|villagecooking|drishti|divyakirti|akshat|bassi|dollysingh/i.test(
      text,
    )
  ) {
    return "India";
  }

  if (/canada|toronto|vancouver|montreal|ontario|quebec/i.test(text)) return "Canada";
  if (/uk|united kingdom|london|england|scotland|manchester|birmingham/i.test(text)) return "United Kingdom";
  if (/spain|madrid|barcelona|espanol|españa/i.test(text)) return "Spain";
  if (
    /brazil|brasil|brasileir|rio de janeiro|sao paulo|são paulo|curitiba|belo horizonte|fortaleza|bahia|recife|porto alegre|brasilia|portugues|português|inscreva|galera|futebol|jogos/i.test(
      text,
    )
  ) {
    return "Brazil";
  }
  if (/colombia|bogota|medellin/i.test(text)) return "Colombia";
  if (/portugal|lisbon|porto/i.test(text)) return "Portugal";
  if (/argentina|buenos aires|rosario/i.test(text)) return "Argentina";
  if (/italy|italia|rome|milan|napoli/i.test(text)) return "Italy";
  if (/germany|deutschland|berlin|munich|hamburg/i.test(text)) return "Germany";
  if (/australia|sydney|melbourne|brisbane/i.test(text)) return "Australia";
  if (/united states|america|california|new york|texas|florida|los angeles/i.test(text)) return "United States";

  // Return null when country cannot be inferred cleanly from public metadata
  return null;
}
