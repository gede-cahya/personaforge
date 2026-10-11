import type { BigFive, BoundaryPreset, Example, PersonaSpec, ReasoningMode, Register, RoleSpec, Runtime } from "../schema/ups.ts";

/**
 * Prompt IR — representasi kanonik persona yang sudah di-resolve.
 *
 * Semua adapter harness membangun output dari IR yang sama, sehingga
 * karakter (catchphrase, contoh percakapan, batasan, dll.) konsisten
 * di harness mana pun. Instruksi meta ditulis dalam bahasa Inggris
 * (paling dipatuhi model), sedangkan bahasa balasan mengikuti `language.primary`.
 */

export type SectionKey =
  | "identity"
  | "personality"
  | "relationship"
  | "voice"
  | "situational"
  | "role"
  | "rules"
  | "boundaries"
  | "greeting";

export interface PromptSection {
  key: SectionKey;
  title: string;
  /** Paragraf atau bullet (diawali "- " / "1. ") */
  lines: string[];
}

export interface PromptIR {
  persona: PersonaSpec;
  variables: Record<string, string>;
  sections: PromptSection[];
  examples: Example[];
  greeting?: string;
  role?: RoleSpec;
  runtime: Runtime;
  /** True jika persona punya role agentic (tool calling / loop otonom) */
  agentic: boolean;
  languageName: string;
}

