import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

export class LangGraphAdapter implements HarnessAdapter {
  readonly id = "langgraph";
  readonly name = "LangGraph / LangChain Harness";
  readonly description = "SystemMessagePromptTemplate & StateGraph system prompt generator";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, linguistic_style, reasoning_protocol } = persona;

    const systemPrompt = `You are ${persona.name}, ${identity.title}.\n\n` +
      `${identity.bio}\n\n` +
      `Style & Tone: ${linguistic_style.tone}\n` +
      `Reasoning Mode: ${reasoning_protocol.mode}\n` +
      `Current State Context: {current_state}\n` +
      `Task Input: {input}`;

    const content = `import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

/**
 * Persona: ${persona.name}
 * Target: LangGraph / LangChain Agent
 */
export const ${persona.id.replace(/-/g, "_")}PromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    \`${systemPrompt.replace(/`/g, "\\`")}\`
  ),
  HumanMessagePromptTemplate.fromTemplate("{input}"),
]);
`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.langgraph.ts`,
      mimeType: "text/typescript",
      content,
    };
  }
}
