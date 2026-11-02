# War Infection — Fase 12

## Corrección de navegación

El problema anterior consistía en coordinar desde varias escenas operaciones de Phaser encoladas: el overlay notificaba una acción, se detenía, reanudaba `GameScene`, y luego `GameScene` intentaba ejecutar el reinicio o el regreso al menú en su siguiente actualización. La Fase 12 elimina esa cadena para las acciones que sustituyen el flujo.

Se agregó `src/systems/SceneNavigation.ts`:

1. Detecta la escena modal que originó la acción.
2. Consulta `isActive` e `isPaused` para las escenas de juego conocidas.
3. Detiene las escenas de juego que estén activas o pausadas, sin detener dos veces la escena modal actual.
4. Arranca `GameScene` para reiniciar o `MainMenuScene` para salir desde una única escena de origen.

`GameMenuScene` usa este router para Reiniciar y Menú principal, tanto en pausa como en Game Over. `CheckpointScene` conserva el evento/respawn ya validado para Reintentar horda, pero usa el router para volver al menú. `VictoryScene` también usa el router para salir al menú. Continuar conserva `stop(overlay) + resume(GameScene)` porque en ese caso no se abandona ni reemplaza la partida.

## Tiles y ambientación

Se eliminaron los props genéricos de Fase 11 (sanitizador e infraestructura) y se sustituyeron por objetos específicos del paquete de tiles, usando `UseCaseExample.png` como referencia de composición.

- **Con colisión:** Foam-Nozzle, variantes Small-wall-foam, Meged-wall-foam, Old-climate-control-surface/base y Ventilation-surface/base. Se crean en `obstacles` y se ejecuta `refreshBody()`.
- **Sin colisión:** Lattice, Hole y Ventilator. Son detalles de piso con blend `SCREEN`; no se agregan a `obstacles` ni bloquean la linterna.
- **Suciedad de piso:** Floor-dots-texture y Floor-grunge-texture 1/2 con blend `MULTIPLY`, alfa bajo y posiciones/rotaciones reproducibles.
- Los elementos decorativos se distribuyen por las nueve salas; los props sólidos se distribuyen por las siete salas de campaña. La arena final continúa sin barricadas.

## Validación ejecutada

- `npm test`: 68/68 pruebas aprobadas.
- Sintaxis TypeScript: 29 archivos transpilados con TypeScript 5.8.3; 0 diagnósticos sintácticos.
- Verificación de archivos: se revisaron rutas de todos los PNG usados por las nuevas claves.
- No se pudo completar `npm install` en el entorno y, por tanto, no se pudo ejecutar el chequeo global de tipos (`npm run typecheck`) ni Vite build.

## Pruebas manuales de aceptación

1. Pausa: Continuar, Reiniciar partida y Menú principal.
2. Game Over: Reintentar y Regresar al menú.
3. Checkpoint: Reintentar horda y Regresar al menú.
4. Victoria: Regresar al menú; después iniciar otra partida sin refrescar.
5. Verificar colisión física de props Foam, Old-climate y Ventilation-surface.
6. Verificar que Lattice, Hole, Ventilator y las manchas de Floor no producen colisión ni bloquean la iluminación.
7. Verificar que la arena de extracción permanece despejada.
