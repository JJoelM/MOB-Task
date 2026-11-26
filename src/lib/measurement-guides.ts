import { MeasurementMode, MeasurementZone } from "@/types/mob";

export interface MeasurementGuide {
  zone: MeasurementZone;
  label: string;
  shortLabel: string;
  tier: "essential" | "complete";
  landmark: string;
  soloCues: [string, string];
  assistedCues: [string, string];
  duoTip: string;
}

export const MEASUREMENT_GUIDES: MeasurementGuide[] = [
  {
    zone: "neck",
    label: "Cuello",
    shortLabel: "Cuello",
    tier: "essential",
    landmark: "Justo debajo de la nuez (prominencia laríngea), cinta perpendicular al eje del cuello.",
    soloCues: [
      "Mira al frente con hombros sueltos y verifica en el espejo lateral que la cinta no suba por la nuca.",
      "Sujeta el cruce al frente sin comprimir la piel: debe caber la yema de un dedo sin holgura.",
    ],
    assistedCues: [
      "Mantén la vista horizontal y los brazos relajados a los costados sin elevar los trapecios.",
      "Quien asiste se ubica de perfil y lee la marca a nivel de ojos verificando el plano horizontal.",
    ],
    duoTip: "Pídele que confirme de costado que la cinta quede recta bajo la nuez mientras respiras normal.",
  },
  {
    zone: "waist",
    label: "Cintura",
    shortLabel: "Cintura",
    tier: "essential",
    landmark: "A nivel del ombligo (o punto medio entre última costilla y cresta ilíaca, siempre igual).",
    soloCues: [
      "Rodea el abdomen desnudo y revisa en el espejo lateral que la cinta no caiga en la zona lumbar.",
      "Inhala normal, suelta el aire con calma y lee al final de una exhalación suave sin meter panza.",
    ],
    assistedCues: [
      "Separa levemente los brazos para pasar la cinta, luego bájalos relajados antes de la lectura.",
      "El asistente comprueba desde el costado que el borde de la cinta esté paralelo al piso.",
    ],
    duoTip: "Conversar dos segundos antes de leer ayuda a soltar la tensión abdominal involuntaria.",
  },
  {
    zone: "hip",
    label: "Cadera",
    shortLabel: "Cadera",
    tier: "essential",
    landmark: "Perímetro horizontal sobre el punto de mayor proyección posterior de los glúteos.",
    soloCues: [
      "Junta los pies con peso simétrico y usa el espejo lateral para ubicar la cima glútea exacta.",
      "Desliza la cinta sin apretar tejido blando y confirma que el frente y la parte trasera estén al mismo nivel.",
    ],
    assistedCues: [
      "Permanece erguido con pies juntos y glúteos relajados; quien asiste siempre se sitúa al costado.",
      "El asistente alinea la cinta con la máxima prominencia posterior y toma la lectura lateral.",
    ],
    duoTip: "Ubicarse al costado resulta más cómodo para ambos y garantiza una línea horizontal perfecta.",
  },
  {
    zone: "shoulders",
    label: "Hombros",
    shortLabel: "Hombros",
    tier: "complete",
    landmark: "Contorno externo más ancho sobre la prominencia lateral de ambos deltoides.",
    soloCues: [
      "Coloca la cinta rodeando ambos deltoides frente al espejo, baja los codos al costado y suelta el pecho.",
      "Evita sacar pecho o arquear la espalda; mide con respiración tranquila para no inflar el dato.",
    ],
    assistedCues: [
      "Deja caer ambos brazos relajados a los lados mientras el asistente posiciona la cinta sobre los deltoides.",
      "Quien asiste verifica que la cinta no resbale por la espalda alta antes de cerrar la lectura.",
    ],
    duoTip: "Hombros es la zona donde más suma tu Dúo: evita que tenses un brazo al sostener la cinta.",
  },
  {
    zone: "chest",
    label: "Pecho / Torso",
    shortLabel: "Pecho",
    tier: "complete",
    landmark: "Línea media esternal (altura de pezones o cuarto espacio intercostal), pasando bajo las axilas.",
    soloCues: [
      "Pasa la cinta bajo las axilas, baja los brazos a los costados y comprueba el nivel en el espejo.",
      "Toma el valor al terminar una exhalación tranquila, sin expandir la caja torácica.",
    ],
    assistedCues: [
      "Levanta los brazos solo para cruzar la cinta y déjalos descansar sueltos antes de medir.",
      "El asistente nivela el tramo posterior sobre las escápulas y lee desde el lateral.",
    ],
    duoTip: "Que revise que la cinta no quede atrapada en el pliegue axilar al bajar tus brazos.",
  },
  {
    zone: "biceps",
    label: "Bíceps",
    shortLabel: "Bíceps",
    tier: "complete",
    landmark: "Punto medio exacto entre el acromion del hombro y el pliegue del codo (mismo brazo siempre).",
    soloCues: [
      "Ubica la mitad entre hombro y codo frente al espejo y rodea el brazo sin inclinar la cinta.",
      "Registra siempre del mismo modo (brazo relajado colgando o a 90°) y en el mismo lado dominante.",
    ],
    assistedCues: [
      "Deja el brazo colgando relajado al costado para obtener un perímetro limpio y repetible.",
      "El asistente localiza la mitad del húmero y pasa la cinta perpendicular al eje del brazo.",
    ],
    duoTip: "Con brazo suelto al costado y lectura asistida eliminas la variación por ángulo de flexión.",
  },
  {
    zone: "thigh",
    label: "Muslo medio",
    shortLabel: "Muslo",
    tier: "complete",
    landmark: "Mitad de distancia entre el pliegue inguinal y el borde superior de la rótula.",
    soloCues: [
      "De pie con el peso repartido 50/50 en ambos pies, rodea el muslo sin bloquear la rodilla.",
      "Verifica en el espejo lateral que la cinta no descienda por la cara posterior del isquiotibial.",
    ],
    assistedCues: [
      "Mantén el tronco erguido sin inclinarte a mirar hacia abajo (inclinarse tensa el cuádriceps).",
      "El asistente se agacha al costado, nivela la cinta a media altura y lee a nivel de ojos.",
    ],
    duoTip: "Al no tener que agacharte tú, el cuádriceps queda totalmente relajado y la medida es exacta.",
  },
  {
    zone: "calf",
    label: "Gemelo / Pantorrilla",
    shortLabel: "Gemelo",
    tier: "complete",
    landmark: "Perímetro horizontal máximo en la zona más ancha del vientre del gastrocnemio.",
    soloCues: [
      "Apoya toda la planta del pie en el suelo o en un escalón estable sin elevar el talón.",
      "Desliza suavemente arriba y abajo un centímetro para confirmar el punto de mayor perímetro.",
    ],
    assistedCues: [
      "Permanece de pie erguido con ambas plantas apoyadas y pantorrillas libres de tensión.",
      "Quien asiste busca el diámetro máximo desde el costado manteniendo la cinta horizontal.",
    ],
    duoTip: "Un segundo par de ojos encuentra el punto más ancho del gemelo en menos de cinco segundos.",
  },
];

export function getMeasurementSvgPath(
  zone: MeasurementZone,
  mode: MeasurementMode
): string {
  return `/measurements/${zone}-${mode}.svg`;
}

export function getMeasurementGuide(zone: MeasurementZone): MeasurementGuide {
  return (
    MEASUREMENT_GUIDES.find((guide) => guide.zone === zone) ??
    MEASUREMENT_GUIDES[0]
  );
}
