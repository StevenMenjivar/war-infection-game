# War Infection — Fase 10: validación

## Cambios incluidos

- Pausa y Game Over: botones renderizados como objetos independientes, fijados a cámara (`scrollFactor = 0`), con la propia superficie visible como hit-area interactiva. Se evita depender de la transformación de un contenedor mientras la cámara sigue al jugador.
- Transiciones desde pausa y Game Over: los callbacks restauran reloj, física y tweens antes de reiniciar o cambiar al menú.
- Reentrada al prólogo: se restablece el índice de diálogo, el contador de palabras, el estado de escritura y el temporizador. Los listeners `keydown-ENTER` se limpian al apagar la escena; el inicio de GameScene se protege contra dobles activaciones.
- NameInput: evita envíos duplicados por eventos repetidos de Enter.
- Extracción: se eliminaron las barricadas y obstáculos físicos centrales. Las coberturas de las habitaciones de campaña se mantienen.
- Campaña ampliada: 4 enemigos por sala en 7 salas (28 iniciales); después aparecen 26 refuerzos. La arena se desbloquea al acumular 54 bajas de campaña. Los hitos de evolución siguen siendo 11 y 27 bajas.
- Limpieza: al apagar GameScene se eliminan listeners, temporizadores, tweens, referencias del pool y objetos de pausa.

## Validaciones ejecutadas

- `npm test`: 51 pruebas aprobadas, 0 fallidas.
- Transpilación sintáctica TypeScript: 27 archivos, 0 diagnósticos.
- Ejecución directa de la lógica del mapa y configuración: 9 habitaciones, ruta inicio-extracción conectada, 28 enemigos iniciales + 26 refuerzos = 54.
- ZIP: integridad comprobada después de empaquetar.

## Validaciones pendientes

No se pudo completar `npm install` en este entorno (agotó el tiempo disponible). Por esa razón no se certifica `npm run typecheck`, `npm run build` ni una sesión real de navegador. Deben ejecutarse en el equipo local tras instalar dependencias.

## Comandos

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

## Pruebas manuales recomendadas

1. Abrir pausa con ESC y probar Continuar, Reiniciar partida y Menú principal con clic.
2. Morir fuera de la horda y probar Reintentar y Regresar al menú con clic.
3. Completar la partida, volver al menú, comenzar otra, ingresar otro nombre, avanzar el prólogo e iniciar la segunda campaña sin refrescar el navegador.
4. Confirmar que la sala de extracción está despejada y no tiene barricadas físicas.
5. Contar 28 enemigos iniciales, confirmar 26 refuerzos tras las 28 bajas y desbloquear la arena al completar 54.
6. Verificar que las oleadas 12/24/50, el checkpoint y la victoria mantienen su comportamiento validado en Fase 9.
