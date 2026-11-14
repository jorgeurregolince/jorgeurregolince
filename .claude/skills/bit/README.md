# Bit, el robot que crece contigo

Un mod para Claude Code: **Bit** es un robotito que vive junto al chat y es como el cuerpo de Claude.

- **Te habla:** después de cada respuesta te dice, en primera persona y como Claude, qué hizo en una o dos frases, en un globo de diálogo.
- **Le puedes hablar:** `/bit <mensaje>` y te contesta Claude a través de Bit, con el contexto de la conversación.
- **Voz:** `/bit voz` hace que hable en voz alta donde el equipo tenga una voz instalada (por ejemplo en Mac). En la nube no hay voz, así que habla por escrito.
- **Crece:** gana experiencia con cada tarea (10 XP), herramienta (2 XP), edición (+3) y comando (+1). Sube de nivel y evoluciona en 5 formas: **Chispa → Tuerca (nv 3) → Circuito (nv 5) → Mecha (nv 8) → Leyenda (nv 12)**. Su progreso se guarda entre sesiones.
- `/bit` muestra su nivel y estadísticas; `/bit nombre <nuevo>` le cambia el nombre.

Para hablar y resumir usa llamadas al modelo de la sesión, que cuentan en tu uso: `claude-haiku-5-5` para los resúmenes y una consulta rápida sobre la conversación cuando le hablas.

## Instalar

En el prompt de una sesión de Claude Code en la terminal:

```
/plugin install bit --marketplace jorgeurregolince/jorgeurregolince
```

En la app de escritorio: **+** junto al prompt → **Plugins** → **Add marketplace** con `jorgeurregolince/jorgeurregolince` → **Add plugin** → `bit`.

## Desarrollo

```bash
claude plugin validate .claude/skills/bit
```

```bash
claude plugin test .claude/skills/bit
```
