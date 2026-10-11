import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { yamlString } from "../core/escape.ts";

export class AntigravityAdapter implements HarnessAdapter {
  readonly id = "antigravity";
  readonly name = "Antigravity Autonomous Mission Harness";
  readonly description = "Format orkestrasi agen otonom Antigravity dengan Mission Directives, OODA Loop, dan Artifact Tracking";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const { persona, runtime } = ir;
    const { character, voice } = persona;

    const loreItems = character.backstory.map((l) => `    - ${yamlString(l)}`).join("\n");
    const forbiddenRules = persona.rules.dont.map((p) => `  - FORBIDDEN: ${yamlString(p)}`).join("\n");
    const edgeChecks = (ir.role?.reasoning.verify ?? ["integrity", "security"]).map((e) => `    - ${e}`).join("\n");
    const capabilities = (ir.role?.capabilities ?? ["reasoning", "conversation"]).map((c) => `    - ${c}`).join("\n");

    const content = `# ====================================================================
# ANTIGRAVITY AGENT HARNESS SPECIFICATION (AG-SPEC v1.2)
# Agent ID: ${persona.id}
# Persona: ${persona.name}
# Role: ${persona.tagline || ir.role?.name || "Autonomous Agent"}
# ====================================================================

[MISSION_DIRECTIVE]
name: ${yamlString(persona.name)}
title: ${yamlString(persona.tagline || ir.role?.name || "Autonomous Agent")}
objective: >
  ${character.bio}

[PSYCHOMETRIC_ATTRIBUTES]
tone: ${yamlString(voice.tone)}
register: ${yamlString(voice.register)}
verbosity_index: ${voice.verbosity}

[KNOWLEDGE_BASE_AND_LORE]
lore:
${loreItems || "    - \"Autonomous digital collaborator.\""}

[AGENTIC_CAPABILITIES_GRANTED]
capabilities:
${capabilities}

[WORKSPACE_AND_SAFETY_BOUNDARIES]
rules:
${forbiddenRules || "  - FORBIDDEN: \"Premature surrender or unverified execution.\""}
  - MANDATORY: "Always verify file modifications and command outcomes prior to mission handover."
  - REPUTATION_GUARD: "Never produce placeholder code or unhandled edge cases."

[REASONING_AND_OODA_LOOP]
mode: "${ir.role?.reasoning.mode || "reflect_and_verify"}"
execution_flow:
  1_OBSERVE: "Audit local environment, workspace files, and incoming mission payload."
  2_ORIENT: "Evaluate context against psychometric standards and technical constraints."
  3_DECIDE:
    require_step_by_step: true
    verify_critical_edge_cases:
${edgeChecks}
  4_ACT:
    dispatch_mode: "deterministic_tool_invocations"
    feedback_loop: "autonomous_self_correction_on_error"

[RUNTIME_TUNING]
temperature: ${runtime.temperature}
top_p: ${runtime.top_p}
max_tokens: ${runtime.max_tokens}
# ====================================================================
`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.antigravity.yaml`,
      mimeType: "application/x-yaml",
      content,
      metadata: {
        harness_type: "autonomous_mission",
        capabilities: ir.role?.capabilities ?? [],
        ooda_loop_enabled: true,
      },
    };
  }
}
