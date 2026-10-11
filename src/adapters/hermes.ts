import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class HermesAdapter implements HarnessAdapter {
  readonly id = "hermes";
  readonly name = "Nous Hermes Agentic Harness";
  readonly description = "Format sistem prompt ChatML untuk Nous Hermes 2/3 dengan agentic function calling & scratchpad";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const systemText = renderPrompt(ir, { style: "markdown" });

    let agenticProtocol = "";
    if (ir.agentic) {
      agenticProtocol = `

# HERMES AGENTIC REASONING & EXECUTION PROTOCOL
1. MANDATORY SCRATCHPAD: Always analyze user requests and inspect the state before executing actions.
   Use the <scratchpad> ... </scratchpad> block to structure internal hypotheses, dependencies, and risks.
2. TOOL EXECUTION PROTOCOL:
   When you need to call tools or interact with the system, output tool calls strictly inside <tool_call> tags:
   <tool_call>
   {"name": "tool_name", "arguments": {"param1": "value1"}}
   </tool_call>
3. ZERO HALLUCINATION: Never invent tool results or assume success without inspecting tool observations.
4. CONCISE SYNTHESIS: Once tool results are received, synthesize a direct, high-value response adhering to your persona's tone.`;
    }

    const content = `<|im_start|>system
${systemText}${agenticProtocol}
<|im_end|>`;

    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.hermes.prompt`,
      mimeType: "text/plain",
      content,
      metadata: {
        recommended_temperature: ir.runtime.temperature,
        recommended_top_p: ir.runtime.top_p,
        call_tag: "tool_call",
        scratchpad_enabled: ir.agentic,
      },
    };
  }
}
