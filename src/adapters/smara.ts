import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class SmaraAdapter implements HarnessAdapter {
  readonly id = "smara";
  readonly name = "Smara Desktop SOUL.md Harness";
  readonly description = "Format SOUL.md dan payload bot persona native untuk Smara Desktop Bot";
  readonly category = "agent";

  compile(ir: PromptIR): HarnessOutput {
    const { persona } = ir;
    const { character, voice, meta } = persona;
    const systemText = renderPrompt(ir, { style: "markdown" });

    const content = `# SOUL.md — ${persona.name}: ${persona.tagline || "Autonomous Partner"}

${systemText}

## Desktop Bot Config Payload
\`\`\`json
{
  "name": "${persona.name}",
  "title": "${persona.tagline || ""}",
  "avatar_icon": "${meta.avatar.icon}",
  "avatar_color": "${meta.avatar.color}",
  "avatar_shape": "${meta.avatar.shape}",
  "temperature": ${ir.runtime.temperature}
}
\`\`\`
`;

    return {
      harnessId: this.id,
      filename: `${persona.id}.soul.md`,
      mimeType: "text/markdown",
      content,
      metadata: {
        avatar: meta.avatar,
        bot_config: {
          name: persona.name,
          title: persona.tagline,
          avatar_icon: meta.avatar.icon,
          avatar_color: meta.avatar.color,
          avatar_shape: meta.avatar.shape,
        },
      },
    };
  }
}
