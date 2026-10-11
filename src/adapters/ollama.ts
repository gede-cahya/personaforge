import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { targetConfig } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";
import { escapeModelfileTriple } from "../core/escape.ts";

export class OllamaAdapter implements HarnessAdapter {
  readonly id = "ollama";
  readonly name = "Ollama Modelfile Harness";
  readonly description = "Modelfile siap deploy ke runtime Ollama lokal (ollama create & ollama run)";
  readonly category = "chat-api";

  compile(ir: PromptIR): HarnessOutput {
    const ollamaCfg = targetConfig(ir, "ollama");
    const baseModel = ollamaCfg.base_model || (ir.agentic ? "qwen2.5-coder:7b" : "qwen2.5:7b");
    const numCtx = ollamaCfg.num_ctx || (ir.agentic ? 16384 : 8192);

    const systemText = renderPrompt(ir, { style: "markdown" });

    const content = `FROM ${baseModel}

# Runtime Hyperparameters
PARAMETER temperature ${ir.runtime.temperature}
PARAMETER top_p ${ir.runtime.top_p}
PARAMETER num_ctx ${numCtx}

# System Instructions
SYSTEM """
${escapeModelfileTriple(systemText)}
"""
`;

    return {
      harnessId: this.id,
      filename: `Modelfile.${ir.persona.id}`,
      mimeType: "text/plain",
      content,
      metadata: {
        baseModel,
        numCtx,
        temperature: ir.runtime.temperature,
      },
    };
  }
}
