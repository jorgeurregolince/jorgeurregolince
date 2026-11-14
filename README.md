# Frasco de Luz

Juego para el celular: arrastra el frasco y atrapa luciérnagas mientras esquivas las gotas de lluvia.

- `index.html`: el juego completo, en un solo archivo. Ábrelo en el navegador del celular.
- `src/game.html`: el mismo juego sin la envoltura HTML (se usa para publicarlo como Artifact).

Reglas: luciérnaga = 1 punto, dorada = 5, racha de 10 o más = puntos dobles. Tres gotas y se acaba la noche.

# Operación Duna

Shooter retro en pixel art (`duna/index.html`). Mueve al soldado con el dedo izquierdo, mantén FUEGO para disparar (apunta solo) y usa GRAN para lanzar granadas. Sobrevive a las oleadas; los barriles rojos explotan y los botiquines curan.

# Mascota (mod de Claude Code)

`.claude/skills/mascota/` es un mod para Claude Code: Pip, una mascota animada sobre el prompt que muestra en vivo lo que Claude está haciendo (pensar, leer, editar, ejecutar, responder). Instálalo con:

```
/plugin install mascota --marketplace jorgeurregolince/jorgeurregolince
```

En las sesiones de Claude Code en la nube, Pip se carga solo si el entorno tiene el script de configuración que apunta `CLAUDE_CODE_PLUGIN_DIRS` a esa carpeta.

# Bit (mod de Claude Code)

`.claude/skills/bit/` es Bit, un robotito que es como el cuerpo de Claude: te resume cada respuesta en voz de Claude, le puedes hablar con `/bit <mensaje>`, y gana experiencia, sube de nivel y evoluciona en 5 formas. Instálalo con:

```
/plugin install bit --marketplace jorgeurregolince/jorgeurregolince
```
