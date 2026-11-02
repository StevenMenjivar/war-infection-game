# War Infection — Fase 3

Videojuego web top-down shooter en Phaser 3 + TypeScript + Vite.

## Requisitos
- Node.js 20.19+ o 22.12+ (requerido por Vite 8).
- npm.

## Instalación y ejecución
```bash
npm install
npm run dev
```

## Validación
```bash
npm run typecheck
npm run build
npm test
```

## Flujo implementado en esta fase
1. Boot y precarga de recursos.
2. Menú principal con estética militar/terror y botón **Jugar ahora**.
3. Ingreso de nombre (3–18 caracteres, letras, números, espacios, guion y guion bajo); Enter confirma y Escape vuelve al menú.
4. Prólogo con el diálogo especificado, palabra por palabra. Enter completa la línea actual o avanza a la siguiente.
5. Escena de entrenamiento con soldier_1, movimiento WASD normalizado, orientación al cursor, cámara de seguimiento y pausa con Escape.

## Alcance pendiente
La escena de entrenamiento todavía no representa la campaña: mapa procedural, colisiones con paredes/objetos, combate, enemigos, HUD definitivo, linterna, progresión, oleadas y finales se implementarán en fases posteriores. La pantalla `AssetPreviewScene` se conserva para inspección manual, pero ya no es la escena inicial.
