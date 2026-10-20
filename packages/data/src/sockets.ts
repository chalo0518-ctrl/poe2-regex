import type { CraftSlotId } from "./types.ts";
import augmentsJson from "../generated/augments.json";

/**
 * Normal augment-socket cap for PoE2 0.5, from poe2db base `Sockets.socket_info`.
 * Type 5 is an augment socket (符文／增幅插槽). Type 9999 on jewellery and traps
 * is not one. A comma pair `1:5:100, 1:5:100` is the two sockets an Artificer's
 * Orb can add; a trailing `2:5:100` on the same base is the extra slot, not a
 * third artificer socket.
 *
 * Sampled 2026-10-20:
 * - Body (Vile Robe, Knight Armour), bow, crossbow, quarterstaff, two-hand
 *   sword / axe / mace: `1:5:100, 1:5:100 2:5:100` → normal max 2.
 * - Staff (Pyrophyte, Chiming): `1:5:100 2:5:100` → two real sockets, max 2.
 * - Helmet, gloves, boots, shield, buckler, focus, and one-socket weapons
 *   including spears (`Akoyan Spear` is `1:5:100`): normal max 1.
 * - Ring, amulet, belt, trap: no type 5 → 0, and they cannot be exceptional.
 *
 * Exceptional (卓越物品, https://poe2db.tw/tw/Exceptional_Item) adds one augment
 * socket on armour and weapons. This module only infers that from a count above
 * the normal max. Corruption can add another socket; the selector allows
 * normal max + 2 on slots that can be exceptional, and the count is not split
 * into "exceptional" versus "corrupted".
 *
 * Artificer's Orb (https://poe2db.tw/tw/Artificer's_Orb): one rune socket on a
 * martial weapon, wand, staff, or armour.
 */
const SLOT_SOCKETS: Record<CraftSlotId, { normalMax: number; canBeExceptional: boolean }> = {
  body: { normalMax: 2, canBeExceptional: true },
  bow: { normalMax: 2, canBeExceptional: true },
  crossbow: { normalMax: 2, canBeExceptional: true },
  quarterstaff: { normalMax: 2, canBeExceptional: true },
  staff: { normalMax: 2, canBeExceptional: true },
  sword2h: { normalMax: 2, canBeExceptional: true },
  axe2h: { normalMax: 2, canBeExceptional: true },
  mace2h: { normalMax: 2, canBeExceptional: true },
  helmet: { normalMax: 1, canBeExceptional: true },
  gloves: { normalMax: 1, canBeExceptional: true },
  boots: { normalMax: 1, canBeExceptional: true },
  shield: { normalMax: 1, canBeExceptional: true },
  claw: { normalMax: 1, canBeExceptional: true },
  dagger: { normalMax: 1, canBeExceptional: true },
  sword1h: { normalMax: 1, canBeExceptional: true },
  axe1h: { normalMax: 1, canBeExceptional: true },
  mace1h: { normalMax: 1, canBeExceptional: true },
  sceptre: { normalMax: 1, canBeExceptional: true },
  wand: { normalMax: 1, canBeExceptional: true },
  spear: { normalMax: 1, canBeExceptional: true },
  flail: { normalMax: 1, canBeExceptional: true },
  ring: { normalMax: 0, canBeExceptional: false },
  amulet: { normalMax: 0, canBeExceptional: false },
  belt: { normalMax: 0, canBeExceptional: false },
  trap: { normalMax: 0, canBeExceptional: false },
};

export type AugmentKind = "rune" | "soul-core" | "idol" | "abyssal-eye" | "augment";

export type AugmentEffect = {
  slots: CraftSlotId[];
  zh: string;
  en: string;
  /** Lower wins a same-size tie. Shields beat "shields and bucklers" beat bucklers. */
  bias: number;
};

export type Augment = {
  id: string;
  nameZh: string;
  nameEn: string;
  kind: AugmentKind;
  level: number;
  socketBound: boolean;
  limitOne: boolean;
  effects: AugmentEffect[];
};

const AUGMENTS = (augmentsJson as { augments: Augment[] }).augments;
const BY_ID = new Map(AUGMENTS.map((row) => [row.id, row]));

export function normalSocketMax(slot: CraftSlotId): number {
  return SLOT_SOCKETS[slot].normalMax;
}

export function slotCanBeExceptional(slot: CraftSlotId): boolean {
  return SLOT_SOCKETS[slot].canBeExceptional;
}

/** Highest socket count the crafting page offers for this slot. */
export function socketCountMax(slot: CraftSlotId): number {
  const row = SLOT_SOCKETS[slot];
  return row.canBeExceptional ? row.normalMax + 2 : row.normalMax;
}

/**
 * True when the selected count is above the slot's normal maximum.
 * Omitted slots and jewellery / traps are never exceptional.
 * The page must not show this flag.
 */
export function inferExceptionalBase(slot: CraftSlotId | undefined, socketCount: number): boolean {
  if (!slot || !SLOT_SOCKETS[slot].canBeExceptional) return false;
  if (!Number.isFinite(socketCount)) return false;
  return socketCount > SLOT_SOCKETS[slot].normalMax;
}

export function augmentById(id: string): Augment | undefined {
  return BY_ID.get(id);
}

/** Most specific effect line that applies to this slot. */
export function effectForSlot(augment: Augment, slot: CraftSlotId): AugmentEffect | null {
  let best: AugmentEffect | null = null;
  for (const effect of augment.effects) {
    if (!effect.slots.includes(slot)) continue;
    if (
      !best ||
      effect.slots.length < best.slots.length ||
      (effect.slots.length === best.slots.length && effect.bias < best.bias)
    ) {
      best = effect;
    }
  }
  return best;
}

export type SlotAugment = Augment & {
  effectZh: string;
  effectEn: string;
};

export function augmentsForSlot(slot: CraftSlotId): SlotAugment[] {
  const out: SlotAugment[] = [];
  for (const augment of AUGMENTS) {
    const effect = effectForSlot(augment, slot);
    if (!effect) continue;
    out.push({ ...augment, effectZh: effect.zh, effectEn: effect.en });
  }
  return out;
}
