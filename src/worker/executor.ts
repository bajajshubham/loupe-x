import type { TraceEvent, WorkerEvent, WorkerMessage } from '../protocol/events'

const MAX_EVENTS = 10_000
let eventCount = 0
let timerId = 0
let stopped = false

const send = (event: TraceEvent): void => {
  eventCount += 1
  if (eventCount > MAX_EVENTS) {
    stopped = true
    self.postMessage({ type: 'event', event: { type: 'run:limit', message: 'Event limit reached' } } satisfies WorkerEvent)
    return
  }
  self.postMessage({ type: 'event', event } satisfies WorkerEvent)
}

const run = (source: string): void => {
  eventCount = 0
  timerId = 0
  stopped = false
  send({ type: 'run:start', source })

  const tasks: Array<() => void> = []
  const microtasks: Array<() => void> = []
  const controlledConsole = { log: (...values: unknown[]) => send({ type: 'console', value: values.map(String).join(' ') }) }
  const controlledSetTimeout = (callback: () => void, delay = 0): number => {
    const id = ++timerId
    send({ type: 'timer:create', id, delay })
    tasks.push(() => {
      send({ type: 'task:take', label: `timer ${id}` })
      callback()
    })
    send({ type: 'task:add', label: `timer ${id}` })
    return id
  }
  const controlledQueueMicrotask = (callback: () => void): void => {
    microtasks.push(callback)
    send({ type: 'microtask:add', label: 'microtask' })
  }
  const controlledPromise = { resolve: (value?: unknown) => ({ then: (callback: (value: unknown) => void) => controlledQueueMicrotask(() => callback(value)) }) }

  try {
    const execute = new Function('console', 'setTimeout', 'queueMicrotask', 'Promise', source)
    send({ type: 'stack:push', name: 'global' })
    execute(controlledConsole, controlledSetTimeout, controlledQueueMicrotask, controlledPromise)
    send({ type: 'stack:pop', name: 'global' })
    while (!stopped && (microtasks.length || tasks.length)) {
      while (!stopped && microtasks.length) {
        send({ type: 'microtask:take', label: 'microtask' })
        microtasks.shift()?.()
      }
      if (!stopped) tasks.shift()?.()
    }
    if (!stopped) send({ type: 'run:end' })
  } catch (error) {
    send({ type: 'run:error', message: error instanceof Error ? error.message : String(error) })
  }
  self.postMessage({ type: 'done' } satisfies WorkerEvent)
}

self.onmessage = (message: MessageEvent<WorkerMessage>): void => {
  if (message.data.type === 'stop') {
    stopped = true
    return
  }
  if (message.data.type === 'run') run(message.data.source)
}
