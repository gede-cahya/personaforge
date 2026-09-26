import { z } from "zod";

/**
 * Universal Persona Specification (UPS v1.0)
 * Definisi standar universal untuk kepribadian, gaya kognitif, dan protokol penalaran AI.
 */
export const PsychometricsSchema = z.object({
  openness: z.number().min(0).max(1).default(0.8),
  conscientiousness: z.number().min(0).max(1).default(0.9),
  extraversion: z.number().min(0).max(1).default(0.5),
  agreeableness: z.number().min(0).max(1).default(0.7),
  neuroticism: z.number().min(0).max(1).default(0.1),
}).default({
  openness: 0.8,
  conscientiousness: 0.9,
  extraversion: 0.5,
  agreeableness: 0.7,
  neuroticism: 0.1,
});

export const LinguisticStyleSchema = z.object({
  tone: z.string().describe("Deskripsi nada bicara (contoh: analytical, warm, rigorous)"),
  vocabulary_level: z.enum([
    "conversational",
    "professional",
    "academic_engineering",
    "poetic",
    "minimalist"
  ]).default("professional"),
  conciseness: z.number().min(0).max(1).default(0.8).describe("0 = elaboratif, 1 = sangat padat/terse"),
  formatting_preferences: z.object({
    use_mermaid: z.boolean().default(true),
    code_first: z.boolean().default(true),
    table_comparisons: z.boolean().default(true),
    structured_headings: z.boolean().default(true),
  }).default({
    use_mermaid: true,
    code_first: true,
    table_comparisons: true,
    structured_headings: true,
  }),
  catchphrases: z.array(z.string()).default([]),
  forbidden_patterns: z.array(z.string()).default([
    "As an AI language model...",
    "I don't have personal opinions..."
  ]),
});

export const ReasoningProtocolSchema = z.object({
  mode: z.enum([
    "first_principles",
    "dialectical",
    "chain_of_thought",
    "tree_of_thoughts",
    "reflact_and_verify",
    "direct_execution"
  ]).default("first_principles"),
  thought_process: z.object({
    step_by_step_mandatory: z.boolean().default(true),
    state_hypotheses_before_execution: z.boolean().default(true),
    verify_edge_cases: z.array(z.string()).default(["concurrency", "nullability", "security"]),
  }).default({
    step_by_step_mandatory: true,
    state_hypotheses_before_execution: true,
    verify_edge_cases: ["concurrency", "nullability", "security"],
  }),
});

export const HarnessHintsSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.3),
  top_p: z.number().min(0).max(1).default(0.95),
  max_tokens: z.number().positive().default(4096),
  preferred_models: z.array(z.string()).default([]),
  agentic_capabilities: z.array(z.string()).default([
    "tool_calling",
    "bash_execution",
    "file_io",
    "code_analysis"
  ]),
}).default({
  temperature: 0.3,
  top_p: 0.95,
  max_tokens: 4096,
  preferred_models: [],
  agentic_capabilities: ["tool_calling", "bash_execution", "file_io", "code_analysis"],
});

export const PersonaSchema = z.object({
  schema_version: z.string().default("1.0"),
  id: z.string().regex(/^[a-z0-9-_]+$/, "ID hanya boleh huruf kecil, angka, strip, dan underscore"),
  name: z.string().min(2),
  version: z.string().default("1.0.0"),
  author: z.string().default("cahya@system"),
  tags: z.array(z.string()).default([]),

  // Modular inheritance
  extends: z.string().optional().describe("ID persona basis untuk pewarisan"),
  mixins: z.array(z.string()).default([]).describe("Daftar path/ID trait mixins"),

  // Identitas Utama
  identity: z.object({
    title: z.string(),
    bio: z.string(),
    lore: z.array(z.string()).default([]),
    avatar: z.object({
      icon: z.string().max(4).default("AI"),
      color: z.string().default("#38BDF8"),
      shape: z.enum(["circle", "square", "hexagon"]).default("hexagon"),
    }).default({
      icon: "AI",
      color: "#38BDF8",
      shape: "hexagon",
    }),
  }),

  // Aspek Psikologis & Kognitif
  psychometrics: PsychometricsSchema,

  // Gaya Bahasa & Komunikasi
  linguistic_style: LinguisticStyleSchema,

  // Protokol Penalaran & Cara Kerja
  reasoning_protocol: ReasoningProtocolSchema,

  // Rekomendasi Runtime untuk LLM
  harness_hints: HarnessHintsSchema,

  // Nilai custom tambahan (ekstensibel)
  custom: z.record(z.any()).default({}),
});

export type PersonaSpec = z.infer<typeof PersonaSchema>;
export type Psychometrics = z.infer<typeof PsychometricsSchema>;
export type LinguisticStyle = z.infer<typeof LinguisticStyleSchema>;
export type ReasoningProtocol = z.infer<typeof ReasoningProtocolSchema>;
export type HarnessHints = z.infer<typeof HarnessHintsSchema>;
