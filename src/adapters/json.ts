import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class JsonAdapter implements HarnessAdapter {
  readonly id = "json";
  readonly name = "Universal Persona JSON Specification";
  readonly description = "Payload JSON komprehensif berisi metadata persona, Prompt IR, dan system prompt terkompilasi";
  readonly category = "prompt";

  compile(ir: PromptIR): HarnessOutput {
    const payload = {
      schema_version: "2.0",
      id: ir.persona.id,
      name: ir.persona.name,
      tagline: ir.persona.tagline,
      version: ir.persona.version,
      author: ir.persona.author,
      language: ir.persona.language,
      variables: ir.variables,
      role: ir.role,
      runtime: ir.runtime,
      meta: ir.persona.meta,
      system_prompt: renderPrompt(ir, { style: "markdown" }),
      examples: ir.examples,
      greeting: ir.greeting,
    };

    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.persona.json`,
      mimeType: "application/json",
      content: JSON.stringify(payload, null, 2),
      metadata: payload,
    };
  }
}
