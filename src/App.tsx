import { useEffect, useRef, useState } from 'react'
import type { TraceEvent, TraceSnapshot, WorkerEvent } from './protocol/events'

const DEFAULT_SOURCE = `console.log('start')
setTimeout(() => {
  console.log('timer fired')
  queueMicrotask(() => console.log('microtask'))
}, 0)

Promise.resolve().then(() => console.log('promise'))
console.log('end')`

function emptySnapshot(): TraceSnapshot {
  return {
    event: { type: 'run:start', source: '' },
    stack: [],
    webApis: [],
    tasks: [],
    microtasks: [],
    console: [],
  }
}

function applyEvent(previous: TraceSnapshot | null, event: TraceEvent): TraceSnapshot {
  const snapshot: TraceSnapshot = previous
    ? {
        event,
        stack: [...previous.stack],
        webApis: [...previous.webApis],
        tasks: [...previous.tasks],
        microtasks: [...previous.microtasks],
        console: [...previous.console],
      }
    : emptySnapshot()

  switch (event.type) {
    case 'stack:push':
      snapshot.stack.push(event.name)
      break
    case 'stack:pop':
      snapshot.stack.pop()
      break
    case 'timer:create':
      snapshot.webApis.push(`timer ${event.id}`)
      break
    case 'task:add':
      snapshot.tasks.push(event.label)
      break
    case 'task:take':
      snapshot.tasks.shift()
      break
    case 'microtask:add':
      snapshot.microtasks.push(event.label)
      break
    case 'microtask:take':
      snapshot.microtasks.shift()
      break
    case 'console':
      snapshot.console.push(event.value)
      break
    default:
      break
  }

  snapshot.event = event
  return snapshot
}

function describeEvent(event: TraceEvent | null): string {
  if (!event) return 'No trace data yet.'

  switch (event.type) {
    case 'run:start':
      return 'Worker initialized for the current script.'
    case 'stack:push':
      return `Pushed ${event.name} onto the stack.`
    case 'stack:pop':
      return `Popped ${event.name} from the stack.`
    case 'timer:create':
      return `Created timer ${event.id} with ${event.delay}ms delay.`
    case 'task:add':
      return `Queued task: ${event.label}`
    case 'task:take':
      return `Drained task: ${event.label}`
    case 'microtask:add':
      return 'Queued a microtask.'
    case 'microtask:take':
      return 'Executed the next microtask.'
    case 'console':
      return `Console output: ${event.value}`
    case 'run:error':
      return `Runtime error: ${event.message}`
    case 'run:limit':
      return `Execution limit reached: ${event.message}`
    case 'run:end':
      return 'The script finished cleanly.'
    default:
      return 'Trace event observed.'
  }
}

