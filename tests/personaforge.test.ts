import { describe, expect, it } from "bun:test";
import { PersonaResolver } from "../src/core/loader.ts";
import { AdapterRegistry } from "../src/adapters/registry.ts";
import { PersonaComposer } from "../src/core/composer.ts";
import { buildIR } from "../src/core/ir.ts";
import { compile } from "../src/index.ts";
import { VariableError } from "../src/core/variables.ts";

describe("PersonaForge v2 Engine Tests", () => {
  const resolver = new PersonaResolver();
  const registry = AdapterRegistry.getInstance();
  registry.autoDiscoverCustomHarnesses("./custom_harnesses");

  it("should list and resolve all 11 built-in preset personas with schema v2", () => {
    const list = resolver.listPersonas();
    expect(list.length).toBe(11);

    const ids = [
      "yandere-girlfriend",
      "motherly-caring-mama",
      "zen-monk-mentor",
      "loving-tech-partner",
      "tsundere-genius-coder",
      "snarky-british-butler",
      "cyberpunk-netrunner",
      "lead-systems-architect",
      "hermes-autonomous-coder",
      "antigravity-mission-commander",
      "ruthless-reviewer",
    ];

    for (const id of ids) {
      const res = resolver.resolve(id);
      expect(res.persona.schema_version).toBe("2.0");
      expect(res.persona.examples.length).toBe(4);
      expect(res.persona.character.bio.length).toBeGreaterThan(10);
      expect(res.persona.voice.tone.length).toBeGreaterThan(3);
    }
  });

  it("should have all 17 built-in and custom harnesses registered", () => {
    const harnesses = registry.list();
    expect(harnesses.length).toBeGreaterThanOrEqual(16);

    const expectedIds = [
      "prompt", "json", "ollama", "claude", "openai",
      "hermes", "antigravity", "crewai", "langgraph", "elizaos",
      "smara", "agents-md", "cursor", "claude-code", "character-card",
      "autogen", "dify"
    ];

    for (const id of expectedIds) {
      const adapter = registry.get(id);
      expect(adapter).toBeDefined();
      expect(adapter?.id).toBe(id);
    }
  });

  it("should compile to Hermes format with conditional agentic scratchpad and tool_call tags", () => {
    const res = resolver.resolve("hermes-autonomous-coder");
    const ir = buildIR(res);
    const adapter = registry.get("hermes")!;
    const output = adapter.compile(ir);

    expect(output.content).toContain("<|im_start|>system");
    expect(output.content).toContain("<scratchpad>");
    expect(output.content).toContain("<tool_call>");
    expect(output.content).toContain("<|im_end|>");
  });

  it("should compile to Antigravity format with OODA loop and safety boundaries", () => {
    const res = resolver.resolve("antigravity-mission-commander");
    const ir = buildIR(res);
    const adapter = registry.get("antigravity")!;
    const output = adapter.compile(ir);

    expect(output.content).toContain("ANTIGRAVITY AGENT HARNESS SPECIFICATION");
    expect(output.content).toContain("[MISSION_DIRECTIVE]");
    expect(output.content).toContain("[REASONING_AND_OODA_LOOP]");
    expect(output.content).toContain("1_OBSERVE");
    expect(output.content).toContain("4_ACT");
  });

  it("should compile to Custom Harness (AutoGen) with valid Python syntax and import os", () => {
    const res = resolver.resolve("lead-systems-architect");
    const ir = buildIR(res);
    const adapter = registry.get("autogen")!;
    const output = adapter.compile(ir);

    expect(output.content).toContain("import os");
    expect(output.content).toContain("from autogen import AssistantAgent");
    expect(output.content).toContain("lead_systems_architect_agent = AssistantAgent(");
    expect(output.content).toContain('os.environ.get("OPENAI_API_KEY", "")');
  });

  it("should interpolate variables properly and validate enums", () => {
    const res = resolver.resolve("yandere-girlfriend", {
      vars: { user_name: "Cahya", intensity: "intense" },
    });
    expect(res.persona.character.bio).toContain("Cahya");
    expect(res.variables.user_name).toBe("Cahya");
    expect(res.variables.intensity).toBe("intense");

    // Invalid enum value should throw
    expect(() => {
      resolver.resolve("yandere-girlfriend", {
        vars: { intensity: "extreme_overkill" },
      });
    }).toThrow(VariableError);
  });

  it("should allow dynamic role swapping on any persona", () => {
    const res = resolver.resolve("motherly-caring-mama", {
      role: "code-reviewer",
    });
    expect(res.persona.role).toBeDefined();
    expect(res.persona.role?.id).toBe("code-reviewer");
    expect(res.persona.name).toBe("Mama Maria");

    const ir = buildIR(res);
    const promptAdapter = registry.get("prompt")!;
    const output = promptAdapter.compile(ir);

    expect(output.content).toContain("Mama Maria");
    expect(output.content).toContain("Code Reviewer");
    expect(output.content).toContain("Working method");
  });

  it("should allow trait composition and path overrides", () => {
    const res = resolver.resolve("tsundere-genius-coder", {
      traits: ["concise", "english-output"],
      set: [["voice.verbosity", 0.1]],
    });

    expect(res.persona.voice.verbosity).toBe(0.1);
    expect(res.persona.language.primary).toBe("en");
  });

  it("should generate Character Card V2 format with scenario and dialogue examples", () => {
    const res = resolver.resolve("yandere-girlfriend");
    const ir = buildIR(res);
    const adapter = registry.get("character-card")!;
    const output = adapter.compile(ir);

    const json = JSON.parse(output.content);
    expect(json.spec).toBe("chara_card_v2");
    expect(json.data.name).toBe("Aoi");
    expect(json.data.mes_example).toContain("{{user}}:");
    expect(json.data.mes_example).toContain("{{char}}:");
  });

  it("should generate ElizaOS character with valid messageExamples", () => {
    const res = resolver.resolve("yandere-girlfriend");
    const ir = buildIR(res);
    const adapter = registry.get("elizaos")!;
    const output = adapter.compile(ir);

    const json = JSON.parse(output.content);
    expect(json.name).toBe("Aoi");
    expect(Array.isArray(json.messageExamples)).toBe(true);
    expect(json.messageExamples.length).toBe(4);
    expect(json.messageExamples[0][0].user).toBe("{{user}}");
    expect(json.messageExamples[0][1].user).toBe("Aoi");
  });

  it("should use the high-level compile() API seamlessly", () => {
    const result = compile("loving-tech-partner", {
      target: "ollama",
      vars: { user_name: "Darling" },
      traits: ["concise"],
    });

    expect(result.persona.name).toBe("Smara");
    expect(result.output.harnessId).toBe("ollama");
    expect(result.output.content).toContain("FROM qwen2.5-coder:7b");
    expect(result.output.content).toContain("Darling");
  });

  it("should merge traits via PersonaComposer correctly", () => {
    const base = resolver.resolve("lead-systems-architect").persona;
    const merged = PersonaComposer.merge(base, {
      tagline: "Master Systems & Rust Architect",
      character: {
        ...base.character,
        backstory: ["Extra lore added."],
      },
      runtime: {
        ...base.runtime,
        temperature: 0.05,
      },
    });

    expect(merged.tagline).toBe("Master Systems & Rust Architect");
    expect(merged.character.backstory).toContain("Extra lore added.");
    expect(merged.runtime.temperature).toBe(0.05);
  });
});
