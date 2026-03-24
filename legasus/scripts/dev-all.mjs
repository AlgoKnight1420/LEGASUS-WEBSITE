import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFilePath)
const projectRoot = path.resolve(currentDir, '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const formatPrefix = (label) => `[${label}]`

const pipeWithPrefix = (stream, target, label) => {
  let buffer = ''

  stream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    lines.forEach((line) => {
      if (line.trim()) {
        target.write(`${formatPrefix(label)} ${line}\n`)
      }
    })
  })

  stream.on('end', () => {
    if (buffer.trim()) {
      target.write(`${formatPrefix(label)} ${buffer}\n`)
    }
  })
}

const runCommand = (label, args) => {
  const child = spawn([npmCommand, ...args].join(' '), {
    cwd: projectRoot,
    env: process.env,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  pipeWithPrefix(child.stdout, process.stdout, label)
  pipeWithPrefix(child.stderr, process.stderr, label)

  return child
}

const frontend = runCommand('frontend', ['run', 'dev'])
const backend = runCommand('backend', ['run', 'server:dev'])

console.log('Starting Legasus frontend and backend...')
console.log('Frontend: http://localhost:5173/')
console.log('Backend:  http://localhost:4000/api/health')
console.log('Press Ctrl+C to stop both.\n')

let isShuttingDown = false

const shutdown = (exitCode = 0) => {
  if (isShuttingDown) return
  isShuttingDown = true

  frontend.kill()
  backend.kill()

  setTimeout(() => {
    process.exit(exitCode)
  }, 300)
}

frontend.on('exit', (code) => {
  if (isShuttingDown) return
  process.stderr.write(`\n${formatPrefix('frontend')} exited with code ${code ?? 0}\n`)
  shutdown(code ?? 0)
})

backend.on('exit', (code) => {
  if (isShuttingDown) return
  process.stderr.write(`\n${formatPrefix('backend')} exited with code ${code ?? 0}\n`)
  shutdown(code ?? 0)
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
