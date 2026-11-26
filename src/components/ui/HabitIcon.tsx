"use client";

import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Dumbbell,
  Flame,
  Footprints,
  HeartHandshake,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

export const ICON_OPTIONS = [
  { id: "footprints", label: "Caminar" },
  { id: "dumbbell", label: "Fuerza" },
  { id: "target", label: "Foco" },
  { id: "book-open", label: "Lectura" },
  { id: "sparkles", label: "Orden" },
  { id: "users", label: "Dúo" },
  { id: "flame", label: "Energía" },
  { id: "zap", label: "Sprint" },
] as const;

export function HabitIcon({
  name,
  className = "w-4 h-4",
}: {
  name: string;
  className?: string;
}) {
  switch (name) {
    case "footprints":
      return <Footprints className={className} aria-hidden="true" />;
    case "dumbbell":
      return <Dumbbell className={className} aria-hidden="true" />;
    case "target":
      return <Target className={className} aria-hidden="true" />;
    case "book-open":
      return <BookOpen className={className} aria-hidden="true" />;
    case "sparkles":
      return <Sparkles className={className} aria-hidden="true" />;
    case "users":
      return <Users className={className} aria-hidden="true" />;
    case "heart":
      return <HeartHandshake className={className} aria-hidden="true" />;
    case "flame":
      return <Flame className={className} aria-hidden="true" />;
    case "zap":
      return <Zap className={className} aria-hidden="true" />;
    default:
      return <CheckCircle2 className={className} aria-hidden="true" />;
  }
}
