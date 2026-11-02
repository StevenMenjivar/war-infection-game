# DESARROLLO INTEGRAL DEL VIDEOJUEGO WAR INFECTION
## Phaser 3 + TypeScript

Actúa como un desarrollador senior especializado en videojuegos 2D, arquitectura de software, TypeScript, Phaser 3, inteligencia artificial para videojuegos, generación procedural de escenarios y optimización de rendimiento.

Tu objetivo es desarrollar un videojuego web completo llamado **War Infection**, siguiendo estrictamente las especificaciones funcionales, visuales y técnicas descritas en este documento.

No quiero únicamente una demostración visual, una prueba de concepto ni fragmentos aislados de código. Necesito un videojuego funcional, organizado, escalable, mantenible y ejecutable localmente.

Si tienes acceso al sistema de archivos, debes inspeccionar, crear y modificar directamente los archivos del proyecto. No te limites a describir lo que habría que hacer.

---

# 1. TECNOLOGÍAS Y ARQUITECTURA

Utiliza obligatoriamente:

- TypeScript.
- Phaser 3.
- Vite como herramienta de desarrollo y compilación, salvo que exista una razón técnica justificada para utilizar otra alternativa.
- HTML5, CSS y JavaScript/TypeScript.
- Git-friendly project structure.

El proyecto debe seguir una arquitectura orientada a componentes y sistemas, con separación estricta de responsabilidades.

Evita:
- Clases gigantes que concentren toda la lógica.
- Mezclar renderizado, física, inteligencia artificial y reglas de negocio.
- Dependencias circulares.
- Valores de balance dispersos por el código.
- Duplicación de lógica entre personajes y enemigos.
- Soluciones temporales que dificulten futuras modificaciones.

Diseña una arquitectura modular en la que las escenas coordinen sistemas especializados.

Como referencia, considera las siguientes responsabilidades:

- **Scenes:** administración de pantallas y flujo del juego.
- **Entities:** personajes, enemigos, proyectiles y objetos.
- **Components:** salud, movimiento, armas, orientación y estados.
- **Systems:** combate, IA, generación de mapas, iluminación, progresión y colisiones.
- **Managers:** recursos, audio, controles, HUD y configuración.
- **Config:** parámetros de balance, armas, enemigos, mapas y dificultad.
- **Utils:** geometría, cálculos, validaciones y funciones auxiliares.

La estructura final puede variar si existe una propuesta arquitectónica mejor, pero debe conservar la separación de responsabilidades.

## 1.1. Escenas principales

Implementa una estructura equivalente a:

1. BootScene: inicialización.
2. PreloadScene: carga y validación de recursos.
3. MainMenuScene: menú principal.
4. NameInputScene: ingreso del nombre.
5. PrologueScene: narrativa inicial.
6. GameScene: partida.
7. PauseScene o sistema de pausa integrado.
8. GameOverScene: derrota.
9. CheckpointScene: reintento de la horda final.
10. VictoryScene: victoria.

El flujo debe ser coherente y permitir regresar al menú e iniciar nuevas partidas sin recargar la página.

---

# 2. INSPECCIÓN OBLIGATORIA DEL PROYECTO Y LOS RECURSOS

Antes de implementar cualquier funcionalidad:

1. Inspecciona completamente la estructura actual del proyecto.
2. Revisa package.json y package-lock.json.
3. Identifica las dependencias instaladas.
4. Examina todos los recursos PNG disponibles.
5. Obtén las dimensiones originales de cada imagen.
6. Identifica sprites, tiles, objetos, armas, personajes y efectos.
7. Revisa el archivo UseCaseExample.png si está disponible.
8. Determina si los recursos corresponden a imágenes individuales, spritesheets o atlas.

La estructura inicialmente proporcionada es:

    WarInfection/
    ├── assets/
    │   ├── images/
    │   │   ├── animations/
    │   │   ├── enemies/
    │   │   ├── soldiers/
    │   │   ├── tiles/
    │   │   └── guns/
    │   └── audio/
    ├── node_modules/
    ├── src/
    ├── index.html
    ├── package.json
    └── package-lock.json

Esta estructura es una referencia inicial, no una garantía de que todos los directorios o archivos existan.

### Recursos principales esperados

**Personajes:**
- soldier_1.png
- soldier_2.png
- soldier_3.png

Ubicación esperada: assets/images/soldiers/

**Enemigos:**
- zombie_soldier_1.png

Ubicación esperada: assets/images/enemies/

**Animaciones:**
- blood.png

Ubicación esperada: assets/images/animations/

**Armas:**
- m416.png
- benelli_m4.png
- minigun.png

Ubicación esperada: assets/images/guns/

**Escenario:**
- Tiles PNG numerados y descriptivos ubicados en assets/images/tiles/.

### Reglas obligatorias para los recursos

