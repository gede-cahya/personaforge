import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";
import { camelIdentifier, escapeBraces, escapeTemplateLiteral } from "../core/escape.ts";

export class LangGraphAdapter implements HarnessAdapter {
  readonly id = "langgraph";
  readonly name = "LangGraph / LangChain Harness";
  readonly description = "SystemMessagePromptTemplate & StateGraph system prompt generator TypeScript";
  readonly category = "framework";

  compile(ir: PromptIR): HarnessOutput {
    const rawSystemPrompt = renderPrompt(ir, { style: "markdown" });
    // Escape braces so LangChain doesn't mistake markdown code blocks for template variables
    const escapedBraces = escapeBraces(rawSystemPrompt);
    const systemPrompt = `${escapedBraces}\n\nCurrent State Context: {current_state}`;

    const templateVar = `${camelIdentifier(ir.persona.id)}PromptTemplate`;

    const content = `import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

/**
 * Persona: ${ir.persona.name}
 * Target: LangGraph / LangChain Agent
 */
export const ${templateVar} = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    \`${escapeTemplateLiteral(systemPrompt)}\`
  ),
  HumanMessagePromptTemplate.fromTemplate("{input}"),
]);
`;

    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.langgraph.ts`,
      mimeType: "text/typescript",
      content,
      metadata: {
        templateVar,
      },
    };
  }
}
