import type { PersonaSpec } from "../schema/ups.ts";
import { PersonaSchema } from "../schema/ups.ts";

/**
 * Persona Composer Engine
 * Bertanggung jawab melakukan kompilasi modular:
 * - Menyelesaikan pewarisan (extends)
 * - Me-merge trait mixins
 * - Mengaplikasikan override lokal
 */
export class PersonaComposer {
  /**
   * Melakukan merge mendalam dua persona/trait
   */
  static merge(base: Partial<PersonaSpec>, overlay: Partial<PersonaSpec>): PersonaSpec {
    const merged: any = { ...base, ...overlay };

    // Merge Identity
    if (base.identity || overlay.identity) {
      merged.identity = {
        ...base.identity,
        ...overlay.identity,
        lore: Array.from(new Set([...(base.identity?.lore || []), ...(overlay.identity?.lore || [])])),
        avatar: {
          ...(base.identity?.avatar || { icon: "AI", color: "#38BDF8", shape: "hexagon" }),
          ...(overlay.identity?.avatar || {}),
        },
      };
    }

    // Merge Psychometrics (rata-rata terbobot atau override)
    if (base.psychometrics || overlay.psychometrics) {
      merged.psychometrics = {
        openness: overlay.psychometrics?.openness ?? base.psychometrics?.openness ?? 0.8,
        conscientiousness: overlay.psychometrics?.conscientiousness ?? base.psychometrics?.conscientiousness ?? 0.9,
        extraversion: overlay.psychometrics?.extraversion ?? base.psychometrics?.extraversion ?? 0.5,
        agreeableness: overlay.psychometrics?.agreeableness ?? base.psychometrics?.agreeableness ?? 0.7,
        neuroticism: overlay.psychometrics?.neuroticism ?? base.psychometrics?.neuroticism ?? 0.1,
      };
    }

    // Merge Linguistic Style
    if (base.linguistic_style || overlay.linguistic_style) {
      merged.linguistic_style = {
        ...base.linguistic_style,
        ...overlay.linguistic_style,
        catchphrases: Array.from(new Set([
          ...(base.linguistic_style?.catchphrases || []),
          ...(overlay.linguistic_style?.catchphrases || []),
        ])),
        forbidden_patterns: Array.from(new Set([
          ...(base.linguistic_style?.forbidden_patterns || []),
          ...(overlay.linguistic_style?.forbidden_patterns || []),
        ])),
        formatting_preferences: {
          ...(base.linguistic_style?.formatting_preferences || {}),
          ...(overlay.linguistic_style?.formatting_preferences || {}),
        },
      };
    }

    // Merge Reasoning Protocol
    if (base.reasoning_protocol || overlay.reasoning_protocol) {
      merged.reasoning_protocol = {
        mode: overlay.reasoning_protocol?.mode || base.reasoning_protocol?.mode || "first_principles",
        thought_process: {
          step_by_step_mandatory: overlay.reasoning_protocol?.thought_process?.step_by_step_mandatory ?? 
            base.reasoning_protocol?.thought_process?.step_by_step_mandatory ?? true,
          state_hypotheses_before_execution: overlay.reasoning_protocol?.thought_process?.state_hypotheses_before_execution ?? 
            base.reasoning_protocol?.thought_process?.state_hypotheses_before_execution ?? true,
          verify_edge_cases: Array.from(new Set([
            ...(base.reasoning_protocol?.thought_process?.verify_edge_cases || []),
            ...(overlay.reasoning_protocol?.thought_process?.verify_edge_cases || []),
          ])),
        },
      };
    }

    // Merge Harness Hints
    if (base.harness_hints || overlay.harness_hints) {
      merged.harness_hints = {
        temperature: overlay.harness_hints?.temperature ?? base.harness_hints?.temperature ?? 0.3,
        top_p: overlay.harness_hints?.top_p ?? base.harness_hints?.top_p ?? 0.95,
        max_tokens: overlay.harness_hints?.max_tokens ?? base.harness_hints?.max_tokens ?? 4096,
        preferred_models: Array.from(new Set([
          ...(base.harness_hints?.preferred_models || []),
          ...(overlay.harness_hints?.preferred_models || []),
        ])),
        agentic_capabilities: Array.from(new Set([
          ...(base.harness_hints?.agentic_capabilities || []),
          ...(overlay.harness_hints?.agentic_capabilities || []),
        ])),
      };
    }

    // Merge Tags
    merged.tags = Array.from(new Set([...(base.tags || []), ...(overlay.tags || [])]));

    return PersonaSchema.parse(merged);
  }
}