function App() {
  const workerRef = useRef<Worker | null>(null)
  const [source, setSource] = useState(DEFAULT_SOURCE)
  const [snapshots, setSnapshots] = useState<TraceSnapshot[]>([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    const worker = new Worker(new URL('./worker/executor.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    const handleMessage = (message: MessageEvent<WorkerEvent>) => {
      if (message.data.type === 'event') {
        const event = message.data.event

        setSnapshots((previous) => {
          const next = [...previous, applyEvent(previous[previous.length - 1] ?? null, event)]
          setIndex(next.length - 1)
          return next
        })

        if (event.type === 'run:error' || event.type === 'run:limit') {
          setStatus('error')
          setError(event.message)
        }

        if (event.type === 'run:end') {
          setStatus('done')
        }
      }

      if (message.data.type === 'done') {
        setStatus((previous) => (previous === 'error' ? 'error' : 'done'))
      }
    }

    worker.addEventListener('message', handleMessage)

    return () => {
      worker.removeEventListener('message', handleMessage)
      worker.terminate()
    }
  }, [])

  const current = snapshots[index] ?? emptySnapshot()
  const queues: [string, string[]][] = [
    ['Call stack', current.stack],
    ['Web APIs', current.webApis],
    ['Task queue', current.tasks],
    ['Microtask queue', current.microtasks],
    ['Console', current.console],
  ]
  const buttonClass = 'cursor-pointer border border-[#19312d] bg-[#19312d] px-[13px] py-[9px] font-mono text-[.72rem] text-[#fbfaf6] hover:border-[#bd4d34] hover:bg-[#bd4d34] disabled:cursor-not-allowed disabled:opacity-35'

  const run = () => {
    if (!workerRef.current) return
    setStatus('running')
    setError('')
    setSnapshots([])
    setIndex(0)
    workerRef.current.postMessage({ type: 'run', source })
  }

  const stop = () => {
    workerRef.current?.postMessage({ type: 'stop' })
    setStatus('idle')
  }

  const reset = () => {
    setSnapshots([])
    setIndex(0)
    setStatus('idle')
    setError('')
  }

  const previous = () => {
    if (!snapshots.length) return
    setIndex((value) => Math.max(0, value - 1))
  }

  const next = () => {
    if (!snapshots.length) return
    setIndex((value) => Math.min(snapshots.length - 1, value + 1))
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#f4f0e8] font-serif text-[#19312d]">
      <main className="mx-auto max-w-375 px-[clamp(18px,4vw,64px)] py-9.5">
      <header className="mb-6 flex items-center justify-between gap-4 border-b border-[#b9b9a9] pb-7">
        <div>
          <p className="font-mono text-[.7rem] leading-[1.2] font-bold uppercase text-[#bd4d34]">browser tracing</p>
          <h1 className="text-[clamp(2rem,5vw,4.8rem)] leading-[.95] font-medium">Event Loop Visualizer</h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-[.8rem]" aria-live="polite">
          <span className={`size-2.25 rounded-full ${status === 'running' ? 'animate-pulse bg-[#bd4d34]' : 'bg-[#8e9185]'}`} />
          <strong>{status}</strong>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4.5 min-[901px]:grid-cols-[minmax(280px,0.9fr)_minmax(400px,1.6fr)]">
        <section className="min-h-157.5 border border-[#b9b9a9] bg-[#fbfaf6] max-[900px]:min-h-0">
          <div className="flex items-center justify-between gap-4 border-b border-[#d5d4c9] px-3.75 py-3.25 font-mono text-[.72rem] uppercase text-[#68736b]">
            <span>Script</span>
          </div>
          <textarea className="block min-h-145 w-full resize-none border-0 bg-transparent p-5 font-mono text-base leading-[1.7] text-[#19312d] outline-none max-[900px]:min-h-90" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} />
        </section>

        <section className="min-h-157.5 border border-[#b9b9a9] bg-[#fbfaf6] max-[900px]:min-h-0">
          <div className="flex items-end justify-between gap-4 border-b border-[#d5d4c9] p-6 max-[900px]:flex-col max-[900px]:items-start">
            <div>
              <h2 className="text-[1.8rem] font-medium">Runtime trace</h2>
            </div>
            <div className="flex flex-wrap justify-end gap-1.75 max-[900px]:justify-start">
              <button className={buttonClass} type="button" onClick={run}>Run</button>
              <button className={buttonClass} type="button" onClick={stop}>Stop</button>
              <button className={buttonClass} type="button" onClick={previous}>Previous</button>
              <button className={buttonClass} type="button" onClick={next}>Next</button>
              <button className={buttonClass} type="button" onClick={reset}>Reset</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-[#d5d4c9]">
            {queues.map(([label, items]) => (
              <div className="min-h-32.5 bg-[#fbfaf6] last:col-span-2 last:min-h-42.5" key={label}>
                <div className="flex items-center justify-between gap-4 border-b border-[#d5d4c9] px-3.75 py-3.25 font-mono text-[.72rem] uppercase text-[#68736b]"><span>{label}</span></div>
                {items.length ? items.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="mx-3.25 my-2.5 wrap-anywhere border-l-3 border-[#bd4d34] bg-[#f0eee5] p-2.5 font-mono text-[.8rem]">{item}</div>
                )) : <div className="px-3.25 py-4 font-mono text-[.8rem] text-[#9a9c91]">empty</div>}
              </div>
            ))}
          </div>

          <div className="grid gap-2 border-t border-[#d5d4c9] px-6 py-5 font-mono text-[.8rem]">
            <span className="uppercase text-[#68736b]">Step detail</span>
            <strong className="font-normal">{current.event.type}</strong>
            <div>{describeEvent(current.event)}</div>
            {error ? <div className="border-l-2 border-[#bd4d34] bg-[#f0eee5] p-3 text-[#8f3027]">{error}</div> : null}
          </div>
        </section>
      </div>
      </main>
    </div>
  )
}

export default App