- No inventes nombres de archivos.
- No asumas que todos los recursos mencionados existen.
- No reemplaces sprites existentes por dibujos genéricos sin justificación.
- No alteres las dimensiones originales de los archivos.
- Conserva la proporción de cada imagen.
- No deformes los sprites.
- No cambies arbitrariamente sus colores o apariencia.
- Identifica la función de cada recurso antes de utilizarlo.

Si un recurso esperado no existe, documenta su ausencia y utiliza un fallback procedural o gráfico coherente cuando sea necesario.

No permitas que la ausencia de un recurso provoque que el juego deje de funcionar.

Prepara un inventario de recursos con:
- Nombre del archivo.
- Ruta.
- Dimensiones.
- Tipo de recurso.
- Función prevista.
- Estado de disponibilidad.

Utiliza este inventario para construir un AssetManager o mecanismo equivalente.

---

# 3. CONCEPTO DEL VIDEOJUEGO

**War Infection** será un videojuego 2D de perspectiva top-down shooter, con temática de terror, supervivencia militar y combate contra soldados infectados.

El jugador deberá recorrer una instalación militar contaminada, atravesar habitaciones, pasillos y zonas de combate, eliminar enemigos, obtener mejoras y alcanzar una zona de extracción.

La duración aproximada de una partida debe ser de **10 minutos**.

La experiencia debe combinar:

- Exploración.
- Combate a distancia.
- Cobertura.
- Gestión de salud.
- Evolución de armamento.
- Dificultad progresiva.
- Generación procedural.
- Una horda final de gran intensidad.

La dificultad debe ser normal: el jugador deberá utilizar movimiento, posicionamiento, puntería y cobertura para sobrevivir.

---

# 4. PERSONAJES PRINCIPALES

Existirán tres personajes controlables:

| Personaje | Recurso | Arma | Daño |
|---|---|---|---|
| Soldado 1 | soldier_1.png | M416 | 1x |
| Soldado 2 | soldier_2.png | Benelli M4 | 2x |
| Soldado 3 | soldier_3.png | Minigun | 3x |

El personaje inicial será siempre soldier_1.png.

Los tres personajes deberán compartir una arquitectura de comportamiento común. No dupliques toda la lógica para cada soldado.

Cada personaje debe tener los siguientes estados:

### 4.1. Reposo (Idle)

- El personaje permanece estático.
- Añade una animación sutil de sombra alrededor o debajo del sprite.
- La animación debe simular una respiración o movimiento ambiental.
- No modifiques permanentemente la imagen original.

### 4.2. Disparando (Shooting)

- Al disparar, realiza un desplazamiento mínimo hacia atrás.
- El retroceso debe ser visualmente perceptible, pero no afectar significativamente la posición real del personaje.
- Añade un efecto de disparo amarillo desde la boquilla del arma.
- La animación debe corresponder al arma equipada.

### 4.3. Recibiendo daño (Hit)

- Al recibir un impacto, genera partículas rojas desde la zona aproximada del impacto.
- Las partículas deben desaparecer automáticamente.
- Añade una reacción visual breve al daño.
- Evita que el efecto interfiera con el control del personaje.

### 4.4. Muriendo (Dying)

- Ejecuta una transición suave desde el sprite del personaje hacia blood.png.
- Utiliza el recurso original si está disponible.
- Después de la transición, muestra Game Over.
- Ofrece un botón Reintentar.

Estos estados deben funcionar para los tres personajes.

---

# 5. CONTROLES

Implementa los siguientes controles:

| Acción | Control |
|---|---|
| Movimiento hacia arriba | W |
| Movimiento hacia abajo | S |
| Movimiento izquierda | A |
| Movimiento derecha | D |
| Apuntar | Cursor del mouse |
| Disparar | Mantener botón izquierdo |
| Linterna | L |
| Pausar | ESC |
| Confirmar narrativa | ENTER |

### Movimiento

- Movimiento omnidireccional.
- Normaliza el vector de movimiento para evitar que las diagonales sean más rápidas.
- Implementa una velocidad configurable.
- Evita atravesar paredes y objetos.
- Evita que el personaje quede atrapado en esquinas.

### Apuntado

- El personaje debe rotar siguiendo la posición del cursor.
- El arma debe conservar una orientación coherente con el personaje.
- Configura individualmente la posición de la boquilla del arma para cada sprite.
- La posición de disparo debe calcularse según la rotación actual.

### Mira láser

- Dibuja una línea láser desde la boquilla del arma hasta la posición del cursor.
- Debe actualizarse continuamente.
- Debe detenerse al encontrar paredes u objetos sólidos.
- No debe atravesar obstáculos.

Importante: la línea láser es una referencia visual de apuntado. No debe confundirse con la trayectoria efectiva del proyectil ni utilizarse como sustituto de las colisiones del disparo.

---

# 6. ARMAS Y SISTEMA DE COMBATE

Cada personaje tendrá un arma específica.

