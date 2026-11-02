# War Infection — Fase 13

## Navegación desde los overlays

La Fase 12 seguía congelándose en las acciones destructivas durante las pruebas del usuario. En la Fase 13 se eliminó el router invocado desde la propia escena modal y se añadió `SceneRouterScene`, persistente durante toda la sesión.

- `BootScene` inicia el router antes de continuar la precarga.
- Los overlays emiten `war-infection:navigate` mediante `game.events`.
- El router detiene `GameScene`, overlays y escenas del flujo inicial que estén activas, pausadas o dormidas.
- El destino se abre con `ScenePlugin.run()` desde el router, que permanece activo y no se destruye durante la operación.
- Continuar desde pausa y Reintentar horda conservan las rutas ya validadas.

## Reducción de colisiones físicas

Se reducen a cinco los obstáculos añadidos a `obstacles` en salas de campaña:

- 2 coberturas pequeñas.
- 3 props compactos de tiles: Foam-Nozzle, Old-climate-control-surface y Ventilation-surface.

Las props se colocan en tres habitaciones distintas, alejadas de los centros de aparición. Las coberturas se limitan a dos habitaciones distintas. La arena permanece despejada.

No se modifican los objetos decorativos sin colisión: Lattice, Hole, Ventilator y las texturas Floor siguen dibujándose sobre el piso.

La función `getObjectBounds` prioriza `body.x/y/width/height` para que los cálculos de oclusión y línea de visión respeten el área física real.

## Velocidad de persecución

Se agrega `PHASE13_EARLY_PURSUIT_MULTIPLIER = 1.25` a las bandas 0 y 1 (`roomIndex <= 4`). Se aplica exclusivamente a `moveSpeed`, antes del aumento global de Fase 9. No modifica `patrolSpeed` ni `fireRateMs`.

## Validación ejecutada

- `npm test`: 71/71 pruebas aprobadas.
- Pruebas nuevas: router persistente, navegación global, escenas activas/pausadas/dormidas, 25% de persecución en las dos primeras bandas y reducción a cinco obstáculos físicos.
- Transpilación sintáctica TypeScript: 30 archivos transpilados con TypeScript 5.8.3, sin diagnósticos sintácticos.
- `npm run typecheck` y `npm run build`: no certificados porque `npm install` falló al resolver `registry.npmjs.org` (`EAI_AGAIN`); deben ejecutarse localmente con dependencias instaladas.

## Pruebas manuales de aceptación

1. Pausa: Continuar, Reiniciar partida y Menú principal.
2. Game Over: Reintentar y Regresar al menú.
3. Checkpoint: Reintentar horda y Regresar al menú.
4. Victoria: Regresar al menú e iniciar una nueva partida sin refrescar.
5. Confirmar que permanecen cinco objetos físicos pequeños y que no bloquean rutas de persecución.
6. Confirmar que Lattice, Hole, Ventilator y Floor continúan sin colisión.
7. Comparar velocidad de persecución de enemigos de primeras y segundas bandas; su cadencia de disparo debe mantenerse igual.
