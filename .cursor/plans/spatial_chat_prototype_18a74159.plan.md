---
name: Spatial Chat Prototype
overview: Build a Vite + React + Motion prototype demonstrating the spatial model between three UI modes — full-screen chat, canvas with side chat, and copilot chat — using animated transitions, layout animations, and shadow-based depth hierarchy.
todos:
  - id: scaffold
    content: Scaffold Vite + React + TS project, install motion and Tailwind CSS
    status: completed
  - id: layout
    content: Build App.tsx with mode state and the flex container shell
    status: completed
  - id: nav
    content: Build NavPanel with spring-animated width, shadow-sm, and canvas toggle button
    status: completed
  - id: chat
    content: Build ChatPanel with layout animation, shadow-2xl, and mode-responsive positioning
    status: completed
  - id: canvas
    content: Build CanvasPanel with rippling content cards and subtle motion
    status: completed
  - id: modebar
    content: Build ModeBar with shared layoutId pill transition between 3 modes
    status: completed
  - id: polish
    content: Tune spring values, shadow tokens, and visual polish for spatial depth clarity
    status: completed
isProject: false
---

# Spatial Chat Modes Prototype

## Stack

- **Vite + React + TypeScript** — fast project scaffold
- **[motion](https://motion.dev/)** — layout animations, spring physics, `AnimatePresence`
- **Tailwind CSS** — utility styling, shadow scale, colors

## Spatial Hierarchy (z-depth via shadow)

Depth is communicated through box-shadow weight. The most important surface floats highest:


| Surface        | Elevation | Shadow                                         |
| -------------- | --------- | ---------------------------------------------- |
| Chat panel     | Highest   | `shadow-2xl` (~`0 20px 48px rgba(0,0,0,0.22)`) |
| Canvas content | Mid       | `shadow-md`                                    |
| Nav menu       | Lowest    | `shadow-sm` (~`2px 0 8px rgba(0,0,0,0.08)`)    |


Nav slides *behind* content — it never covers chat. Chat is always the foreground actor.

## Three Modes

```
MODE A — Full-screen chat
┌──────┬───────────────────────────────┐
│ Nav  │         Chat (full width)     │
│      │                               │
└──────┴───────────────────────────────┘

MODE B — Canvas
┌──────┬──────────┬────────────────────┐
│ Nav* │  Chat    │  Rippling Content  │
│      │ (side)   │    (canvas)        │
└──────┴──────────┴────────────────────┘
  * Nav can be collapsed/expanded

MODE C — Copilot chat
┌──────┬────────────────────┬──────────┐
│ Nav  │  Main content area │  Chat    │
│      │                    │ (right)  │
└──────┴────────────────────┴──────────┘
```

## Motion Strategy

- `motion.div` with `layout` prop on all panels — they animate their own width/position
- `AnimatePresence` for panels that mount/unmount (e.g. right-side copilot chat)
- `useMotionValue` + `useSpring` for smooth nav open/close width transition
- Mode switcher triggers layout reflow; Motion handles the interpolation
- Nav toggle in Canvas mode uses a spring `x` translate so it slides *under* chat

## File Structure

```
src/
  App.tsx               # mode state, top-level layout
  components/
    NavPanel.tsx         # collapsible left nav, lowest elevation
    ChatPanel.tsx        # chat UI, highest elevation
    CanvasPanel.tsx      # rippling content placeholder
    ModeBar.tsx          # top switcher between 3 modes
  hooks/
    useNavToggle.ts      # spring-based nav open/close
  styles/
    index.css            # tailwind, custom shadow tokens
```

## Key Implementation Details

`**App.tsx**` — holds `mode: 'fullchat' | 'canvas' | 'copilot'` state, passes it down. All panels live in the DOM at the same level inside a `flex` container; their `animate` props change based on mode.

`**NavPanel.tsx**` — `motion.div` with `animate={{ width: navOpen ? 220 : 0 }}`, `transition: { type: 'spring', stiffness: 300, damping: 35 }`. Receives lowest shadow token. In Canvas mode shows a toggle button.

`**ChatPanel.tsx**` — `motion.div` with `layout`, positioned left in Canvas/Copilot, full-width in FullChat. Carries `shadow-2xl` and a slight border to reinforce the highest-elevation metaphor.

`**CanvasPanel.tsx**` — animated grid/dots background with a few floating "rippling content" cards using `useMotionValue` scroll-linked subtle parallax.

`**ModeBar.tsx**` — three buttons at the top with an animated underline/pill using `layoutId="activeTab"` for a shared layout transition.

## Transitions Between Modes

When mode changes, all panels re-animate simultaneously via their own `animate` targets — no manual orchestration needed. Spring physics (stiffness ~280, damping ~32) gives a physical, snappy feel matching Rippling's product quality bar.