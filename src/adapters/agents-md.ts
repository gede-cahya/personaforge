import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class AgentsMdAdapter implements HarnessAdapter {
  readonly id = "agents-md";
  readonly name = "AGENTS.md Agent Specification";
  readonly description = "File AGENTS.md standar untuk agen otonom dan AI coding assistants di workspace";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const prompt = renderPrompt(ir, { style: "markdown" });

    const content = `# AGENTS.md — ${ir.persona.name} Specification

> This workspace agent follows the persona, working method, and rules defined below.

${prompt}
`;

    return {
      harnessId: this.id,
      filename: `AGENTS.${ir.persona.id}.md`,
      mimeType: "text/markdown",
      content,
    };
  }
}
