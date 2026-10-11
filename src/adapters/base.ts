import type { PromptIR } from "../core/ir.ts";

export interface HarnessOutput {
  harnessId: string;
  filename: string;
  mimeType: string;
  content: string;
  metadata?: Record<string, any>;
}

export type HarnessCategory = "prompt" | "chat-api" | "framework" | "agent" | "roleplay" | "custom";

export interface HarnessAdapter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category?: HarnessCategory;
  /** Kompilasi Prompt IR (persona yang sudah di-resolve) menjadi file untuk harness ini. */
  compile(ir: PromptIR): HarnessOutput;
}
