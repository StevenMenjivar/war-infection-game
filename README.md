# War Infection

Videojuego 2D top-down shooter de supervivencia militar, desarrollado con Phaser 3, TypeScript y Vite.

## Requisitos

- Node.js 20.19+ o 22.12+ (compatible con Vite 8).
- npm.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre la URL local que muestra Vite.

## Comandos de validación

```bash
npm test
npm run typecheck
npm run build
```

## Estado de implementación

- **Fase 1:** inspección y arquitectura de recursos.
- **Fase 2:** configuración de Phaser/Vite/TypeScript y carga de recursos.
- **Fase 3:** menú, captura de nombre, prólogo y controles iniciales.
- **Fase 4:** mapa procedural de nueve salas, pasillos, paredes, coberturas y colisiones.
- **Fase 5:** perfiles de armas, disparo automático al mantener clic, proyectiles reutilizables con alcance, colisiones de proyectiles, enemigos armados, patrullaje/seguimiento/búsqueda, línea de visión y mira láser bloqueadas por obstáculos, mantenimiento de distancia, separación, barras de vida, daño, partículas, transición de muerte y Game Over.

## Controles

- **WASD:** movimiento omnidireccional.
- **Mouse:** apuntar.
- **Clic izquierdo sostenido:** disparar.
- **ESC:** pausar/reanudar.

El jugador comienza con la Carabina M416. La configuración de Benelli M4 y Minigun ya está centralizada para que la Fase 6 pueda cambiar de arma al evolucionar el personaje. La munición es infinita.

## Alcance de la Fase 5

Se generan dos enemigos por cada una de siete salas de combate (14 enemigos iniciales). Cada enemigo utiliza `zombie_soldier_1.png`, patrulla en su sala, detecta al jugador, comprueba línea de visión, busca una posición alternativa, se aproxima o retrocede según la distancia y dispara cuando tiene una trayectoria libre. Los enemigos no atacan cuerpo a cuerpo.

La salud del jugador se incluye como soporte funcional del combate enemigo. Los botiquines, las evoluciones y la dificultad progresiva se mantienen para la Fase 6.

## Estructura principal

```text
src/
  config/       Configuración general, armas y balance
  entities/     Entidades del juego (enemigos)
  managers/     Gestores
  scenes/       Escenas Phaser
  systems/      Generación procedural, geometría y sistemas de juego
  utils/        Utilidades
assets/images/  Recursos gráficos originales
 tests/         Pruebas automatizadas
```
