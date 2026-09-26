import { describe, expect, it } from "bun:test";
import { PersonaLoader } from "../src/core/loader.ts";
import { AdapterRegistry } from "../src/adapters/registry.ts";
import { PersonaComposer } from "../src/core/composer.ts";

describe("PersonaForge Engine Tests", () => {
  const loader = new PersonaLoader();
  const registry = AdapterRegistry.getInstance();
  registry.autoDiscoverCustomHarnesses("./custom_harnesses");

  it("should load all built-in preset personas correctly", () => {
    const personas = loader.listAvailablePersonas();
    expect(personas.length).toBeGreaterThanOrEqual(4);
    
    const hermes = loader.loadById("hermes-autonomous-coder");
    expect(hermes.id).toBe("hermes-autonomous-coder");
    expect(hermes.name).toBe("Hermes Autonomous Coder");
    expect(hermes.harness_hints.temperature).toBe(0.2);
  });

  it("should have Hermes, Antigravity, and Custom harnesses registered", () => {
    const hermesAdapter = registry.get("hermes");
    const antigravityAdapter = registry.get("antigravity");
    const autogenAdapter = registry.get("autogen");

    expect(hermesAdapter).toBeDefined();
    expect(hermesAdapter?.id).toBe("hermes");

    expect(antigravityAdapter).toBeDefined();
    expect(antigravityAdapter?.id).toBe("antigravity");

    expect(autogenAdapter).toBeDefined();
    expect(autogenAdapter?.id).toBe("autogen");
  });

  it("should compile to Hermes format with <scratchpad> and <tool_call> tags", () => {
    const persona = loader.loadById("hermes-autonomous-coder");
    const adapter = registry.get("hermes")!;
    const output = adapter.compile(persona);

    expect(output.content).toContain("<|im_start|>system");
    expect(output.content).toContain("<scratchpad>");
    expect(output.content).toContain("<tool_call>");
    expect(output.content).toContain("<|im_end|>");
  });

  it("should compile to Antigravity format with OODA loop and safety boundaries", () => {
    const persona = loader.loadById("antigravity-mission-commander");
    const adapter = registry.get("antigravity")!;
    const output = adapter.compile(persona);

    expect(output.content).toContain("ANTIGRAVITY AGENT HARNESS SPECIFICATION");
    expect(output.content).toContain("[MISSION_DIRECTIVE]");
    expect(output.content).toContain("[REASONING_AND_OODA_LOOP]");
    expect(output.content).toContain("1_OBSERVE");
    expect(output.content).toContain("4_ACT");
  });

  it("should compile to Custom Harness (AutoGen) with valid Python syntax", () => {
    const persona = loader.loadById("lead-systems-architect");
    const adapter = registry.get("autogen")!;
    const output = adapter.compile(persona);

    expect(output.content).toContain("from autogen import AssistantAgent");
    expect(output.content).toContain("lead_systems_architect_agent = AssistantAgent(");
    expect(output.content).toContain("Lead Systems Architect & Performance Purist");
  });

  it("should merge traits via PersonaComposer correctly", () => {
    const base = loader.loadById("lead-systems-architect");
    const merged = PersonaComposer.merge(base, {
      identity: {
        title: "Master Systems & Rust Architect",
        bio: base.identity.bio,
        lore: ["Extra lore added."],
        avatar: base.identity.avatar,
      },
      harness_hints: {
        ...base.harness_hints,
        temperature: 0.05,
      },
    });

    expect(merged.identity.title).toBe("Master Systems & Rust Architect");
    expect(merged.identity.lore).toContain("Extra lore added.");
    expect(merged.harness_hints.temperature).toBe(0.05);
  });
});
