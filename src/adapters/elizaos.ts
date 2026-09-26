import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

export class ElizaOSAdapter implements HarnessAdapter {
  readonly id = "elizaos";
  readonly name = "ElizaOS (ai16z) Character Harness";
  readonly description = "Format character.json standar untuk ElizaOS autonomous agents";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, linguistic_style, psychometrics } = persona;

    const character = {
      name: persona.name,
      username: persona.id,
      modelProvider: "anthropic",
      bio: [identity.bio, ...identity.lore],
      lore: identity.lore,
      style: {
        all: [
          linguistic_style.tone,
          `conciseness level: ${linguistic_style.conciseness}`,
          ...linguistic_style.forbidden_patterns.map(p => `never do: ${p}`),
        ],
        chat: linguistic_style.catchphrases,
      },
      topics: persona.tags,
      adjectives: [
        psychometrics.openness > 0.7 ? "innovative" : "conservative",
        psychometrics.conscientiousness > 0.8 ? "meticulous" : "adaptable",
        linguistic_style.tone,
      ],
    };

    return {
      harnessId: this.id,
      filename: `${persona.id}.character.json`,
      mimeType: "application/json",
      content: JSON.stringify(character, null, 2),
    };
  }
}