### 6.1. M416

- Daño: 1x.
- Cadencia: media.
- Dispersión: baja.
- Alcance: alto.
- Proyectil o efecto visual amarillo desde la boquilla.
- HUD: m416.png.
- Nombre: Carabina M416.

### 6.2. Benelli M4

- Daño: 2x.
- Cadencia: baja.
- Dispersión: alta.
- Alcance: corto.
- Disparo de múltiples perdigones.
- HUD: benelli_m4.png.
- Nombre: Escopeta M4.

### 6.3. Minigun

- Daño: 3x.
- Cadencia: muy alta.
- Dispersión: media.
- Alcance: alto.
- Efecto visual de ráfaga o ametralladora.
- HUD: minigun.png.
- Nombre: Ametralladora Minigun.

Todos los personajes tienen munición infinita.

Los valores de daño, cadencia, alcance y dispersión deben estar centralizados en archivos de configuración.

### 6.4. Reglas de disparo

- El jugador dispara mientras mantiene presionado el botón izquierdo.
- El proyectil debe salir desde la boquilla real del arma.
- Los enemigos también disparan proyectiles.
- Los proyectiles deben tener velocidad, alcance y daño configurables.
- Los disparos deben respetar las colisiones del escenario.
- No se puede disparar a través de paredes u objetos sólidos.
- La línea de disparo debe tener una longitud congruente con el alcance efectivo.
- Los efectos visuales no deben causar daño por sí mismos.
- Implementa una detección consistente de impactos.
- Evita que un mismo proyectil aplique daño repetidamente al mismo objetivo, salvo que sea una mecánica intencional.

Utiliza pooling para proyectiles y efectos cuando sea conveniente.

---

# 7. ENEMIGOS E INTELIGENCIA ARTIFICIAL

Los enemigos serán instancias de zombie_soldier_1.png.

Todos compartirán una arquitectura común y deberán comportarse como soldados infectados que utilizan armas de fuego.

No deben intentar atacar cuerpo a cuerpo.

### 7.1. Estados de los enemigos

- Idle.
- Patrolling.
- Moving.
- Searching.
- Aiming.
- Shooting.
- Hit.
- Dying.

### 7.2. Comportamiento sin detectar al jugador

Cuando el jugador no se encuentre dentro del rango de detección:

- Movimiento aleatorio dentro de la zona disponible.
- Pausas ocasionales.
- Cambios de dirección.
- Patrullaje ocasional.
- Respeto de paredes y objetos sólidos.

Evita movimientos excesivamente erráticos.

### 7.3. Comportamiento al detectar al jugador

Cuando el jugador entra en su rango de detección:

1. El enemigo detecta al jugador.
2. Orienta su arma hacia él.
3. Comprueba si existe línea de visión.
4. Busca una posición adecuada para disparar.
5. Si está demasiado lejos, se aproxima.
6. Si está dentro del rango óptimo, mantiene la distancia.
7. Si está demasiado cerca, retrocede.
8. Dispara respetando su cadencia.
9. Si una pared bloquea la trayectoria, busca un ángulo alternativo o una posición de disparo válida.

La IA debe tener una complejidad intermedia. No es necesario implementar navegación avanzada, pero sí un comportamiento creíble.

### 7.4. Separación física

Los enemigos no deben superponerse entre sí ni con el jugador.

Implementa:
- Colisiones.
- Separación entre entidades.
- Distancia mínima configurable.
- Corrección de movimientos que provoquen superposición.
- Prevención de acumulaciones en pasillos estrechos.

No permitas que los enemigos atraviesen paredes ni queden permanentemente atrapados.

### 7.5. Daño y muerte

Cuando reciben daño:
- Generan partículas rojas.
- Muestran una reacción visual breve.
- Actualizan su barra de vida.

Cuando mueren:
- Realizan una transición suave hacia blood.png.
- Desaparecen de la lógica de combate.
- Se incrementa el contador de enemigos eliminados.
- Se comprueba si corresponde generar un objeto de evolución.

### 7.6. Barra de vida de enemigos

Cada enemigo debe tener una barra de vida sobre su cabeza.

- Verde: salud superior al 50%.
- Amarillo: salud igual o inferior al 50% y superior al 25%.
- Rojo: salud igual o inferior al 25%.

La barra debe actualizarse en tiempo real y no interferir con los demás elementos visuales.

---

# 8. VIDA, EVOLUCIÓN Y PROGRESIÓN

### 8.1. Sistema de salud

El jugador tendrá una barra de salud compartida entre los tres personajes.

La capacidad máxima aumentará al evolucionar, pero la salud actual no deberá restaurarse automáticamente al máximo.

Como referencia inicial, configura:

- Soldado 1: capacidad de salud corta.
- Soldado 2: capacidad de salud media.
- Soldado 3: capacidad de salud larga.

Los valores concretos deben balancearse para que el juego sea completable y represente un reto.

