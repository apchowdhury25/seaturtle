export const EVIDENCE_LEVELS = [
  "verified_third_party",
  "supplier_reported",
  "internal_measurement",
  "estimated",
  "planned",
  "unavailable",
] as const;

export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

const UNSUPPORTED_CLAIM =
  /100\s*%\s*sustainable|fully sustainable|zero[-\s]?impact|carbon[-\s]?neutral|climate[-\s]?neutral|ocean[-\s]?safe|guilt[-\s]?free|net[-\s]?zero(?!\s+goal)/i;

export function evidenceLabel(level: EvidenceLevel): string {
  switch (level) {
    case "verified_third_party":
      return "Verified third-party record";
    case "supplier_reported":
      return "Supplier-reported";
    case "internal_measurement":
      return "Internal measurement";
    case "estimated":
      return "Estimate";
    case "planned":
      return "Planned, not yet achieved";
    default:
      return "Not yet available";
  }
}

export function findUnsupportedClaims(text: string): string[] {
  const found = text.match(new RegExp(UNSUPPORTED_CLAIM, "gi")) ?? [];
  return [...new Set(found.map((item) => item.trim()))];
}

export type TraceStage = {
  stage: string;
  summary: string;
  evidenceLevel: EvidenceLevel;
  locationPublic?: string | null;
  materialPublic?: string | null;
  occurredOn?: string | null;
};

const PRIVATE_KEYS = new Set([
  "contact_email",
  "email",
  "phone",
  "price",
  "cost",
  "unit_cost",
  "address_private",
  "legal_name",
  "bank",
  "notes_internal",
]);

export function toPublicTrace(stages: unknown): TraceStage[] {
  if (!Array.isArray(stages)) return [];
  return stages.flatMap((stage) => {
    if (!stage || typeof stage !== "object") return [];
    const record = stage as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (PRIVATE_KEYS.has(key)) return [];
    }
    const level = EVIDENCE_LEVELS.includes(record.evidenceLevel as EvidenceLevel)
      ? (record.evidenceLevel as EvidenceLevel)
      : "unavailable";
    return [
      {
        stage: String(record.stage ?? "Stage"),
        summary: String(record.summary ?? "Information has not been published for this stage."),
        evidenceLevel: level,
        locationPublic: record.locationPublic ? String(record.locationPublic) : null,
        materialPublic: record.materialPublic ? String(record.materialPublic) : null,
        occurredOn: record.occurredOn ? String(record.occurredOn) : null,
      },
    ];
  });
}

export const TRACE_STAGES = [
  "Raw material",
  "Fiber and fabric processing",
  "Dyeing and finishing",
  "Garment manufacturing",
  "Quality inspection",
  "Packaging",
  "Shipment",
] as const;
