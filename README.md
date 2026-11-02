
# War Infection

  

Videojuego 2D top-down shooter de supervivencia militar, desarrollado con Phaser 3, TypeScript y Vite.

  

## Requisitos

  

- Node.js 20.19+ o 22.12+ (compatible con Vite 8).

- npm.

  

## Ejecutar localmente

  

```bash

npm install

npm run  dev

```

  

Abre la URL local que muestra Vite.

  

## Comandos de validación

  

```bash

npm test

npm run  typecheck

npm run  build

```

  

## Estado de implementación

  

-  **Fase 1:** inspección y arquitectura de recursos.

-  **Fase 2:** configuración de Phaser/Vite/TypeScript y carga de recursos.

-  **Fase 3:** menú, captura de nombre, prólogo y controles iniciales.

-  **Fase 4:** mapa procedural de nueve salas, pasillos, paredes, coberturas y colisiones.

-  **Fase 5:** perfiles de armas, disparo automático, proyectiles reutilizables, enemigos armados, IA, línea de visión, separación, barras de vida, daño y Game Over.

-  **Fase 6:** corrección del orden de argumentos en colisiones de proyectiles enemigos; salud del jugador y HUD; objetos de evolución; cambio entre los tres soldados y sus armas; botiquines; refuerzos para alcanzar los hitos de evolución; dificultad progresiva por salas.

-  **Fase 7:** iluminación ambiental progresiva por capas; linterna apagada inicialmente y alternable con L; cono de 62° con alcance configurable y oclusión por paredes/coberturas; sombras simuladas; niebla y partículas de polvo; destellos de disparo visibles en la oscuridad; fallback para Canvas.

-  **Fase 8:** oscuridad ambiental reforzada con linterna apagada; respuesta enemiga adaptativa a la evolución del jugador; pausa con continuar/reiniciar/menú; Game Over con reintento/menú; pantalla de victoria reutilizable; sistema de checkpoint con reaparición al 50% de salud máxima.

-  **Fase 9:** arena final amplia conectada al mapa procedural; entrada al completar la campaña; tres oleadas (12, 24 y 50 enemigos simultáneos); refuerzos desde cuatro direcciones; presión enemiga global de +50% en velocidad y frecuencia de disparo, con escalado adicional por oleada y personaje; CheckpointScene que reinicia solo la horda conservando personaje, punto de control y 50% de salud máxima; transición a victoria al despejar la última oleada.

-  **Fase 10:** botones de pausa y Game Over fijados a cámara e interactivos fuera de contenedores; reinicio integral del prólogo y sus listeners al volver a jugar después de una victoria; eliminación de obstáculos/barricadas de la extracción; campaña duplicada a 28 enemigos iniciales + 26 refuerzos (54 en total); revisión de reinicios y limpieza de eventos/temporizadores.

  

## Controles

  

-  **WASD:** movimiento omnidireccional.

-  **Mouse:** apuntar.

-  **Clic izquierdo sostenido:** disparar.

-  **L:** encender/apagar linterna.

-  **ESC:** pausar/reanudar.

  
  

## Iluminación y ambientación (Fase 7)

  

La escena mantiene iluminación ambiental reducida incluso con la linterna apagada. La iluminación disminuye gradualmente mediante tres capas de oscuridad alrededor del jugador; no se convierte el mapa en una pantalla negra. La linterna comienza apagada y se alterna con **L**. Su haz sigue la misma dirección del apuntado, tiene apertura fija de 62° y alcance configurado en `src/config/LightingConfig.ts`.

  

En WebGL, las áreas iluminadas se recortan mediante máscaras geométricas invertidas. El polígono del haz se calcula con rayos que terminan en el primer muro o cobertura, incluyendo rayos adicionales en las esquinas para reducir fugas de luz. En Canvas se usa un modo alternativo de menor contraste con el mismo cono geométrico dibujado; la oclusión visual es más aproximada que en WebGL.

  

Se añadieron sombras desplazadas en paredes y coberturas, niebla translúcida en algunas salas, motas de polvo animadas y destellos de disparo por encima de las capas de oscuridad. Las mecánicas de combate, apuntado, movimiento, colisiones y progresión permanecen intactas.

  

## Progresión de personaje

  

| Personaje | Bajas necesarias | Arma | Salud máxima |

|---|---:|---|---:|

| Soldado I | Inicio | M416 (1x) | 150 |

