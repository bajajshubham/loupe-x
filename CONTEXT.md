# Event Loop Visualizer

Build browser teaching tool inspired by Loupe and JSV9000.

## First slice

- Vite + TypeScript + React.
- Browser Worker executes user JavaScript.
- Main thread owns watchdog and visual state.
- Trace events drive call stack, Web APIs, task queue, microtask queue, and console.
- `Next` and `Previous` use recorded trace snapshots.
- Watchdog stops runs after 2 seconds.
- Stop runs after 10,000 events.

## Safety

Never execute user code on main thread. Worker API surface stays small. Do not expose DOM, network, storage, nested Workers, or unsupported globals. Worker termination may skip `finally` blocks.

## Scope order

1. Modern JavaScript script mode.
2. TypeScript parse and type erasure.
3. ES modules.

Use upstream projects as behaviour references until licenses are verified. Reimplement code. Do not copy source or assets yet.
