import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

export class SmaraAdapter implements HarnessAdapter {
  readonly id = "smara";
  readonly name = "Smara Desktop SOUL.md Harness";
  readonly description = "Format SOUL.md dan payload bot persona native untuk Smara Desktop";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, psychometrics, linguistic_style, reasoning_protocol, harness_hints } = persona;

    const content = `# SOUL.md — ${persona.name}: ${identity.title}

## 1. Core Identity
- **Name**: ${persona.name}
- **Role**: ${identity.title}
- **Version**: ${persona.version}
- **Bio**: ${identity.bio}

### Lore & Background
${identity.lore.map((l) => `- ${l}`).join("\n") || "- Autonomous digital engineer."}

## 2. Psychometrics & Behavioral Signature
- **Openness**: ${psychometrics.openness}
- **Conscientiousness**: ${psychometrics.conscientiousness}
- **Extraversion**: ${psychometrics.extraversion}
- **Agreeableness**: ${psychometrics.agreeableness}
- **Neuroticism**: ${psychometrics.neuroticism}

## 3. Communication & Linguistic Style
- **Tone**: ${linguistic_style.tone}
- **Vocabulary Register**: ${linguistic_style.vocabulary_level}
- **Conciseness Target**: ${linguistic_style.conciseness}

### Key Mantras & Catchphrases
${linguistic_style.catchphrases.map((c) => `- "${c}"`).join("\n") || "- None"}

### Strict Anti-Patterns
${linguistic_style.forbidden_patterns.map((p) => `- ${p}`).join("\n")}

## 4. Reasoning Protocol & Execution Mode
- **Mode**: ${reasoning_protocol.mode}
- **Mandatory Step-by-Step**: ${reasoning_protocol.thought_process.step_by_step_mandatory}
- **Edge Cases Checklist**: ${reasoning_protocol.thought_process.verify_edge_cases.join(", ")}

## 5. Desktop Bot Config Payload
\`\`\`json
{
  "name": "${persona.name}",
  "title": "${identity.title}",
  "avatar_icon": "${identity.avatar.icon}",
  "avatar_color": "${identity.avatar.color}",
  "avatar_shape": "${identity.avatar.shape}",
  "model": "${harness_hints.preferred_models[0] || "gemini-3.8-flash"}"
}
\`\`\`
`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.soul.md`,
      mimeType: "text/markdown",
      content,
      metadata: {
        avatar: identity.avatar,
        bot_config: {
          name: persona.name,
          title: identity.title,
          avatar_icon: identity.avatar.icon,
          avatar_color: identity.avatar.color,
          avatar_shape: identity.avatar.shape,
        },
      },
    };
  }
}
