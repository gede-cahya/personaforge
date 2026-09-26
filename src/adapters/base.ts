import type { PersonaSpec } from "../schema/ups.ts";

export interface HarnessOutput {
  harnessId: string;
  filename: string;
  mimeType: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface HarnessAdapter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  compile(persona: PersonaSpec): HarnessOutput;
}
