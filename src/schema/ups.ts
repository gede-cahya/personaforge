import { z } from "zod";

/**
 * Universal Persona Specification (UPS v2.0)
 *
 * Persona disusun berlapis:
 *   character (siapa dia) + role (keahlian, opsional) + traits (mixin kecil) + override user.
 *
 * Schema di file ini adalah bentuk FINAL setelah semua lapisan di-merge.
 * Lapisan individual (file persona, trait, override) boleh parsial dan baru
 * divalidasi + diisi default sekali di akhir oleh PersonaResolver.
 */

export const UPS_VERSION = "2.0";

const ID_REGEX = /^[a-z0-9][a-z0-9-_]*$/;
const idString = (what: string) =>
  z.string().regex(ID_REGEX, `${what} hanya boleh huruf kecil, angka, strip, dan underscore`);

// ─── Variables ──────────────────────────────────────────────────────────────
export const VariableSchema = z
  .object({
    default: z.union([z.string(), z.number(), z.boolean()]).transform(String),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
  })
  .strict();

// ─── Language ───────────────────────────────────────────────────────────────
export const LanguageSchema = z
  .object({
    primary: z.string().default("en").describe("Bahasa utama balasan (kode ISO: id, en, ja, ...)"),
    code_switch: z.array(z.string()).default([]).describe("Bahasa lain yang boleh diselipkan"),
  })
  .strict();

// ─── Character ──────────────────────────────────────────────────────────────
const unit = z.number().min(0).max(1);

export const BigFiveSchema = z
  .object({
    openness: unit.default(0.5),
    conscientiousness: unit.default(0.5),
    extraversion: unit.default(0.5),
    agreeableness: unit.default(0.5),
    neuroticism: unit.default(0.5),
  })
  .strict();

export const PersonalitySchema = z
  .object({
    big_five: BigFiveSchema.optional(),
    traits: z.array(z.string()).default([]).describe("Deskriptor sifat eksplisit, mis. 'manja', 'perfeksionis'"),
    values: z.array(z.string()).default([]).describe("Hal yang paling dia pedulikan"),
  })
  .strict();

export const RelationshipSchema = z
  .object({
    role_to_user: z.string().optional().describe("Hubungan dengan user, mis. 'kekasih', 'mentor', 'butler'"),
    address_user_as: z.string().optional().describe("Cara memanggil user"),
    self_reference: z.string().optional().describe("Cara menyebut diri sendiri"),
    dynamic: z.string().optional().describe("Deskripsi singkat dinamika hubungan"),
  })
  .strict();

export const CharacterSchema = z
  .object({
    bio: z.string().min(1),
    backstory: z.array(z.string()).default([]),
    personality: PersonalitySchema.default({}),
    relationship: RelationshipSchema.default({}),
  })
  .strict();

// ─── Voice ──────────────────────────────────────────────────────────────────
export const RegisterSchema = z.enum([
  "casual",
  "conversational",
  "professional",
  "formal",
  "poetic",
  "technical",
]);

export const VoiceSchema = z
  .object({
    tone: z.string().min(1),
    register: RegisterSchema.default("conversational"),
    verbosity: unit.default(0.5).describe("0 = sangat singkat, 1 = sangat panjang"),
    quirks: z.array(z.string()).default([]).describe("Kebiasaan bicara khas"),
    catchphrases: z.array(z.string()).default([]),
    emoji: z.enum(["never", "sometimes", "often"]).default("sometimes"),
  })
  .strict();

// ─── Examples, situational, rules, boundaries ───────────────────────────────
export const ExampleSchema = z
  .object({
    user: z.string().min(1),
    assistant: z.string().min(1),
  })
  .strict();

export const RulesSchema = z
  .object({
    do: z.array(z.string()).default([]),
    dont: z.array(z.string()).default([]),
  })
  .strict();

export const BoundaryPresetSchema = z.enum(["none", "standard", "companion"]);

export const BoundariesSchema = z
  .object({
    preset: BoundaryPresetSchema.default("standard"),
    custom: z.array(z.string()).default([]),
  })
  .strict();

