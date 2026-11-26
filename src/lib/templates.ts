import { Achievement, AttributeKey, FlashEvent, Habit } from "@/types/mob";

export const ATTRIBUTE_META: Record<
  AttributeKey,
  { label: string; shortDesc: string; colorVar: string }
> = {
  energia: {
    label: "Energía",
    shortDesc: "Vitalidad diaria, movimiento y descanso",
    colorVar: "var(--accent-action)",
  },
  fuerza: {
    label: "Fuerza",
    shortDesc: "Capacidad física y esfuerzo corporal",
    colorVar: "var(--accent-sage)",
  },
  enfoque: {
    label: "Enfoque",
    shortDesc: "Atención sostenida sin distracciones",
    colorVar: "var(--accent-focus)",
  },
  disciplina: {
    label: "Disciplina",
    shortDesc: "Consistencia, orden y cumplimiento",
    colorVar: "var(--medal-gold)",
  },
};

export const TIME_OF_DAY_META = {
  morning: { label: "Mañana", hint: "Arranque del día" },
  afternoon: { label: "Tarde", hint: "Ritmo sostenido" },
  evening: { label: "Noche", hint: "Cierre y calma" },
  anytime: { label: "Libre", hint: "En cualquier hueco" },
} as const;

export interface HabitTemplate {
  id: string;
  title: string;
  icon: string;
  summary: string;
  timeOfDay: Habit["timeOfDay"];
  primaryAttribute: AttributeKey;
  secondaryAttribute?: AttributeKey;
  isSharedDuo?: boolean;
  tiers: Habit["tiers"];
}

export const STARTER_HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: "tpl-walk",
    title: "Salir a caminar",
    icon: "footprints",
    summary: "Despeja la mente y activa circulación",
    timeOfDay: "morning",
    primaryAttribute: "energia",
    secondaryAttribute: "fuerza",
    tiers: {
      bronze: { label: "Vuelta a la manzana (8 min)", minutes: 8 },
      silver: { label: "Paso ligero (20 min)", minutes: 20 },
      gold: { label: "Caminata larga (40 min)", minutes: 40 },
    },
  },
  {
    id: "tpl-workout",
    title: "Entrenar cuerpo",
    icon: "dumbbell",
    summary: "Fuerza, movilidad o cardio a tu medida",
    timeOfDay: "afternoon",
    primaryAttribute: "fuerza",
    secondaryAttribute: "disciplina",
    tiers: {
      bronze: { label: "Activación express (5 min)", minutes: 5 },
      silver: { label: "Sesión sólida (25 min)", minutes: 25 },
      gold: { label: "Entreno completo (45 min)", minutes: 45 },
    },
  },
  {
    id: "tpl-deepwork",
    title: "Bloque de foco sin móvil",
    icon: "target",
    summary: "Avanza en lo importante sin saltar de pestaña",
    timeOfDay: "morning",
    primaryAttribute: "enfoque",
    secondaryAttribute: "disciplina",
    tiers: {
      bronze: { label: "Arranque limpio (10 min)", minutes: 10 },
      silver: { label: "Inmersión media (25 min)", minutes: 25 },
      gold: { label: "Bloque profundo (50 min)", minutes: 50 },
    },
  },
  {
    id: "tpl-read",
    title: "Lectura o estudio",
    icon: "book-open",
    summary: "Alimentar criterio y bajar revoluciones",
    timeOfDay: "evening",
    primaryAttribute: "enfoque",
    tiers: {
      bronze: { label: "2 páginas (4 min)", minutes: 4 },
      silver: { label: "Capítulo corto (15 min)", minutes: 15 },
      gold: { label: "Lectura inmersiva (30 min)", minutes: 30 },
    },
  },
  {
    id: "tpl-tidy",
    title: "Reset de orden en casa",
    icon: "sparkles",
    summary: "Entorno despejado = mente despejada",
    timeOfDay: "evening",
    primaryAttribute: "disciplina",
    tiers: {
      bronze: { label: "Despejar mesa (3 min)", minutes: 3 },
      silver: { label: "Zona clave lista (10 min)", minutes: 10 },
      gold: { label: "Orden general (20 min)", minutes: 20 },
    },
  },
  {
    id: "tpl-duo-walk",
    title: "Ponerse al día en Dúo",
    icon: "users",
    summary: "Caminar o charlar sin pantallas con tu pareja/amigo",
    timeOfDay: "evening",
    primaryAttribute: "energia",
    isSharedDuo: true,
    tiers: {
      bronze: { label: "Check-in sincero (5 min)", minutes: 5 },
      silver: { label: "Charla sin pantallas (15 min)", minutes: 15 },
      gold: { label: "Paseo o plan juntos (35 min)", minutes: 35 },
    },
  },
];

