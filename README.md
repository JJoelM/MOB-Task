# MOB — Hábitos, Misiones y Vínculos (MVP)

Aplicación multiplataforma (**Teléfono y PC**) para construir hábitos, planificar el día sin rigidez y sostener el impulso en **Dúo** (pareja/mejor amigo) y **Crew** (amigos), diseñada bajo principios de la **Teoría de la Autodeterminación (SDT)** y progresión viva estilo GTA.

## Ejecutar en Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en tu PC o desde tu teléfono en la misma red local (también puedes instalarla como PWA desde el navegador).

## Características del MVP

- **Funcionalismo Cálido y Táctil:** Paleta papel piedra (`#F6F5F0`) y carbón mate (`#141413`) con soporte nativo `light-dark()`, números tabulares escaneables en 1 segundo y física de resortes.
- **Medallas Bronce · Plata · Oro + Inercia (SDT):** Cada hábito tiene un piso mínimo viable (Bronce) que protege tu impulso en días pesados; la barra de **Inercia** reemplaza las rachas punitivas que caen a cero.
- **Motor Anti-Aplazamiento:** Al pulsar `¿Aplazar?` en cualquier tarea puedes activar el **Modo 2 Minutos (Bronce)**, **dividir en 3 micro-pasos**, pedir **SOS Co-op de 15m a tu Dúo**, o reprogramar sin culpa.
- **Modo En Misión:** Temporizador limpio a pantalla completa con ruido marrón ambiental generado vía Web Audio API.
- **Dúo (1-a-1) y Crew (Amigos):** Sincronía diaria, toques rápidos en un clic (funcionan en vivo entre pestañas con `BroadcastChannel` y entre dispositivos con Supabase Realtime) y retos grupales cuidando la privacidad de tus tareas personales.
- **Preparado para Fase 2:** Esquema SQL (`supabase/schema.sql`) y utilidades listas para antropometría científica (Fórmula US Navy + WHtR), APIs **USDA FoodData Central / Open Food Facts** y empaquetado con **Capacitor** para **Google Health Connect**.
