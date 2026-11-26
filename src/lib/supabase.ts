import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BodyMetricsPhase2 } from "@/types/mob";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Fase 2 preparada: Cálculo antropométrico científico (Fórmula US Navy + WHtR)
 * Listo para conectar en el módulo de Salud/Nutrición sin migraciones destructivas.
 */
export function calculateScientificBodyMetrics(input: BodyMetricsPhase2): BodyMetricsPhase2 {
  const waistToHeight = Number((input.waistCm / input.heightCm).toFixed(3));
  let bodyFatPct: number | undefined;

  if (input.sex === "male" && input.waistCm > input.neckCm) {
    bodyFatPct =
      495 /
        (1.0324 -
          0.19077 * Math.log10(input.waistCm - input.neckCm) +
          0.15456 * Math.log10(input.heightCm)) -
      450;
  } else if (input.sex === "female" && input.hipCm && input.waistCm + input.hipCm > input.neckCm) {
    bodyFatPct =
      495 /
        (1.29579 -
          0.35004 * Math.log10(input.waistCm + input.hipCm - input.neckCm) +
          0.221 * Math.log10(input.heightCm)) -
      450;
  }

  return {
    ...input,
    waistToHeightRatio: waistToHeight,
    estimatedBodyFatNavyPct: bodyFatPct ? Number(Math.max(4, Math.min(55, bodyFatPct)).toFixed(1)) : undefined,
  };
}