export const FLASH_EVENTS_POOL: FlashEvent[] = [
  {
    id: "flash-postura",
    title: "Encuentro Relámpago: Reset físico",
    actionHint: "Levántate, estira hombros y bebe un vaso de agua antes de seguir.",
    durationMinutes: 2,
    attribute: "energia",
    momentumBoost: 4,
  },
  {
    id: "flash-mesa",
    title: "Encuentro Relámpago: Zona despejada",
    actionHint: "Quita 5 objetos fuera de lugar de tu vista en 3 minutos.",
    durationMinutes: 3,
    attribute: "disciplina",
    momentumBoost: 5,
  },
  {
    id: "flash-microavance",
    title: "Encuentro Relámpago: Romper el hielo",
    actionHint: "Abre esa tarea que evitas y haz únicamente el primer renglón o paso.",
    durationMinutes: 4,
    attribute: "enfoque",
    momentumBoost: 6,
  },
  {
    id: "flash-activacion",
    title: "Encuentro Relámpago: Pulso activo",
    actionHint: "20 sentadillas o 3 minutos caminando rápido para despertar foco.",
    durationMinutes: 3,
    attribute: "fuerza",
    momentumBoost: 5,
  },
];

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  {
    id: "ach-first-step",
    title: "Primer Pulso",
    description: "Completaste tu primera acción en MOB.",
    tier: "bronze",
    category: "momentum",
  },
  {
    id: "ach-bronze-shield",
    title: "El Piso Mínimo",
    description: "Salvaste un día difícil asegurando al menos un Bronce. Cero todo-o-nada.",
    tier: "bronze",
    category: "momentum",
  },
  {
    id: "ach-main-mission",
    title: "Misión Principal Cumplida",
    description: "Cerraste una prioridad clave del día sin dejarla para mañana.",
    tier: "silver",
    category: "focus",
  },
  {
    id: "ach-anti-procrastination",
    title: "Fricción Vencida",
    description: "Transformaste un intento de aplazar en acción de 2 minutos o micro-pasos.",
    tier: "gold",
    category: "focus",
  },
  {
    id: "ach-gold-medal",
    title: "Estándar de Oro",
    description: "Alcanzaste el nivel Oro en un hábito diario.",
    tier: "gold",
    category: "body",
  },
  {
    id: "ach-duo-sync",
    title: "Sincronía Dúo",
    description: "Interactuaste o completaste un objetivo en equipo con tu Dúo.",
    tier: "silver",
    category: "duo",
  },
  {
    id: "ach-momentum-75",
    title: "Inercia Alta (75%)",
    description: "Construiste un impulso sostenido superior al 75%.",
    tier: "gold",
    category: "momentum",
  },
  {
    id: "ach-gym-pr",
    title: "Nuevo Récord Personal",
    description: "Superaste tu mejor 1RM estimado en un ejercicio de fuerza.",
    tier: "gold",
    category: "body",
  },
  {
    id: "ach-body-checkin",
    title: "Control Consciente",
    description: "Registraste tus medidas corporales para seguir tendencias reales sin obsesión.",
    tier: "silver",
    category: "body",
  },
  {
    id: "ach-mob-100",
    title: "Descarga al 100%",
    description: "Acumulaste esfuerzo constante hasta detonar el 100% de tu medidor MOB.",
    tier: "gold",
    category: "momentum",
  },
];

export function getLocalDateKey(offsetDays = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatHumanDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