La barra del HUD debe mostrar el texto Health.

Colores:

- Verde: más del 50%.
- Amarillo: salud igual o inferior al 50% y superior al 30%.
- Rojo: salud igual o inferior al 30%.

### 8.2. Botiquines

Implementa botiquines como objetos recogibles.

- Restauran un porcentaje configurable de la salud máxima.
- No deben superar la capacidad máxima.
- Deben tener una representación visual clara.
- Su aparición debe estar controlada por el sistema de generación procedural.
- Deben poder recogerse mediante colisión.

### 8.3. Evolución de personajes

La evolución debe depender del número acumulado de enemigos eliminados.

**Primera evolución:**
- Al eliminar al enemigo número 11, aparece un objeto de evolución.
- El objeto permanece en el suelo hasta que el jugador lo recoja.
- Al recogerlo, cambia a soldier_2.png.
- El arma pasa a ser Benelli M4.
- El daño pasa a ser 2x.
- Aumenta la capacidad máxima de salud.

**Segunda evolución:**
- Al eliminar 16 enemigos adicionales, es decir, al alcanzar 27 enemigos eliminados en total, aparece el segundo objeto de evolución.
- El objeto permanece disponible hasta ser recogido.
- Al recogerlo, cambia a soldier_3.png.
- El arma pasa a ser Minigun.
- El daño pasa a ser 3x.
- Aumenta nuevamente la capacidad máxima de salud.

Reglas importantes:

- El segundo objeto debe generarse al alcanzar su condición, incluso si el primer objeto todavía no ha sido recogido.
- Los objetos de evolución no desaparecen por tiempo.
- La evolución solo ocurre cuando el jugador recoge el objeto.
- No se debe perder una evolución por avanzar demasiado rápido.
- El cambio de personaje debe actualizar inmediatamente el sprite, arma, daño, HUD y capacidad máxima de salud.
- No restaures automáticamente la salud al máximo durante la evolución.

Mantén el contador de enemigos eliminados independiente del personaje actual.

---

# 9. GENERACIÓN PROCEDURAL DEL MAPA

El mapa debe generarse proceduralmente utilizando los tiles PNG disponibles en assets/images/tiles.

El escenario será cerrado, con paredes, habitaciones, pasillos, objetos y zonas de cobertura.

La generación debe basarse en un sistema de **habitaciones conectadas por pasillos**.

### 9.1. Estructura

El mapa debe incluir:

- Zona inicial.
- Habitaciones pequeñas y medianas.
- Habitaciones de combate.
- Pasillos de conexión.
- Áreas de cobertura.
- Habitaciones abiertas.
- Algunas habitaciones bloqueadas.
- Zona final de extracción.

No todas las habitaciones deben estar accesibles.

La generación debe garantizar un camino válido desde el inicio hasta la arena final.

### 9.2. Dimensiones dinámicas

El tamaño del mapa debe adaptarse a la duración objetivo de aproximadamente 10 minutos.

No utilices un mapa excesivamente pequeño ni un escenario de dimensiones arbitrarias.

La cantidad de habitaciones, pasillos, enemigos, botiquines y objetos debe configurarse para conseguir la duración prevista.

Centraliza los parámetros para poder ajustar fácilmente:

- Número de habitaciones.
- Dimensiones de habitaciones.
- Longitud de pasillos.
- Cantidad de enemigos.
- Densidad de objetos.
- Dificultad por sección.
- Distancia entre zonas.
- Tamaño de la arena final.

### 9.3. Validación del mapa

La generación procedural debe prevenir:

- Habitaciones inaccesibles involuntariamente.
- Pasillos que no conectan correctamente.
- Pasillos sin salida no intencionales.
- Superposición de habitaciones.
- Paredes mal posicionadas.
- Enemigos dentro de paredes.
- Objetos dentro de obstáculos.
- Salidas bloqueadas.
- Distribuciones imposibles de completar.
- Jugador atrapado en el punto inicial.

Implementa validaciones de conectividad y colisiones.

Preferiblemente, utiliza una semilla (seed) para que un mapa pueda reproducirse durante depuración y pruebas.

### 9.4. Colisiones

Todos los elementos sólidos deben tener colisión.

Esto incluye:
- Paredes.
- Límites del mapa.
- Obstáculos.
- Muebles.
- Barricadas.
- Otros objetos sólidos.

Las colisiones deben afectar al jugador y a los enemigos.

Los proyectiles, el láser y la linterna también deben respetar los obstáculos.

La cámara debe seguir continuamente al jugador y limitarse a los bordes del mapa.

---

# 10. ILUMINACIÓN Y AMBIENTACIÓN

El escenario tendrá una atmósfera oscura de terror y supervivencia militar.

Implementa un sistema híbrido de iluminación simulada, conos de visión y sombras de obstáculos.

### 10.1. Visibilidad ambiental

