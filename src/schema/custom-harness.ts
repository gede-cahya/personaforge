import { z } from "zod";

/**
 * Skema deklaratif untuk mendefinisikan Agentic Harness Baru (Custom Harness)
 * Memungkinkan pengguna menambahkan target harness apa pun tanpa menyentuh core TypeScript engine.
 */
export const CustomHarnessSchema = z.object({
  schema_version: z.string().default("1.0"),
  id: z.string().regex(/^[a-z0-9-_]+$/, "Harness ID must be lowercase alphanumeric"),
  name: z.string().min(2),
  description: z.string().default(""),
  output_format: z.enum([
    "markdown",
    "json",
    "yaml",
    "python",
    "typescript",
    "modelfile",
    "text"
  ]).default("markdown"),
  default_filename: z.string().default("agent_config.txt"),

  // Struktur prompt & section mapping
  sections: z.object({
    header: z.string().optional(),
    identity_prefix: z.string().default("### IDENTITY & ROLE\n"),
    psychometrics_prefix: z.string().default("### PSYCHOLOGICAL PROFILE\n"),
    style_prefix: z.string().default("### LINGUISTIC & COMMUNICATION GUIDELINES\n"),
    reasoning_prefix: z.string().default("### REASONING & EXECUTION PROTOCOL\n"),
    tools_prefix: z.string().default("### TOOL USAGE RULES\n"),
    footer: z.string().optional(),
  }).default({
    identity_prefix: "### IDENTITY & ROLE\n",
    psychometrics_prefix: "### PSYCHOLOGICAL PROFILE\n",
    style_prefix: "### LINGUISTIC & COMMUNICATION GUIDELINES\n",
    reasoning_prefix: "### REASONING & EXECUTION PROTOCOL\n",
    tools_prefix: "### TOOL USAGE RULES\n",
  }),

  // Pola Tool/Action call yang diharapkan harness tersebut
  tool_calling_convention: z.object({
    type: z.enum(["xml_tags", "json_markdown", "hermes_call", "function_calling", "none"]).default("json_markdown"),
    call_tag: z.string().default("action"),
    format_example: z.string().optional(),
  }).default({
    type: "json_markdown",
    call_tag: "action",
  }),

  // Template kustom berbasis variabel interpolasi:
  // {{name}}, {{title}}, {{bio}}, {{lore}}, {{tone}}, {{reasoning_mode}}, {{temperature}}, dll.
  custom_template: z.string().optional().describe("Template string jika ingin format bebas"),
});

export type CustomHarnessSpec = z.infer<typeof CustomHarnessSchema>;
