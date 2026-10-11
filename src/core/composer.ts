import type { PersonaSpec } from "../schema/ups.ts";
import { PersonaSchema } from "../schema/ups.ts";
import { mergeLayers, type Plain } from "./merge.ts";

/**
 * Persona Composer Engine
 * Bertanggung jawab melakukan merge mendalam dua persona / trait secara terstruktur.
 */
export class PersonaComposer {
  /**
   * Melakukan merge mendalam dua persona/trait spec
   */
  static merge(base: Partial<PersonaSpec> | Plain, overlay: Partial<PersonaSpec> | Plain): PersonaSpec {
    const merged = mergeLayers(base, overlay);
    return PersonaSchema.parse(merged);
  }
}
