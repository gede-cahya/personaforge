import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class ClaudeCodeAdapter implements HarnessAdapter {
  readonly id = "claude-code";
  readonly name = "Claude Code Agent Rules (CLAUDE.md)";
  readonly description = "Instruksi agen coding CLI Claude Code (CLAUDE.md atau persona definition)";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const prompt = renderPrompt(ir, { style: "markdown" });

    const content = `# CLAUDE.md — ${ir.persona.name} Agent Directives

> Operates under the personality, technical rigor, and constraints detailed below.

${prompt}
`;

    return {
      harnessId: this.id,
      filename: `CLAUDE.${ir.persona.id}.md`,
      mimeType: "text/markdown",
      content,
    };
  }
}
