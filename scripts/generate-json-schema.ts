import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { PersonaSchema } from "../src/schema/ups.ts";

const schema = zodToJsonSchema(PersonaSchema, {
  name: "PersonaForgeUPSv2",
  $refStrategy: "none",
});

const outPath = resolve(import.meta.dir, "../src/schema/persona.schema.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(schema, null, 2), "utf-8");
console.log(`✔ JSON Schema generated at: ${outPath}`);