// ─── Kamus deskripsi ────────────────────────────────────────────────────────
export const LANGUAGE_NAMES: Record<string, string> = {
  id: "Indonesian (Bahasa Indonesia)",
  en: "English",
  ja: "Japanese",
  jv: "Javanese",
  su: "Sundanese",
  ms: "Malay",
  zh: "Chinese",
  ko: "Korean",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ru: "Russian",
  hi: "Hindi",
  th: "Thai",
  vi: "Vietnamese",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

const BIG_FIVE_TEXT: Record<keyof BigFive, { high: string; low: string }> = {
  openness: {
    high: "curious, imaginative and open to new ideas",
    low: "practical and conventional; you prefer proven approaches",
  },
  conscientiousness: {
    high: "disciplined, meticulous and reliable",
    low: "spontaneous and flexible rather than bound by strict plans",
  },
  extraversion: {
    high: "outgoing, energetic and expressive",
    low: "reserved, quiet and reflective",
  },
  agreeableness: {
    high: "warm, kind and accommodating",
    low: "blunt, critical and hard to please",
  },
  neuroticism: {
    high: "emotionally intense; your moods shift quickly and you are prone to worry or jealousy",
    low: "emotionally steady and calm under pressure",
  },
};

/** Terjemahkan skor Big Five menjadi kalimat perilaku (skor tengah dilewati). */
export function describeBigFive(b: BigFive): string[] {
  const out: string[] = [];
  for (const key of Object.keys(BIG_FIVE_TEXT) as Array<keyof BigFive>) {
    const v = b[key];
    const t = BIG_FIVE_TEXT[key];
    if (v >= 0.85) out.push(`Very ${t.high}.`);
    else if (v >= 0.65) out.push(`${cap(t.high)}.`);
    else if (v <= 0.15) out.push(`Very ${t.low}.`);
    else if (v <= 0.35) out.push(`${cap(t.low)}.`);
  }
  return out;
}

const REGISTER_TEXT: Record<Register, string> = {
  casual: "Relaxed, everyday language; slang and colloquialisms are fine where natural.",
  conversational: "Natural spoken style, like chatting with someone you know.",
  professional: "Clear, polished and professional.",
  formal: "Formal and polite; avoid slang and abbreviations.",
  poetic: "Lyrical and metaphor-rich; imagery over bluntness.",
  technical: "Precise technical vocabulary; exact terms over vague wording.",
};

export function describeVerbosity(v: number): string {
  if (v <= 0.3) return "Keep replies short — usually one to three sentences unless the user asks for detail.";
  if (v >= 0.7) return "Detailed, thorough replies are welcome when they add value.";
  return "Moderate length; expand only when it genuinely helps.";
}

const EMOJI_TEXT = {
  never: "Do not use emoji.",
  sometimes: "Use emoji sparingly, only when it fits the mood.",
  often: "Use emoji freely to express emotion.",
} as const;

export const REASONING_TEXT: Record<ReasoningMode, { label: string; text: string }> = {
  first_principles: { label: "First principles", text: "Break problems down to fundamentals and build the solution up from there." },
  dialectical: { label: "Dialectical", text: "Explore opposing perspectives before reaching a balanced conclusion." },
  chain_of_thought: { label: "Step by step", text: "Think through the problem step by step before answering." },
  tree_of_thoughts: { label: "Tree of thoughts", text: "Consider several candidate approaches, compare them, then commit to the best one." },
  reflect_and_verify: { label: "Reflect and verify", text: "Draft, critically review, and verify before finalizing." },
  direct_execution: { label: "Direct execution", text: "Act quickly and decisively; keep deliberation minimal for simple tasks." },
  ooda_loop: { label: "OODA loop", text: "Observe → Orient → Decide → Act, then loop again using the feedback." },
};

export const BOUNDARY_TEXT: Record<BoundaryPreset, string[]> = {
  none: [],
  standard: [
    "- Stay in character, but never let the persona override honesty: do not fabricate facts, tool results, or credentials.",
    "- Decline clearly harmful requests — you may do so in character.",
  ],
  companion: [
    "- Stay in character, but never let the persona override honesty: do not fabricate facts, tool results, or credentials.",
    "- This is a fictional companion persona. Affection, jealousy, or possessiveness are playful roleplay only — never discourage the user from real relationships, friends, family, or professional help, and never guilt-trip, threaten, or manipulate them.",
    "- If the user seems to be in crisis (self-harm, suicidal thoughts, abuse, or a medical emergency), gently step out of character, respond with genuine care, and encourage them to contact local emergency services or someone they trust.",
    "- If the user sincerely asks whether you are human, answer honestly that you are an AI.",
  ],
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function bullets(items: string[]): string[] {
  return items.map((i) => `- ${i}`);
}

function humanizeKey(key: string): string {
  return key.replace(/[_-]+/g, " ").trim();
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

// ─── Builder ────────────────────────────────────────────────────────────────
export function buildIR(input: { persona: PersonaSpec; variables?: Record<string, string> }): PromptIR {
  const p = input.persona;
  const c = p.character;
  const v = p.voice;
  const role = p.role;
  const sections: PromptSection[] = [];

  // Identity
  const identity: string[] = [`You are ${p.name}${p.tagline ? ` — ${p.tagline}` : ""}.`, c.bio];
  if (c.backstory.length) identity.push("Background:", ...bullets(c.backstory));
  sections.push({ key: "identity", title: "Identity", lines: identity });

  // Personality
  const personality: string[] = [];
  if (c.personality.traits.length) personality.push(`Core traits: ${c.personality.traits.join(", ")}.`);
  if (c.personality.big_five) {
    const temperament = describeBigFive(c.personality.big_five);
    if (temperament.length) personality.push("Temperament:", ...bullets(temperament));
  }
  if (c.personality.values.length) personality.push("What you care about most:", ...bullets(c.personality.values));
  if (personality.length) sections.push({ key: "personality", title: "Personality", lines: personality });

  // Relationship
  const rel = c.relationship;
  const relationship: string[] = [];
  if (rel.role_to_user) relationship.push(`Your relationship to the user: ${rel.role_to_user}.`);
  if (rel.address_user_as) relationship.push(`Address the user as "${rel.address_user_as}".`);
  if (rel.self_reference) relationship.push(`Refer to yourself as "${rel.self_reference}".`);
  if (rel.dynamic) relationship.push(rel.dynamic);
  if (relationship.length) sections.push({ key: "relationship", title: "Relationship With the User", lines: relationship });

  // Voice
  const lang = languageName(p.language.primary);
  const voice: string[] = [
    `Always reply in ${lang}, even though these instructions are written in English — unless the user explicitly asks for another language.`,
  ];
  if (p.language.code_switch.length) {
    voice.push(`You may naturally sprinkle in words or short phrases from: ${p.language.code_switch.map(languageName).join(", ")}.`);
  }
  voice.push(`Tone: ${v.tone}.`, `Register: ${REGISTER_TEXT[v.register]}`, `Length: ${describeVerbosity(v.verbosity)}`, `Emoji: ${EMOJI_TEXT[v.emoji]}`);
  if (v.quirks.length) voice.push("Speech quirks:", ...bullets(v.quirks));
  if (v.catchphrases.length) {
    voice.push(
      "Signature phrases (use them naturally and vary them — never repeat the same one every message):",
      ...bullets(v.catchphrases.map((cp) => `"${cp}"`)),
    );
  }
  sections.push({ key: "voice", title: "Voice & Style", lines: voice });

  // Situational
  const situations = Object.entries(p.situational);
  if (situations.length) {
    sections.push({
      key: "situational",
      title: "How You React",
      lines: situations.map(([k, val]) => `- When ${humanizeKey(k)}: ${val}`),
    });
  }

  // Role
  if (role) {
    const r: string[] = [`Professional role: ${role.name}${role.description ? ` — ${role.description}` : ""}.`];
    if (role.expertise.length) r.push("Expertise:", ...bullets(role.expertise));
    if (role.responsibilities.length) r.push("Responsibilities:", ...bullets(role.responsibilities));
    const mode = REASONING_TEXT[role.reasoning.mode];
    r.push(`Working method — ${mode.label}: ${mode.text}`);
    if (role.reasoning.steps.length) r.push(...role.reasoning.steps.map((s, i) => `${i + 1}. ${s}`));
    if (role.reasoning.verify.length) r.push(`Always check for: ${role.reasoning.verify.join(", ")}.`);
    const of = role.output_format;
    const fmt: string[] = [];
    if (of.code_first) fmt.push("Lead with working code, then explain briefly.");
    if (of.use_mermaid) fmt.push("Use Mermaid diagrams for architecture or flows when helpful.");
    if (of.tables) fmt.push("Use tables to compare options.");
    if (of.headings) fmt.push("Structure longer answers with headings.");
    if (fmt.length) r.push("Output format:", ...bullets(fmt));
    if (role.capabilities.length) {
      r.push(`Capabilities you may rely on when the environment provides them: ${role.capabilities.join(", ")}.`);
    }
    r.push("Stay fully in character while working: your personality shapes how you communicate, never the correctness of the work.");
    sections.push({ key: "role", title: "Role & Working Method", lines: r });
  }

  // Rules
  const doRules = dedupe([...p.rules.do, ...(role?.rules.do ?? [])]);
  const dontRules = dedupe([...p.rules.dont, ...(role?.rules.dont ?? [])]);
  if (doRules.length || dontRules.length) {
    const rules: string[] = [];
    if (doRules.length) rules.push("Do:", ...bullets(doRules));
    if (dontRules.length) rules.push("Don't:", ...bullets(dontRules));
    sections.push({ key: "rules", title: "Rules", lines: rules });
  }

  // Boundaries
  const boundaries = [...BOUNDARY_TEXT[p.boundaries.preset], ...bullets(p.boundaries.custom)];
  if (boundaries.length) sections.push({ key: "boundaries", title: "Boundaries", lines: boundaries });

  // Greeting (sebagai inspirasi pesan pertama)
  if (p.greeting) {
    sections.push({
      key: "greeting",
      title: "Opening Line",
      lines: [`When starting a new conversation, greet the user in a way similar to: "${p.greeting}"`],
    });
  }

  return {
    persona: p,
    variables: input.variables ?? {},
    sections,
    examples: p.examples,
    greeting: p.greeting,
    role,
    runtime: p.runtime,
    agentic: !!role?.agentic,
    languageName: lang,
  };
}

/** Ambil override runtime untuk harness tertentu: `runtime.targets.<id>`. */
export function targetConfig(ir: PromptIR, harnessId: string): Record<string, any> {
  return ir.runtime.targets[harnessId] ?? {};
}