| Soldado II | 11 | Benelli M4 (2x) | 210 |

| Soldado III | 27 acumuladas | Minigun (3x) | 270 |

  

Al alcanzar 11 o 27 bajas aparece el objeto de evolución correspondiente. El objeto permanece en el escenario hasta recogerlo; recoger el segundo antes que el primero no genera retrocesos de personaje. Evolucionar aumenta la salud máxima, pero conserva la salud actual.

  

Los botiquines restauran el 35% de la salud máxima actual, sin superar el límite. Hay cinco ubicaciones iniciales elegidas a partir de las habitaciones del mapa procedural; si la salud está completa, el botiquín no se consume.

  

## Dificultad progresiva

  

Las siete salas de combate usan tres bandas. Las primeras dos salas mantienen los valores base; las tres intermedias incrementan moderadamente resistencia, movilidad, detección y presión de disparo; las dos últimas aumentan esos parámetros de nuevo y mejoran la precisión enemiga. En la versión de Fase 10, tras eliminar los 28 objetivos iniciales se activa un refuerzo de 26 enemigos. El segundo hito de evolución continúa en la baja 27 y la arena se desbloquea al completar las 54 bajas de campaña.

  

## Corrección del impacto al jugador

  

El callback de los proyectiles enemigos ya no supone que Phaser entregue primero el proyectil. Identifica el objeto que no es el jugador por referencia y comprueba que pertenece al grupo de proyectiles enemigos antes de desactivarlo. El jugador solo pierde salud a través de `damagePlayer`, que actualiza `HEALTH` en el HUD. Se incluye una breve ventana de invulnerabilidad de 450 ms para evitar que una sola superposición de proyectiles reste vida repetidamente.

  

## Inventario de recursos

  

La entrega conserva los **86 PNG originales**: 3 soldados, 1 enemigo, 3 armas, 1 efecto de sangre y 78 tiles. Se organizan en `assets/images/soldiers`, `enemies`, `guns`, `animations` y `tiles`. No se sustituyeron ni eliminaron recursos de arte originales en esta fase.

  

## Estructura principal

  

```text

src/

config/ Configuración general, armas, progresión y dificultad

entities/ Entidades del juego (enemigos)

managers/ Gestores

scenes/ Escenas Phaser

systems/ Generación procedural, geometría, colisiones y progresión

utils/ Utilidades

assets/images/ Recursos gráficos originales

tests/ Pruebas automatizadas

```

  
  

## Iluminación reforzada (Fase 8)

  

Con la linterna apagada, el radio de visibilidad ambiental se reduce y las capas de oscuridad aumentan su opacidad. Solo se conserva una zona pequeña alrededor del operador para mantener orientación. Al encenderla, se amplían los radios ambientales y el cono ocluido recupera protagonismo. El fallback Canvas usa niveles de oscuridad diferenciados para ambos estados.

  

## Respuesta enemiga a la evolución (Fase 8)

  

La evolución del operador eleva la presión de los hostiles existentes y de los que aparezcan posteriormente:

  

| Personaje del jugador | Velocidad de persecución enemiga | Frecuencia de disparo enemiga |

|---|---:|---:|

| Soldado I | Base | Base |

| Soldado II | +12% | +14% |

| Soldado III | +25% | +35% |

  

Los porcentajes se aplican al movimiento de persecución/búsqueda y a la cadencia. La velocidad máxima del cuerpo físico también se actualiza para que Arcade Physics no limite el incremento.

  

## Menús, pausa y finales (Fase 8)

  

- El flujo principal conserva Menú → Ingreso de nombre → Prólogo → Partida.

- Al reingresar a NameInput, el campo vuelve a iniciar vacío. El nombre se valida (3–18 caracteres) y se confirma con Enter.

- ESC abre una pausa modal con Continuar, Reiniciar partida y Menú principal. Se pausa física, reloj de escena y tweens; los elementos de interfaz permanecen interactivos.

- Game Over ofrece Reintentar y Regresar al menú.

-  `VictoryScene` contiene el texto de victoria solicitado y el retorno al menú. En Fase 9 se conecta al completar la última oleada de la horda.

-  `CheckpointSystem` captura posición, personaje, salud máxima y bajas; en Fase 9 se activa al entrar a la arena y se conecta con `CheckpointScene` para reiniciar únicamente la horda al 50% de salud máxima.

  

## Controles actualizados

  

