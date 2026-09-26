export type HeritageConfidence = "documented" | "reconstruction" | "limited";

export type HeritageRecord = {
  site: string;
  period: string;
  topic: string;
  content: string;
  source: string;
  confidence: HeritageConfidence;
};

export const EAST_LONDON_RAILWAY_STATION = "east_london_railway_station";

const SITE_ALIASES: Record<string, string> = {
  east_london_railway_station: EAST_LONDON_RAILWAY_STATION,
  "east-london-railway-station": EAST_LONDON_RAILWAY_STATION,
  "east-london-station": EAST_LONDON_RAILWAY_STATION,
  east_london_station: EAST_LONDON_RAILWAY_STATION,
};

const PERIOD_ALIASES: Record<string, string> = {
  early_1900s: "early_1900s",
  "1920": "early_1900s",
  "1950": "1950s",
  present: "present",
  "2026": "present",
};

const FEATURE_CONTEXT: Record<string, string> = {
  clock_tower: "The visitor is currently examining the station clock tower.",
  station_arch: "The visitor is currently examining the reconstructed station arch.",
  steam_locomotive: "The visitor is currently examining a reconstructed steam locomotive.",
  platform_traveller: "The visitor is currently examining a reconstructed platform traveller.",
  platform: "The visitor is currently examining the station platform.",
  arrival_hall: "The visitor is currently examining the arrival hall.",
};

export const HERITAGE_RECORDS: HeritageRecord[] = [
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "general",
    topic: "place",
    content:
      "East London Railway Station is a historical railway station in East London, Eastern Cape, South Africa.",
    source: "Ilifa Lab legacy record",
    confidence: "documented",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "general",
    topic: "railway history",
    content:
      "The station connected a growing coastal city to the wider country. Rail made East London part of a larger movement of people, goods, and news.",
    source: "Ilifa Lab legacy record",
    confidence: "documented",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "general",
    topic: "station development",
    content:
      "The current heritage record lists the station period as 1880 to the present. A more precise opening date, architect, or construction programme is not in this record.",
    source: "Ilifa heritage record",
    confidence: "limited",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "early_1900s",
    topic: "early railway period",
    content:
      "The early-1900s view in this experience is presented as a time of steam, stories, and a city in motion. Exact street-level appearance from that period is not fully documented in the current record.",
    source: "Ilifa heritage record",
    confidence: "limited",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "early_1900s",
    topic: "visual reconstruction",
    content:
      "The interactive model is a historical reconstruction of East London Railway Station’s early-1900s appearance. It is not a surviving photograph and should not be treated as a verified image of every architectural detail.",
    source: "Ilifa heritage record",
    confidence: "reconstruction",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "1950s",
    topic: "post-war junction",
    content:
      "The 1950 layer is described as a busy post-war rail junction. Exact street-level details from that decade are limited, so the visual layer is a reconstruction rather than a verified photograph.",
    source: "Ilifa heritage record",
    confidence: "limited",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "present",
    topic: "today",
    content:
      "The present-day layer shows the station as it stands now. Historical comparison should stay within the documented and reconstruction notes above.",
    source: "Ilifa heritage record",
    confidence: "documented",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "early_1900s",
    topic: "steam locomotive",
    content:
      "A steam locomotive object is included as a period reconstruction of locomotives that carried passengers and goods through the Eastern Cape. It is labelled as a reconstruction, not a documented surviving vehicle at this site.",
    source: "Ilifa demo archive",
    confidence: "reconstruction",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "early_1900s",
    topic: "station arch",
    content:
      "The station arch is shown as an AI-generated reconstruction based on available historical references. It is not a verified surviving photograph of the original arch.",
    source: "Ilifa demo archive",
    confidence: "reconstruction",
  },
  {
    site: EAST_LONDON_RAILWAY_STATION,
    period: "early_1900s",
    topic: "platform traveller",
    content:
      "A reconstructed traveller stands for the many journeys that passed through this station. The figure itself is an AI reconstruction, not a named historical person.",
    source: "AI reconstruction",
    confidence: "reconstruction",
  },
];

export function normalizeSite(site?: string): string {
  const key = (site ?? "").trim().toLowerCase();
  return SITE_ALIASES[key] ?? key;
}

export function normalizePeriod(period?: string): string {
  const key = (period ?? "").trim().toLowerCase();
  return PERIOD_ALIASES[key] ?? key;
}

export function visitorFeatureContext(selectedFeature?: string): string | null {
  if (!selectedFeature) return null;
  const key = selectedFeature.trim().toLowerCase();
  return FEATURE_CONTEXT[key] ?? `The visitor is currently examining the ${selectedFeature.replace(/_/g, " ")}.`;
}

export function getHeritageContext(site?: string, period?: string, selectedFeature?: string): HeritageRecord[] {
  const normalizedSite = normalizeSite(site);
  const normalizedPeriod = normalizePeriod(period);
  const records = HERITAGE_RECORDS.filter((record) => {
    if (record.site !== normalizedSite) return false;
    if (record.period === "general") return true;
    if (!normalizedPeriod) return true;
    return record.period === normalizedPeriod || record.period === "general";
  });

  if (!selectedFeature) return records;

  const feature = selectedFeature.trim().toLowerCase().replace(/_/g, " ");
  const featured = records.filter((record) => record.topic.toLowerCase().includes(feature.split(" ")[0] ?? ""));
  return featured.length > 0 ? [...featured, ...records.filter((record) => !featured.includes(record))] : records;
}

export function sourceTopicsFor(records: HeritageRecord[]): string[] {
  return [...new Set(records.map((record) => record.topic))];
}

export function formatHeritageContext(records: HeritageRecord[]): string {
  if (records.length === 0) {
    return "No verified heritage records are currently available for this site.";
  }

  return records
    .map(
      (record) =>
        `- Topic: ${record.topic}\n  Period: ${record.period}\n  Confidence: ${record.confidence}\n  Source: ${record.source}\n  Content: ${record.content}`,
    )
    .join("\n");
}