- El mapa debe tener iluminación ambiental reducida.
- El jugador debe poder observar el escenario y los enemigos incluso con la linterna apagada.
- Las zonas lejanas deben oscurecerse progresivamente.
- No conviertas el escenario en una pantalla completamente negra.

### 10.2. Linterna

La linterna estará inicialmente apagada.

Se activa y desactiva con L.

Debe cumplir:

- Orientación según el arma y la dirección del jugador.
- Cono de iluminación de apertura fija.
- Alcance configurable.
- Geometría proporcional al personaje.
- Bloqueo de luz al encontrar paredes u obstáculos.
- Actualización dinámica al rotar el personaje.

La forma debe recordar a un haz de linterna alargado, con una apertura coherente.

### 10.3. Efectos ambientales

Implementa, cuando sea viable:

- Niebla ligera.
- Partículas de polvo.
- Luces intermitentes.
- Oscurecimiento de áreas lejanas.
- Efectos luminosos al disparar.
- Sombras simuladas de obstáculos.
- Iluminación de la linterna.

Estos efectos deben ser sutiles y no comprometer la legibilidad del combate.

No es obligatorio utilizar un sistema de iluminación avanzado de alto costo computacional. Prioriza una solución estable y eficiente.

---

# 11. HUD E INTERFAZ DURANTE LA PARTIDA

El HUD debe permanecer visible y adaptarse a la resolución.

### Esquina superior izquierda

Mostrar:

- Indicador de linterna.
- Texto inicial: "Presiona L para encender la linterna".
- Estado actual de la linterna.

### Esquina inferior izquierda

Mostrar discretamente:

"Presiona WASD para moverte."

### Esquina superior derecha

Mostrar:

- Imagen del arma actual.
- Nombre del arma.
- Actualización automática al evolucionar.

Nombres exactos:

- Carabina M416.
- Escopeta M4.
- Ametralladora Minigun.

### Barra de salud

Mostrar:

- Texto Health.
- Barra de salud.
- Color correspondiente al porcentaje.
- Longitud visual corta, media o larga según el personaje.

### Información adicional

Incluir:

- Enemigos eliminados.
- Progreso de misión.
- Tiempo transcurrido.
- Indicador de linterna.

No mostrar un contador de enemigos restantes.

El HUD no debe interferir con el escenario ni tapar elementos importantes del juego.

---

# 12. MENÚ PRINCIPAL Y FLUJO NARRATIVO

### 12.1. Menú principal

El juego debe iniciar en un menú principal.

Título:

**War Infection**

Botón:

**Jugar ahora**

El diseño debe tener estética de videojuego militar de terror y supervivencia.

Debe ser visualmente atractivo, legible y coherente con la ambientación.

### 12.2. Ingreso de nombre

Al seleccionar Jugar ahora, mostrar una pantalla donde el jugador ingrese su nombre.

Condiciones:

- Mínimo 3 caracteres.
- Permitir ingreso mediante teclado.
- Confirmación con Enter.
- Validar que no se envíe un nombre vacío o inválido.

El nombre se utilizará en el prólogo.

### 12.3. Prólogo

Después de confirmar el nombre, mostrar una pantalla narrativa con efecto de máquina de escribir.

El texto debe aparecer palabra por palabra o mediante una animación rápida equivalente.

Al presionar Enter:
- Si la línea está escribiéndose, completarla inmediatamente.
- Si la línea ya terminó, avanzar a la siguiente.

Conserva el contenido y el sentido del diálogo original. Sustituye únicamente las referencias al nombre por el nombre ingresado.

Texto:

**Capitán Miller:** Soldado {Nombre} cuál es la situación del pelotón?.

**{Nombre}:** Capitán Miller, la misión de reconocimiento, ha cambiado de parecer [inteligible...] estamos recibiendo fuego amigo por parte del escuadrón Centauro en la base Alfa-B. Parece que algo los ha afectado, no parecen ser conscientes, pareciera que estuvieron demasiado expuestos a la investigación del elemento HK. No hay energía ni comunicación interna.

**Capitán Miller:** {Nombre}, abandone inmediatamente el lugar y llegue a la zona de extracción de la sección sur. Un convoy de rescate llegará a las 0400.

**Capitán Miller:** {Nombre}, responda!.

**{Nombre}:** Demasiado tarde (No signal sound)...

No elimines ni resumas líneas del diálogo.

Al finalizar, mostrar:

"Presiona Enter para continuar..."

Cuando el jugador presione Enter, iniciar la partida.

---

# 13. PROGRESIÓN DE LA PARTIDA Y DIFICULTAD

El jugador inicia en la primera zona del mapa.

Debe avanzar por habitaciones y pasillos, encontrando enemigos distribuidos proceduralmente.

La distribución debe mantener una experiencia de progreso.

### Dificultad progresiva

