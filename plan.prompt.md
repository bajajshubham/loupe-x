# Plan: Event Loop Visualizer
Build modern unified tool from Loupe and JSV9000 ideas. Reimplement behavior. Copy no upstream code until license verified.

## Architecture
1. Create CONTEXT.md.
2. Create .github/copilot-instructions.md.
3. Build fresh Vite + TypeScript client.
4. Use React, CodeMirror 6, Babel parser/traverse/generator, Web Worker, DOM/SVG.
5. Define shared typed trace protocol.
6. Build browser Worker adapter first.
7. Keep optional server adapter behind same protocol.
8. Use Loupe concepts for browser queues.
9. Use JSV9000 concepts for event reduction and execution traces.
10. Do not merge Loupe browser semantics with JSV9000 Node semantics.

## Execution
- Worker executes transformed user code.
- Main thread stays responsive.
- Watchdog: 2 seconds.
- Event limit: 10,000.
- Restrict DOM, network, storage, nested Workers, and unsupported globals.
- Use instrumentation checkpoints as cooperative limits.
- Never treat main-thread timers as infinite-loop protection.
- Worker termination may skip finally blocks.

## Trace model
### Events include:
- Source location
- Function enter and exit
- Call stack changes
- Timer creation
- Task queue changes
- Microtask queue changes
- Console output
- Runtime errors
- Execution-limit termination

Store immutable snapshots after each event, or replay from initial state.

## Stepper
- Next applies next event.
- Previous restores previous snapshot or replays trace prefix.
- Autoplay repeats Next.
- Reset returns initial state.
- Each step shows source span, event type, active frame, queue changes, and explanation.
- Real timer delay does not control playback.


## UI
### Use familiar Loupe and JSV9000 layout:
- Code editor
- Call stack
- Web APIs
- Task queue
- Microtask queue
- Console
- Event-loop view
- Step details
- Run, pause, next, previous, stop, reset controls

Use modern styling. Keep basic and advanced modes as views over same trace model.

## Syntax rollout
1. Modern JavaScript.
2. TypeScript parsing and type erasure.
3. ES modules.

No TypeScript type checking in first release.

## Upstream roles
- Loupe: browser Worker instrumentation and queue visual concepts.
- JSV9000 server: worker execution and event reduction ideas.
- JSV9000 client: layout and forward playback ideas.
- New code: trace protocol, browser adapter, snapshots, backward stepping, safety controls.

## Verification
### Test:
- Synchronous calls
- Promise before timer
- Nested callbacks
- Runtime errors
- Infinite-loop termination
- Unsupported API errors
- Next
- Previous
- Replay
- Reset
- Deterministic event order
- Responsive UI during Worker termination

## Decisions captured
- Separate adapters.
- Browser Worker first.
- Optional server adapter later.
- Concepts only until licenses verified.
- CONTEXT.md
- .github/copilot-instructions.md
- 2 seconds
- 10,000 events
- Parse and erase TypeScript types only
- Loupe plus JSV9000 visual style