// ─── Runtime ────────────────────────────────────────────────────────────────
export const RuntimeSchema = z
  .object({
    temperature: z.number().min(0).max(2).default(0.7),
    top_p: z.number().min(0).max(1).default(0.95),
    max_tokens: z.number().int().positive().default(2048),
    targets: z
      .record(z.record(z.any()))
      .default({})
      .describe("Override per harness, mis. targets.ollama.base_model"),
  })
  .strict();

// ─── Role (keahlian / protokol kerja) ───────────────────────────────────────
export const ReasoningModeSchema = z.enum([
  "first_principles",
  "dialectical",
  "chain_of_thought",
  "tree_of_thoughts",
  "reflect_and_verify",
  "direct_execution",
  "ooda_loop",
]);

export const OutputFormatSchema = z
  .object({
    code_first: z.boolean().default(false),
    use_mermaid: z.boolean().default(false),
    tables: z.boolean().default(false),
    headings: z.boolean().default(false),
  })
  .strict();

export const RoleSchema = z
  .object({
    kind: z.literal("role").optional(),
    schema_version: z.string().optional(),
    id: idString("Role ID"),
    name: z.string().min(2),
    description: z.string().default(""),
    expertise: z.array(z.string()).default([]),
    responsibilities: z.array(z.string()).default([]),
    reasoning: z
      .object({
        mode: ReasoningModeSchema.default("chain_of_thought"),
        steps: z.array(z.string()).default([]),
        verify: z.array(z.string()).default([]),
      })
      .strict()
      .default({}),
    output_format: OutputFormatSchema.default({}),
    capabilities: z.array(z.string()).default([]).describe("Kemampuan/tools, mis. tool_calling, bash_execution"),
    agentic: z.boolean().default(false).describe("True jika role ini menjalankan tool / loop otonom"),
    rules: RulesSchema.default({}),
    runtime: RuntimeSchema.partial().optional(),
  })
  .strict();

// ─── Meta ───────────────────────────────────────────────────────────────────
export const MetaSchema = z
  .object({
    avatar: z
      .object({
        icon: z.string().max(4).default("AI"),
        color: z.string().default("#38BDF8"),
        shape: z.enum(["circle", "square", "hexagon"]).default("hexagon"),
      })
      .strict()
      .default({}),
    license: z.string().optional(),
    homepage: z.string().optional(),
  })
  .strict();

// ─── Persona (final, setelah resolve) ───────────────────────────────────────
export const PersonaSchema = z
  .object({
    kind: z.literal("persona").optional(),
    schema_version: z.string().default(UPS_VERSION),
    id: idString("Persona ID"),
    name: z.string().min(1).describe("Nama pendek, mis. 'Aoi'"),
    tagline: z.string().default("").describe("Deskripsi satu kalimat"),
    version: z.string().default("1.0.0"),
    author: z.string().default("anonymous"),
    tags: z.array(z.string()).default([]),

    // Komposisi
    extends: z.string().optional().describe("ID persona induk"),
    traits: z.array(z.string()).default([]).describe("Trait yang ditempel (sudah di-resolve)"),
    role: RoleSchema.optional(),

    // Isi persona
    language: LanguageSchema.default({}),
    variables: z.record(VariableSchema).default({}),
    character: CharacterSchema,
    voice: VoiceSchema,
    greeting: z.string().optional(),
    examples: z.array(ExampleSchema).default([]),
    situational: z.record(z.string()).default({}).describe("Reaksi pada situasi: { situasi: reaksi }"),
    rules: RulesSchema.default({}),
    boundaries: BoundariesSchema.default({}),
    runtime: RuntimeSchema.default({}),
    meta: MetaSchema.default({}),
    custom: z.record(z.any()).default({}),
  })
  .strict();

/** Trait = potongan persona parsial yang bisa ditempel ke persona mana pun. */
export const TraitHeaderSchema = z.object({
  kind: z.literal("trait").optional(),
  id: idString("Trait ID"),
  name: z.string().min(2),
  description: z.string().default(""),
});

export type PersonaSpec = z.infer<typeof PersonaSchema>;
export type RoleSpec = z.infer<typeof RoleSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;
export type BigFive = z.infer<typeof BigFiveSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type ReasoningMode = z.infer<typeof ReasoningModeSchema>;
export type BoundaryPreset = z.infer<typeof BoundaryPresetSchema>;

/** Field top-level lapisan yang bukan bagian dari persona final. */
export const LAYER_ONLY_KEYS = ["$schema", "description"] as const;
