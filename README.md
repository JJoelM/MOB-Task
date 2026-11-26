# MOB — Hábitos, Misiones, Fuerza y Vínculos

Aplicación multiplataforma (**Teléfono y PC**) para construir hábitos, planificar el día sin rigidez, seguir tu evolución física real y sostener el impulso en **Dúo** (pareja/mejor amigo) y **Crew** (amigos), diseñada bajo principios de la **Teoría de la Autodeterminación (SDT)** y progresión viva estilo Rockstar + claridad funcional Dieter Rams.

## Ejecutar en Desarrollo y Pruebas

```bash
npm install
npm run dev
```

Para ejecutar la suite automatizada de dominio y exportación (Vitest) y verificar el build de producción:

```bash
npm test
npm run build
```

Abre `http://localhost:3000` en tu PC o desde tu teléfono en la misma red local (también puedes instalarla como PWA desde el navegador).

## Características Principales

- **Funcionalismo Cálido y Táctil:** Paleta papel piedra (`#F6F5F0`) y carbón mate (`#141413`) con soporte nativo `light-dark()`, números tabulares escaneables en 1 segundo y física de resortes sin neón estridente.
- **Ciclo `MOB 0% → 100%` y Bitácora de Momentos 100%:** Cada hábito, misión, serie de fuerza o gesto cooperativo carga tu medidor **MOB** alimentando 4 motores emocionales (**Determinación**, **Coraje**, **Vínculo** y **Claridad**). Al llegar a `100%`, detona una descarga cinética con **Escudo de Inercia por 24 h**, impulso directo a tu Dúo/Crew y registro permanente en tu **Bitácora de Momentos 100%**.
- **Sello `Misión Superada` y Cierre del Día en 1 Toque:** Al completar una Misión Principal, un nuevo PR de fuerza o una Operación Dúo aparece un sello táctil no intrusivo con tu salto de carga MOB. Al final de la jornada, el **Resumen de Cierre del Día** muestra tus medallas, tareas, series de Gym, distancia al próximo `100%` y permite dejar lista tu **Misión Principal #1 de mañana** (`+4% MOB`).
- **Operaciones en Dúo por Etapas y Respeto *Club de Mejora*:** Misiones cooperativas de 1 a 3 días divididas en relevos tácticos entre tú y tu Dúo (`Operación Doble Turno`, `Golpe Cero Excusas 48h`, `Sincronía Cuerpo y Mente`), más botón diario de **Enviar Respeto** en Dúo y Crew bajo la filosofía *Club de Mejora* (incluso 1 Bronce asegura cero días perdidos).
- **Medallas Bronce · Plata · Oro + Inercia (SDT):** Cada hábito tiene un piso mínimo viable (Bronce) que protege tu impulso en días pesados; la barra de **Inercia** reemplaza las rachas punitivas que caen a cero.
- **Audio Táctil Corto Compatible con tu Música:** Efectos sintéticos breves vía Web Audio API (toques mate, medallas, campana armónica de cierre y secuencia ascendente al `100%`) sin pistas de fondo continuas, permitiendo entrenar o estudiar con Spotify/YouTube Music sin interrupciones.
- **Motor Anti-Aplazamiento y Modo En Misión:** Al pulsar `¿Aplazar?` puedes activar el **Modo 2 Minutos (Bronce)**, **dividir en 3 micro-pasos**, pedir **SOS Co-op de 15m a tu Dúo**, o reprogramar sin culpa, junto con temporizador enfocado.
- **Registro de Fuerza en 3 Segundos (`Fuerza / Gym`):** Cargas progresivas sin plantillas rígidas obligatorias, botones táctiles rápidos (`Repetir última`, `+2.5 kg y Registrar`), cálculo en vivo de **1RM estimado (Epley)**, volumen y detección automática de récords personales (**PR**).
- **Cuerpo y Medidas con Guías SVG (`Solo` vs `Con asistencia`):** Check-in antropométrico 100% privado con 16 ilustraciones técnicas de cinta métrica (frente al espejo o asistido junto a tu Dúo/amigo), estimación **% Grasa US Navy**, relación cintura-altura (**WHtR**) y diagnóstico funcional SDT sin juicios estéticos.
- **Tablas y Estadísticas de Evolución (`Tablas e Historial`):** Vista longitudinal en 2 capas (tarjetas de Δ + curva minimalista SVG interactiva arriba; tabla responsiva con `@container` queries, encabezados fijos y **Exportar CSV** abajo) para Hábitos, Fuerza y Cuerpo en ventanas de `4 sem`, `3 meses` o `Todo`.
- **Siguiente Etapa Lista:** Esquema SQL (`supabase/schema.sql`) y adaptadores preparados para **USDA FoodData Central / Open Food Facts** y **Google Health Connect** vía Capacitor.