**Zonas iniciales:**
- Pocos enemigos.
- Disparos relativamente lentos.
- Enemigos menos resistentes.
- Espacio para familiarizarse con los controles.

**Zonas intermedias:**
- Mayor cantidad de enemigos.
- Mayor precisión.
- Mayor frecuencia de disparos.
- Mayor necesidad de utilizar cobertura.

**Zonas finales:**
- Enemigos más resistentes.
- Mayor agresividad.
- Distribución más exigente.
- Mayor presión sobre el jugador.

La dificultad debe aumentar de manera gradual, sin generar saltos injustos.

El balance debe permitir completar la partida con cualquiera de los personajes, aunque las armas superiores faciliten el combate.

---

# 14. HORDA FINAL

Al llegar a la sección final, el jugador debe encontrar una arena de combate.

La arena debe incluir una barricada o muro que permita utilizar cobertura.

La horda final estará organizada en oleadas progresivas.

Requisitos:

- Varias oleadas.
- Incremento gradual de la presión.
- Última oleada de aproximadamente 50 enemigos simultáneos.
- Enemigos capaces de atacar desde diferentes direcciones.
- Espacio suficiente para moverse y utilizar cobertura.
- Colisiones coherentes con la barricada y el escenario.

El diseño asume que el jugador probablemente habrá alcanzado el tercer personaje, pero debe seguir siendo posible llegar con un nivel inferior si no recoge los objetos de evolución.

No generes innecesariamente todos los enemigos fuera de la zona de combate.

Utiliza pooling, generación controlada y optimización para mantener el rendimiento.

La última oleada debe representar el desafío principal del juego.

### 14.1. Muerte durante la horda final: checkpoint

Si el jugador muere durante la horda final:

- No debe reiniciar toda la campaña.
- Debe mostrarse una pantalla de reintento antes de reanudar.
- Al aceptar, reiniciar la horda completa desde su primera oleada.
- Conservar el personaje desbloqueado.
- Conservar el escenario y la posición del checkpoint.
- Restaurar parcialmente la salud.

Como valor inicial, utiliza el 50% de la salud máxima del personaje actual, configurable desde el sistema de balance.

- Los enemigos de la horda deben reaparecer desde el principio.
- El estado de la horda debe reiniciarse correctamente.
- No deben quedar proyectiles, enemigos o temporizadores de la ejecución anterior.
- No debe repetirse el prólogo ni la campaña.

El checkpoint debe ser un estado controlado y reproducible.

---

# 15. VICTORIA Y GAME OVER

### 15.1. Game Over

Cuando el jugador muera durante la campaña:

1. Ejecutar la animación de muerte.
2. Mostrar Game Over.
3. Mostrar el botón Reintentar.
4. Permitir comenzar una nueva partida desde el estado inicial.

Si la muerte ocurre durante la horda final, aplicar las reglas específicas del checkpoint.

### 15.2. Victoria

Cuando el jugador elimine a todos los enemigos de la horda final, mostrar:

**YOU WON!**

Subtítulo:

"Has llegado justo a tiempo para el rescate."

Botón:

"Regresar al menú"

Al hacer clic, regresar al menú principal.

El jugador debe poder iniciar una nueva partida sin recargar la página.

---

# 16. SISTEMA DE PAUSA

Al presionar ESC, pausar la partida.

Mostrar un menú con:

- Continuar.
- Reiniciar.
- Menú principal.

El sistema de pausa debe detener correctamente:

- Movimiento.
- Disparos.
- Proyectiles.
- IA.
- Temporizadores de juego.
- Animaciones que deban detenerse durante la pausa.

No debe detener elementos de interfaz que necesiten seguir funcionando.

Al reanudar, todos los sistemas deben continuar sin duplicar eventos ni temporizadores.

---

# 17. AUDIO

Actualmente no existen archivos de audio disponibles.

Por tanto:

- No inventes rutas de audio.
- No dependas de archivos inexistentes.
- No hagas que el juego falle si no hay audio.
- No utilices sonidos externos obligatorios.

Prepara una arquitectura AudioManager o equivalente que permita incorporar posteriormente:

- Disparos.
- Impactos.
- Muerte.
- Ambiente.
- Linterna.
- Música de menú.
- Efectos narrativos.

Las llamadas de audio deben ser seguras cuando no existan recursos. Utiliza una implementación no-op o una comprobación de disponibilidad.

---

# 18. RENDIMIENTO Y COMPATIBILIDAD

El videojuego debe funcionar en navegadores modernos de escritorio.

Objetivo:

**60 FPS en equipos de gama media.**

Implementa las siguientes optimizaciones:

- Pooling de proyectiles.
- Pooling de partículas.
- Reutilización de enemigos cuando corresponda.
- Limpieza de eventos.
- Limpieza de temporizadores.
- Destrucción de objetos que ya no se necesiten.
- Actualización optimizada de IA.
- Reducción de cálculos de enemigos lejanos.
- Control de partículas simultáneas.
- Evitar operaciones innecesarias por frame.
- Evitar fugas de memoria al reiniciar.
- Evitar duplicación de listeners.
- Optimizar las colisiones.

