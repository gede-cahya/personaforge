import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

/**
 * Antigravity Agentic Harness Adapter
 * Mengompilasi persona ke format Antigravity Autonomous Mission Harness.
 * Berfokus pada: Mission Objectives, Workspace Boundaries, OODA Action Loop,
 * Artifact Generation, dan Autonomous Self-Correction.
 */
export class AntigravityAdapter implements HarnessAdapter {
  readonly id = "antigravity";
  readonly name = "Antigravity Autonomous Mission Harness";
  readonly description = "Format orkestrasi agen otonom Antigravity dengan Mission Directives, OODA Loop, dan Artifact Tracking";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, psychometrics, linguistic_style, reasoning_protocol, harness_hints } = persona;

    const loreItems = identity.lore.map((l) => `    - "${l}"`).join("\n");
    const forbiddenRules = linguistic_style.forbidden_patterns.map((p) => `  - FORBIDDEN: "${p}"`).join("\n");
    const edgeChecks = reasoning_protocol.thought_process.verify_edge_cases.map((e) => `    - ${e}`).join("\n");
    const capabilities = harness_hints.agentic_capabilities.map((c) => `    - ${c}`).join("\n");

    const content = `# ====================================================================
# ANTIGRAVITY AGENT HARNESS SPECIFICATION (AG-SPEC v1.2)
# Agent ID: ${persona.id}
# Persona: ${persona.name}
# Role: ${identity.title}
# ====================================================================

[MISSION_DIRECTIVE]
name: "${persona.name}"
title: "${identity.title}"
objective: >
  ${identity.bio}

[PSYCHOMETRIC_ATTRIBUTES]
openness: ${psychometrics.openness}
conscientiousness: ${psychometrics.conscientiousness}
extraversion: ${psychometrics.extraversion}
agreeableness: ${psychometrics.agreeableness}
neuroticism: ${psychometrics.neuroticism}
tone: "${linguistic_style.tone}"
conciseness_index: ${linguistic_style.conciseness}

[KNOWLEDGE_BASE_AND_LORE]
lore:
${loreItems || "    - \"Autonomous high-performance agent.\""}

[AGENTIC_CAPABILITIES_GRANTED]
capabilities:
${capabilities}

[WORKSPACE_AND_SAFETY_BOUNDARIES]
rules:
${forbiddenRules || "  - FORBIDDEN: \"Premature surrender or unverified execution.\""}
  - MANDATORY: "Always verify file modifications and command outcomes prior to mission handover."
  - REPUTATION_GUARD: "Never produce placeholder code or unhandled edge cases."

[REASONING_AND_OODA_LOOP]
mode: "${reasoning_protocol.mode}"
execution_flow:
  1_OBSERVE: "Audit local environment, workspace files, and incoming mission payload."
  2_ORIENT: "Evaluate context against psychometric standards and technical constraints."
  3_DECIDE:
    require_step_by_step: ${reasoning_protocol.thought_process.step_by_step_mandatory}
    verify_critical_edge_cases:
${edgeChecks}
  4_ACT:
    dispatch_mode: "deterministic_tool_invocations"
    feedback_loop: "autonomous_self_correction_on_error"

[RUNTIME_TUNING]
temperature: ${harness_hints.temperature}
top_p: ${harness_hints.top_p}
max_tokens: ${harness_hints.max_tokens}
preferred_models: [${harness_hints.preferred_models.map((m) => `"${m}"`).join(", ")}]
# ====================================================================
`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.antigravity.yaml`,
      mimeType: "application/x-yaml",
      content,
      metadata: {
        harness_type: "autonomous_mission",
        capabilities: harness_hints.agentic_capabilities,
        ooda_loop_enabled: true,
      },
    };
  }
}
