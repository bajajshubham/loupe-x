export type TraceEvent =
  | { type: 'run:start'; source: string }
  | { type: 'stack:push'; name: string }
  | { type: 'stack:pop'; name: string }
  | { type: 'timer:create'; id: number; delay: number }
  | { type: 'task:add'; label: string }
  | { type: 'task:take'; label: string }
  | { type: 'microtask:add'; label: string }
  | { type: 'microtask:take'; label: string }
  | { type: 'console'; value: string }
  | { type: 'run:error'; message: string }
  | { type: 'run:limit'; message: string }
  | { type: 'run:end' }

export type WorkerMessage =
  | { type: 'run'; source: string }
  | { type: 'stop' }

export type WorkerEvent = { type: 'event'; event: TraceEvent } | { type: 'done' }

export type TraceSnapshot = {
  event: TraceEvent
  stack: string[]
  webApis: string[]
  tasks: string[]
  microtasks: string[]
  console: string[]
}
