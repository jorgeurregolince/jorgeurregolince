# Mascota (Pip)

Un mod para Claude Code: **Pip**, una mascota animada que vive en la franja de arriba del prompt
y te muestra en vivo lo que Claude está haciendo.

```
╭─?─╮ o    Pip pensando..
│° °│      “…revisar qué herramienta usar para el panel”
╰─~─╯      3 herramientas · 1.2k car. pensados
```

## Qué hace

- **pensando**: mientras Claude razona; el globo muestra lo último que pensó.
- **escribiendo la respuesta**: cuando llega el texto de la respuesta.
- **leyendo / buscando**: con Read, Grep o Glob, y el archivo o patrón.
- **editando**: con Edit o Write.
- **ejecutando**: con Bash, rebotando, junto con la descripción del comando.
- **explorando la web / llamando a un ayudante**: con WebFetch o WebSearch, y con Agent.
- **¡listo! / ¡ups!**: al terminar el turno, o si una herramienta falla.
- **durmiendo**: tras 90 segundos sin actividad.

Pip vive en la franja de encima del prompt, a todo lo ancho del chat. `/mascota ocultar` lo quita,
`/mascota` lo trae de vuelta y `/mascota panel` lo abre en su propio panel. Donde la franja no se
dibuja (el celular, una sesión en la nube), Pip se abre solo en su panel.

**Arrástralo**: agarra la línea bajo Pip (su sombra) en la app de escritorio, o a Pip mismo en la
terminal, y llévalo de un lado a otro. Recuerda dónde lo dejaste. En VS Code y en el celular se
queda fijo.

## Instalar

En el prompt de una sesión de Claude Code en la terminal:

```
/plugin install mascota --marketplace jorgeurregolince/jorgeurregolince
```

Desde una shell:

```bash
claude plugin install mascota --marketplace jorgeurregolince/jorgeurregolince
```

En la app de escritorio, donde `/plugin` no funciona: pulsa **+** junto al cuadro del prompt, luego
**Plugins**, **Add marketplace** con `jorgeurregolince/jorgeurregolince`, y después **Add plugin**.

Responde `y` para añadir el marketplace y elige el alcance (user). Pip aparece al instante.

## Desarrollo

```bash
claude plugin validate .claude/skills/mascota
```

```bash
claude plugin test .claude/skills/mascota
```
