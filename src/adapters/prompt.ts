import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class PromptAdapter implements HarnessAdapter {
  readonly id = "prompt";
  readonly name = "Universal System Prompt (Markdown)";
  readonly description = "Teks instruksi sistem terstruktur dalam format Markdown untuk disalin ke platform apa pun";
  readonly category = "prompt";

  compile(ir: PromptIR): HarnessOutput {
    const content = renderPrompt(ir, { style: "markdown" });
    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.prompt.md`,
      mimeType: "text/markdown",
      content,
      metadata: {
        name: ir.persona.name,
        role: ir.role?.name,
        language: ir.languageName,
      },
    };
  }
}
