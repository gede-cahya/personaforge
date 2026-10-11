import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class ClaudeAdapter implements HarnessAdapter {
  readonly id = "claude";
  readonly name = "Anthropic Claude Prompt Caching Harness";
  readonly description = "Format terstruktur dengan XML tags yang dioptimalkan untuk Claude System Prompt & Prompt Caching";
  readonly category = "chat-api";

  compile(ir: PromptIR): HarnessOutput {
    const xmlPrompt = renderPrompt(ir, { style: "xml" });

    const content = `<system_prompt>
${xmlPrompt}
</system_prompt>
`;

    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.claude.xml`,
      mimeType: "application/xml",
      content,
      metadata: {
        cache_control: { type: "ephemeral" },
        temperature: ir.runtime.temperature,
      },
    };
  }
}
