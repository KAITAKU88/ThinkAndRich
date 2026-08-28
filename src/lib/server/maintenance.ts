import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { maintenanceMode } from "@/db/schema";

export const MAINTENANCE_KV_KEY = "maintenance:state";
export const MAINTENANCE_TTL_MS = 15 * 60 * 1000;

export interface MaintenanceState {
  enabled: boolean;
  enabledAt: string | null;
  enabledBy: string | null;
  reason: "pricing_refresh" | "manual" | null;
  messageVi: string | null;
  messageEn: string | null;
}

export const DISABLED_MAINTENANCE: MaintenanceState = {
  enabled: false,
  enabledAt: null,
  enabledBy: null,
  reason: null,
  messageVi: null,
  messageEn: null,
};

export function isMaintenanceActive(state: MaintenanceState, now: Date = new Date()): boolean {
  if (!state.enabled || !state.enabledAt) return false;
  return now.getTime() - new Date(state.enabledAt).getTime() <= MAINTENANCE_TTL_MS;
}

export async function setMaintenance(
  db: DrizzleD1Database,
  kv: KVNamespace | undefined,
  state: MaintenanceState
) {
  await db
    .update(maintenanceMode)
    .set({
      enabled: state.enabled,
      enabledAt: state.enabledAt,
      enabledBy: state.enabledBy,
      reason: state.reason,
      messageVi: state.messageVi,
      messageEn: state.messageEn,
    })
    .where(eq(maintenanceMode.id, "current"));

  if (kv) {
    await kv.put(MAINTENANCE_KV_KEY, JSON.stringify(state));
  }
}

export async function readMaintenanceFromKv(kv: KVNamespace | undefined): Promise<MaintenanceState> {
  if (!kv) return DISABLED_MAINTENANCE;
  const raw = await kv.get(MAINTENANCE_KV_KEY);
  if (!raw) return DISABLED_MAINTENANCE;
  try {
    return JSON.parse(raw) as MaintenanceState;
  } catch {
    return DISABLED_MAINTENANCE;
  }
}
