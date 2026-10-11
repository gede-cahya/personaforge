import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class CharacterCardAdapter implements HarnessAdapter {
  readonly id = "character-card";
  readonly name = "Character Card V2 Spec (SillyTavern / Chub / RisuAI)";
  readonly description = "Format standar Character Card V2 JSON untuk platform roleplay dan companion AI (SillyTavern, Agnaistic, dll.)";
  readonly category = "roleplay";

  compile(ir: PromptIR): HarnessOutput {
    const { persona, examples, greeting } = ir;
    const { character, voice } = persona;

    const mesExample = examples
      .map((e) => `<START>\n{{user}}: ${e.user}\n{{char}}: ${e.assistant}`)
      .join("\n\n");

    const cardPayload = {
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: {
        name: persona.name,
        description: `${character.bio}\n\n${character.backstory.join("\n")}`,
        personality: `${voice.tone}. Quirks: ${voice.quirks.join("; ")}`,
        scenario: persona.tagline || `Interacting with {{user}}`,
        first_mes: greeting ? greeting.replace(new RegExp(ir.variables.user_name || "kamu", "g"), "{{user}}") : `Hello {{user}}.`,
        mes_example: mesExample,
        creator_notes: `Exported by PersonaForge v2. Author: ${persona.author}`,
        system_prompt: renderPrompt(ir, { style: "markdown", includeExamples: false }),
        tags: persona.tags,
        alternate_greetings: [],
        character_book: undefined,
      },
    };

    return {
      harnessId: this.id,
      filename: `${persona.id}.card.json`,
      mimeType: "application/json",
      content: JSON.stringify(cardPayload, null, 2),
      metadata: cardPayload,
    };
  }
}
