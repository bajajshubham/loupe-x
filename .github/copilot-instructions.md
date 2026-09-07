# Project instructions

- Keep implementation minimal. Apply YAGNI.
- Reuse local abstractions before adding dependencies.
- Use plain Indian English in user-facing text.
- Do not use em dashes.
- Keep browser Worker execution separate from UI state.
- Keep one typed trace protocol for browser and future server adapters.
- Never run user code on main thread.
- Treat watchdog termination as abrupt. Do not promise `finally` cleanup.
- Verify changed behavior with focused tests or a production build.
- Do not copy upstream code until license status is verified.