-  **ESC:** abrir/cerrar el menú de pausa. Desde el menú, elegir Continuar, Reiniciar partida o Menú principal.

  
  

## Presión enemiga y oscuridad (Fase 9)

  

Todos los perfiles de hostiles reciben un aumento global del 50% en velocidad de movimiento y patrullaje, y un 50% de frecuencia de disparo (el intervalo de disparo se divide entre 1.5). Los incrementos que ya existían por profundidad de sala y por evolución del operador se aplican adicionalmente. En la horda, cada oleada incrementa gradualmente velocidad, frecuencia de fuego, resistencia y presión de proyectiles.

  

La iluminación se volvió más restrictiva: con la linterna apagada solo queda un radio local de 38/66/108 px y opacidad ambiental de oscuridad 0.64/0.74/0.82. Con la linterna encendida, el haz conserva 62° y 690 px de alcance, pero las zonas fuera del haz siguen notablemente oscuras. En Canvas se aplica un oscurecimiento de 0.88 apagada y 0.38 encendida.

  

## Arena final y checkpoint (Fase 9)

  

La sala 8 del mapa procedural se amplió a 20×14 celdas y el mapa a 64×48 celdas; se conserva la conectividad validada entre inicio y arena. Desde la Fase 10, el acceso a la horda se activa al llegar al centro de la arena después de completar las 54 bajas de campaña (28 iniciales y 26 refuerzos). Si el operador llega antes, se indica cuántos hostiles faltan.

  

La horda incluye tres oleadas de 12, 24 y 50 enemigos activos simultáneamente. Los enemigos aparecen dentro de la arena desde sus cuatro lados. En Fase 10 se eliminaron las barricadas de extracción, dejando el área despejada. El grupo de enemigos admite 64 entidades y reutiliza instancias junto con sus barras de vida mediante un pool; el pool de proyectiles enemigos se amplió a 220 para sostener la última oleada.

  

Al comenzar la arena se captura la posición, personaje, salud máxima y bajas de campaña. Si el jugador muere durante la horda, se muestra `CheckpointScene`; al reintentar se eliminan enemigos, proyectiles y temporizadores de la ejecución anterior, se conserva el personaje y el punto de control, y se restaura el 50% de la salud máxima. El reintento inicia de nuevo desde la primera oleada y no reinicia la campaña. Al eliminar a los 50 enemigos de la última oleada se abre `VictoryScene`.

  
  

## Optimización, flujo de sesiones y campaña ampliada (Fase 10)

  

- Los botones de pausa y Game Over se renderizan como objetos individuales fijados a cámara (`scrollFactor = 0`). La superficie rectangular visible es también la hit-area interactiva, evitando desajustes por cámara/zoom o contenedores.

- El prólogo reinicia índice de diálogo, estado de escritura y temporizador al entrar de nuevo. Los listeners `keydown-ENTER` se limpian al apagar la escena y el cambio a GameScene se protege contra doble transición. NameInput evita envíos duplicados.

- La extracción ya no tiene barricadas ni coberturas centrales; se conservan las coberturas de las habitaciones anteriores.

- Campaña: 4 enemigos por sala en 7 salas = 28 iniciales. Tras derrotarlos aparecen 26 refuerzos; la entrada a la arena requiere 54 bajas de campaña. Los hitos de evolución continúan en 11 y 27 bajas.

- Los botones de Game Over reintentan con estado limpio o regresan al menú; ambas acciones restauran reloj, física y tweens antes de cambiar escena. El menú de pausa elimina explícitamente sus objetos al continuar, reiniciar o volver al menú.

  

## Créditos

  

- Assets utilizados para el diseño: [Search Art | OpenGameArt.org](https://opengameart.org/art-search-advanced?field_art_tags_tid=Omnihunter) (Proyecto OMNIHUNTER).
- Herramientas utilizadas: 
	- **Phaser 3:** Motor de desarrollo de videojuegos 2D.
	- **TypeScript:** Lenguaje de programación.
	- **Visual Studio Code:** Entorno de desarrollo.
	- **GitHub:** Control de versiones.
	- **ChatGPT (OpenAI):** Herramienta de inteligencia artificial
  utilizada como apoyo en la estrategia, refinamiento de prompts, ejecución de instrucciones, resolución de problemas, y documentación del proyecto.
	- **Gemini:** Herramienta utilizada para la generación y modificación de sprites.
```
