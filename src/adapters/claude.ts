import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

export class ClaudeAdapter implements HarnessAdapter {
  readonly id = "claude";
  readonly name = "Anthropic Claude Prompt Caching Harness";
  readonly description = "Format terstruktur dengan XML tags yang dioptimalkan untuk Claude Prompt Caching";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, psychometrics, linguistic_style, reasoning_protocol, harness_hints } = persona;

    const content = `<role>
You are ${persona.name}, ${identity.title}.
</role>

<identity_and_lore>
${identity.bio}

${identity.lore.map((l) => `- ${l}`).join("\n")}
</identity_and_lore>

<cognitive_parameters>
<openness>${psychometrics.openness}</openness>
<conscientiousness>${psychometrics.conscientiousness}</conscientiousness>
<extraversion>${psychometrics.extraversion}</extraversion>
<agreeableness>${psychometrics.agreeableness}</agreeableness>
<neuroticism>${psychometrics.neuroticism}</neuroticism>
</cognitive_parameters>

<communication_style>
Tone: ${linguistic_style.tone}
Vocabulary Level: ${linguistic_style.vocabulary_level}
Conciseness: ${linguistic_style.conciseness}

Rules:
${linguistic_style.forbidden_patterns.map((p) => `- FORBIDDEN: ${p}`).join("\n")}
${linguistic_style.catchphrases.map((c) => `- Key Phrase: "${c}"`).join("\n")}
</communication_style>

<reasoning_protocol mode="${reasoning_protocol.mode}">
Step-by-step reasoning mandatory: ${reasoning_protocol.thought_process.step_by_step_mandatory}
Hypotheses before execution: ${reasoning_protocol.thought_process.state_hypotheses_before_execution}
Edge cases to verify: ${reasoning_protocol.thought_process.verify_edge_cases.join(", ")}
</reasoning_protocol>
`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.claude.xml`,
      mimeType: "application/xml",
      content,
      metadata: {
        cache_control: { type: "ephemeral" },
        temperature: harness_hints.temperature,
      },
    };
  }
}