El juego debe conservar una resolución interna adecuada para pixel art.

Utiliza inicialmente una referencia de 1280x720, con escalado responsivo.

Debe:
- Mantener la relación de aspecto.
- Evitar deformaciones.
- Mantener sprites nítidos.
- Adaptarse a diferentes tamaños de ventana.
- Evitar que el HUD salga de pantalla.

Configura Phaser para preservar el estilo pixel art, utilizando pixelArt, roundPixels o las opciones equivalentes cuando corresponda.

---

# 19. CONFIGURACIÓN Y MANTENIBILIDAD

Todos los valores importantes deben ser configurables.

Como mínimo:

- Velocidad del jugador.
- Velocidad de enemigos.
- Salud de personajes.
- Salud de enemigos.
- Daño de armas.
- Cadencia.
- Dispersión.
- Alcance.
- Velocidad de proyectiles.
- Rango de detección.
- Distancia de combate.
- Frecuencia de aparición de botiquines.
- Cantidad de enemigos por habitación.
- Dimensiones del mapa.
- Parámetros de linterna.
- Dificultad por zona.
- Cantidad de oleadas.
- Enemigos de la última oleada.
- Salud recuperada en checkpoint.

Evita valores mágicos dentro de los métodos.

Documenta las clases, métodos y sistemas principales mediante comentarios útiles.

Los comentarios deben explicar responsabilidades, decisiones y comportamientos que no sean evidentes. No llenes el código de comentarios redundantes.

---

# 20. PRUEBAS Y VALIDACIONES

No basta con que el juego compile.

Implementa pruebas automatizadas cuando sea viable. Si el proyecto no tiene un framework de pruebas, configura uno ligero y apropiado para TypeScript.

Como mínimo, valida:

1. Carga de recursos.
2. Existencia de recursos obligatorios y manejo de recursos ausentes.
3. Generación del mapa.
4. Conectividad entre habitaciones.
5. Existencia de camino entre inicio y arena final.
6. Posiciones iniciales libres de colisiones.
7. Aparición de enemigos en posiciones válidas.
8. Movimiento del jugador y colisiones.
9. Movimiento y separación de enemigos.
10. Transiciones de estados de IA.
11. Daño de cada arma.
12. Multiplicadores 1x, 2x y 3x.
13. Aparición de la primera evolución al alcanzar 11 eliminaciones.
14. Aparición de la segunda evolución al alcanzar 27 eliminaciones.
15. Persistencia de objetos de evolución hasta recogerlos.
16. Aumento de salud máxima sin restauración completa.
17. Colores de barras de salud.
18. Bloqueo de proyectiles por obstáculos.
19. Bloqueo de láser por obstáculos.
20. Oclusión de linterna.
21. Funcionamiento del sistema de pausa.
22. Progresión de oleadas.
23. Reinicio del checkpoint.
24. Condición de victoria.
25. Reinicio completo de partida.
26. Limpieza de eventos y objetos al regresar al menú.

No afirmes que una prueba fue superada si no la ejecutaste realmente.

Si una validación requiere interacción visual o pruebas manuales, indícalo expresamente.

---

# 21. PLAN DE IMPLEMENTACIÓN OBLIGATORIO

No intentes implementar todo de una sola vez sin verificar los resultados.

Trabaja en fases.

## Fase 1: Inspección y planificación

- Inspeccionar el proyecto.
- Inventariar recursos.
- Medir dimensiones de sprites.
- Identificar recursos ausentes.
- Revisar el estado de package.json.
- Proponer arquitectura.
- Definir estructura final.
- Documentar decisiones técnicas.

Antes de continuar, presenta un resumen de lo encontrado y de la arquitectura propuesta.

## Fase 2: Configuración base

- Configurar TypeScript.
- Configurar Phaser 3.
- Configurar Vite.
- Crear la estructura modular.
- Crear escenas iniciales.
- Implementar carga de recursos.
- Verificar que el proyecto inicia.

## Fase 3: Personajes y controles

- Implementar jugador.
- Implementar movimiento.
- Implementar orientación.
- Implementar estados.
- Implementar animación de retroceso.
- Implementar controles.
- Implementar cámara.

## Fase 4: Escenario procedural

- Implementar generación de habitaciones.
- Implementar pasillos.
- Implementar paredes y objetos.
- Implementar colisiones.
- Implementar validación de conectividad.
- Implementar posiciones de aparición.
- Verificar que el jugador puede recorrer el mapa.

## Fase 5: Combate y enemigos

- Implementar armas.
- Implementar proyectiles.
- Implementar daño.
- Implementar barras de salud.
- Implementar estados de enemigos.
- Implementar IA.
- Implementar separación física.
- Implementar partículas y muerte.

