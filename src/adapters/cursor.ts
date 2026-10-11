import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class CursorAdapter implements HarnessAdapter {
  readonly id = "cursor";
  readonly name = "Cursor Editor Rules Harness (.cursorrules / .mdc)";
  readonly description = "Instruksi aturan pair-programming untuk Cursor IDE (.cursorrules atau .cursor/rules/*.mdc)";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const prompt = renderPrompt(ir, { style: "markdown" });

    const content = `---
description: Persona rule for ${ir.persona.name} (${ir.persona.tagline || "AI Pair Programmer"})
globs: *
alwaysApply: true
---

# Persona: ${ir.persona.name}

${prompt}
`;

    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.cursorrules`,
      mimeType: "text/markdown",
      content,
    };
  }
}
