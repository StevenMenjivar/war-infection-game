# War Infection — Fase 11

## Correcciones

1. **Pausa y Game Over:** menús alojados en `GameMenuScene`, con hit areas propias y callbacks de puntero. Las acciones se comunican a `GameScene`; la escena se reanuda antes de ejecutar `restart()` o `start('MainMenuScene')`.
2. **Victoria:** la escena se abre como overlay una vez que `HordeWaveSystem.isComplete()` confirma que la última oleada terminó. Se protege la transición contra ejecuciones duplicadas.
3. **HUD de armamento:** muestra los PNG de `m416`, `benelli_m4` y `minigun` con recorte de transparencia y actualiza el icono según el arma equipada.
4. **Props con colisión:** ventilación, climatización, sanitizador, boquilla de espuma e infraestructura de los tiles originales se insertan en el grupo de obstáculos de salas de campaña. Sus cuerpos estáticos intervienen en las colisiones y en los sistemas que consultan obstáculos.
5. **TypeScript:** removida la propiedad `add` no admitida por `Graphics.Options`; centralizado el uso de `getBounds()` mediante un cast estrecho; callbacks Arcade reciben argumentos de tipo amplio y luego verifican los grupos; color de texto convertido a string y variable no usada eliminada.

## Resultados

- Pruebas automatizadas: **58/58 aprobadas** (`npm test`).
- Transpilación sintáctica: **28 archivos TypeScript, 0 diagnósticos**.
- ZIP verificado con `unzip -t`.
- **No verificado:** typecheck y build completo. `npm install` no pudo acceder al registro de npm en el entorno (`EAI_AGAIN registry.npmjs.org`).

## Comandos locales

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```