## Fase 6: Progresión

- Implementar contador de eliminaciones.
- Implementar objetos de evolución.
- Implementar cambios de personaje.
- Implementar botiquines.
- Implementar dificultad progresiva.
- Implementar HUD.

## Fase 7: Iluminación y ambientación

- Implementar iluminación ambiental.
- Implementar linterna.
- Implementar oclusión.
- Implementar efectos ambientales.
- Optimizar el renderizado.

## Fase 8: Menús y narrativa

- Implementar menú principal.
- Implementar ingreso de nombre.
- Implementar prólogo.
- Implementar pausa.
- Implementar Game Over.
- Implementar checkpoint.
- Implementar victoria.

## Fase 9: Horda final

- Crear arena final.
- Implementar barricada.
- Implementar oleadas.
- Implementar última oleada de aproximadamente 50 enemigos simultáneos.
- Implementar checkpoint específico de la horda.
- Verificar el balance.

## Fase 10: Optimización y validación final

- Ejecutar build.
- Ejecutar pruebas automatizadas.
- Resolver errores.
- Verificar rendimiento.
- Revisar limpieza de memoria.
- Verificar reinicios.
- Probar flujo completo de principio a fin.

Puedes ajustar el orden de implementación cuando exista una dependencia técnica que lo justifique, pero no omitas ninguna funcionalidad.

---

# 22. ENTREGABLES OBLIGATORIOS

Al finalizar, entrega:

1. Código fuente completo.
2. Todos los archivos necesarios para ejecutar el proyecto.
3. package.json actualizado.
4. Configuración de TypeScript.
5. Configuración de Vite.
6. Estructura final de directorios.
7. Inventario de recursos.
8. Archivos de configuración del juego.
9. Pruebas automatizadas.
10. Documentación de arquitectura.
11. Instrucciones de instalación.
12. Instrucciones de ejecución.
13. Instrucciones de compilación.
14. Lista de funcionalidades implementadas.
15. Lista de limitaciones o funcionalidades pendientes, si existen.

El proyecto debe permitir ejecutar comandos equivalentes a:

    npm install
    npm run dev
    npm run build
    npm run test

Si utilizas nombres de scripts diferentes, documenta claramente los comandos correctos.

No entregues código incompleto ni pseudocódigo.

No omitas archivos necesarios indicando que el usuario debe completarlos posteriormente.

Si tienes acceso al sistema de archivos, crea los archivos directamente.

Si no puedes modificar archivos directamente, entrega el contenido completo de cada archivo, organizado por ruta y sin sustituir implementaciones por explicaciones generales.

---

# 23. CRITERIOS DE ACEPTACIÓN

El desarrollo se considerará satisfactorio cuando:

- El proyecto compile correctamente.
- El juego abra en el navegador.
- El menú principal funcione.
- El ingreso de nombre funcione.
- El prólogo conserve el diálogo indicado.
- El personaje se mueva y apunte correctamente.
- Los tres personajes puedan utilizarse.
- Las tres armas tengan comportamientos diferenciados.
- Los enemigos se muevan, detecten y disparen.
- Las paredes bloqueen movimientos y proyectiles.
- El láser respete obstáculos.
- La linterna respete obstáculos.
- El mapa procedural tenga conectividad válida.
- Las barras de salud se actualicen correctamente.
- Los objetos de evolución aparezcan en los umbrales indicados.
- Los objetos permanezcan disponibles hasta ser recogidos.
- Los botiquines funcionen.
- La dificultad aumente progresivamente.
- El HUD muestre la información solicitada.
- La pausa funcione correctamente.
- La partida tenga una duración aproximada de 10 minutos.
- La horda final incluya oleadas y una última oleada de aproximadamente 50 enemigos simultáneos.
- El checkpoint reinicie únicamente la horda.
- La victoria y el Game Over funcionen.
- Se pueda regresar al menú y comenzar una nueva partida.
- No existan errores críticos al reiniciar o cambiar de escena.
- Se hayan ejecutado y documentado las pruebas disponibles.

---

# 24. INSTRUCCIÓN FINAL

Prioriza la calidad técnica, la jugabilidad y la coherencia visual.

No simplifiques las mecánicas principales para entregar algo más rápido.

No reemplaces los recursos originales por gráficos genéricos si los recursos necesarios ya existen.

No inventes archivos, dimensiones ni resultados de pruebas.

Si encuentras problemas en los recursos, la arquitectura o las especificaciones, identifica el problema y aplica una solución técnicamente razonable sin eliminar los requisitos funcionales.

Mantén el código modular y legible.

Trabaja de manera incremental, verifica cada fase y asegúrate de que las funcionalidades anteriores continúen funcionando después de cada nueva implementación.

**El objetivo final es entregar un videojuego web completo, funcional, optimizado y mantenible: WAR INFECTION.**