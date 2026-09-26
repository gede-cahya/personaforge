import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

/**
 * Nous Hermes Agentic Harness Adapter
 * Mengompilasi persona ke format NousResearch Hermes 2 Pro / Hermes 3 agent loop.
 * Mendukung tag <tools>, <scratchpad>, dan format <tool_call> JSON.
 */
export class HermesAdapter implements HarnessAdapter {
  readonly id = "hermes";
  readonly name = "Nous Hermes Agentic Harness";
  readonly description = "Format sistem prompt untuk Nous Hermes 2/3 dengan agentic function calling & scratchpad";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, psychometrics, linguistic_style, reasoning_protocol, harness_hints } = persona;

    const loreText = identity.lore.length > 0 
      ? identity.lore.map((l) => `- ${l}`).join("\n")
      : "- Operates with uncompromising technical standards.";

    const forbiddenText = linguistic_style.forbidden_patterns.length > 0
      ? linguistic_style.forbidden_patterns.map((p) => `- DO NOT: ${p}`).join("\n")
      : "";

    const catchphrasesText = linguistic_style.catchphrases.length > 0
      ? linguistic_style.catchphrases.map((c) => `- \"${c}\"`).join("\n")
      : "";

    const edgeCases = reasoning_protocol.thought_process.verify_edge_cases.join(", ");

    const content = `<|im_start|>system
You are ${persona.name}, ${identity.title}.

# CORE IDENTITY & LORE
${identity.bio}

${loreText}

# PSYCHOLOGICAL & BEHAVIORAL PROFILE
- Openness: ${psychometrics.openness} | Conscientiousness: ${psychometrics.conscientiousness}
- Extraversion: ${psychometrics.extraversion} | Agreeableness: ${psychometrics.agreeableness} | Neuroticism: ${psychometrics.neuroticism}
- Tone: ${linguistic_style.tone}
- Conciseness Level: ${linguistic_style.conciseness} (scale 0-1)
- Vocabulary Register: ${linguistic_style.vocabulary_level}

# COMMUNICATION RULES & SIGNATURES
${catchphrasesText ? `Favorite Mantras / Phrases:\n${catchphrasesText}\n` : ""}
${forbiddenText ? `Strict Constraints:\n${forbiddenText}\n` : ""}

# HERMES AGENTIC REASONING & EXECUTION PROTOCOL
Mode: ${reasoning_protocol.mode}
1. MANDATORY SCRATCHPAD: Always analyze user requests and inspect the state before executing actions.
   Use the <scratchpad> ... </scratchpad> block to structure internal hypotheses, dependencies, and risks.
2. EDGE CASE MITIGATION: Explicitly verify risks concerning: ${edgeCases}.
3. TOOL EXECUTION PROTOCOL:
   When you need to call tools or interact with the system, output tool calls strictly inside <tool_call> tags:
   <tool_call>
   {"name": "tool_name", "arguments": {"param1": "value1"}}
   </tool_call>
4. ZERO HALLUCINATION: Never invent tool results or assume success without inspecting tool observations.
5. CONCISE SYNTHESIS: Once tool results are received, synthesize a direct, high-value response adhering to your persona's tone.
<|im_end|>`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.hermes.prompt`,
      mimeType: "text/plain",
      content,
      metadata: {
        recommended_temperature: harness_hints.temperature,
        recommended_top_p: harness_hints.top_p,
        call_tag: "tool_call",
        scratchpad_enabled: true,
      },
    };
  }
}
