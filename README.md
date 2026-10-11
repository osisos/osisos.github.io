# osisos

Personal Hugo blog: https://osisos.github.io/.

The local `themes/sonnet` theme is implemented for this blog using the palette,
typography and document proportions of the owner's Typora `sonnet.css`.
It uses paper white (#faf9f5), charcoal (#141413), clay (#D97757),
Georgia / Noto Serif SC, a 752px reading column, and restrained Markdown styles.
Dark mode follows the system preference until manually changed, and remembers the selection.
Its palette comes from the owner's local `sonnet-dark.css`.
There are no external scripts, translations, animations, or remote font requests.

Hugo extended 0.146.0:

```sh
hugo server
```

Add Markdown posts to `content/posts/`. Push to `main` to deploy via GitHub Pages.
Generated output is ignored. Noto Serif SC is self-hosted under its SIL OFL license.

The Tools navigation opens `/tools/`, which lists the operator-study grid at
`/tools/grid/`. The grid is an unbounded, browser-only coordinate plane with
brush/rectangle fill, named color regions, erase, coordinate inspection, and undo.
Only visible cells are rendered; filled cells are stored sparsely by coordinate.
Use Move or hold Space while dragging to pan, the wheel to pan, and Ctrl/Cmd +
wheel or the zoom buttons to zoom. Coordinates include positive and negative
integers, with x rightward and y downward. Return to origin resets only the view.
`Q(1,2)` uses global canvas coordinates. A cell belongs to at most one region;
painting over it replaces that membership. Changes and the viewport are stored
in this browser's localStorage only, with no server sync. Original 16 × 12 drawings
are migrated automatically. Undo is available during the current session.
