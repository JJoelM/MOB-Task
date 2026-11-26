# MOB — Hábitos, Misiones, Fuerza y Vínculos

Aplicación multiplataforma (**Teléfono y PC**) para construir hábitos, planificar el día sin rigidez, seguir tu evolución física real y sostener el impulso en **Dúo** (pareja/mejor amigo) y **Crew** (amigos), diseñada bajo principios de la **Teoría de la Autodeterminación (SDT)** y progresión viva estilo GTA.

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

- **Funcionalismo Cálido y Táctil:** Paleta papel piedra (`#F6F5F0`) y carbón mate (`#141413`) con soporte nativo `light-dark()`, números tabulares escaneables en 1 segundo y física de resortes.
- **Medallas Bronce · Plata · Oro + Inercia (SDT):** Cada hábito tiene un piso mínimo viable (Bronce) que protege tu impulso en días pesados; la barra de **Inercia** reemplaza las rachas punitivas que caen a cero.
- **Motor Anti-Aplazamiento y Modo En Misión:** Al pulsar `¿Aplazar?` puedes activar el **Modo 2 Minutos (Bronce)**, **dividir en 3 micro-pasos**, pedir **SOS Co-op de 15m a tu Dúo**, o reprogramar sin culpa, junto con temporizador enfocado y ruido marrón vía Web Audio API.
- **Registro de Fuerza en 3 Segundos (`Fuerza / Gym`):** Cargas progresivas sin plantillas rígidas obligatorias, botones táctiles rápidos (`Repetir última`, `+2.5 kg y Registrar`), cálculo en vivo de **1RM estimado (Epley)**, volumen y detección automática de récords personales (**PR**).
- **Cuerpo y Medidas con Guías SVG (`Solo` vs `Con asistencia`):** Check-in antropométrico 100% privado con 16 ilustraciones técnicas de cinta métrica (frente al espejo o asistido junto a tu Dúo/amigo), estimación **% Grasa US Navy**, relación cintura-altura (**WHtR**) y diagnóstico funcional SDT sin juicios estéticos.
- **Tablas y Estadísticas de Evolución (`Tablas e Historial`):** Vista longitudinal en 2 capas (tarjetas de Δ + curva minimalista SVG interactiva arriba; tabla responsiva con `@container` queries, encabezados fijos y **Exportar CSV** abajo) para Hábitos, Fuerza y Cuerpo en ventanas de `4 sem`, `3 meses` o `Todo`.
- **Dúo (1-a-1) y Crew (Amigos):** Sincronía diaria, toques rápidos en vivo (`BroadcastChannel` + Supabase Realtime) y retos grupales cuidando la privacidad de tus tareas y medidas personales.
- **Siguiente Etapa Lista:** Esquema SQL (`supabase/schema.sql`) y adaptadores preparados para **USDA FoodData Central / Open Food Facts** y **Google Health Connect** vía Capacitor.
