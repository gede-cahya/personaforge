import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";

export class ElizaOSAdapter implements HarnessAdapter {
  readonly id = "elizaos";
  readonly name = "ElizaOS (ai16z) Character Harness";
  readonly description = "Format character.json resmi untuk framework agen ElizaOS (ai16z)";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const { persona, examples } = ir;
    const { character, voice } = persona;

    const messageExamples = examples.map((ex) => [
      { user: "{{user}}", content: { text: ex.user } },
      { user: persona.name, content: { text: ex.assistant } },
    ]);

    const characterJson = {
      name: persona.name,
      username: persona.id,
      modelProvider: "anthropic",
      bio: [character.bio, ...character.backstory],
      lore: character.backstory,
      style: {
        all: [
          voice.tone,
          `register: ${voice.register}`,
          ...persona.rules.dont.map((p) => `never: ${p}`),
        ],
        chat: voice.catchphrases,
      },
      messageExamples,
      topics: persona.tags,
      adjectives: [
        voice.tone,
        ...(character.personality.traits || []),
      ],
    };

    return {
      harnessId: this.id,
      filename: `${persona.id}.character.json`,
      mimeType: "application/json",
      content: JSON.stringify(characterJson, null, 2),
    };
  }
}
