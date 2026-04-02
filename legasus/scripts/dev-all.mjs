import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFilePath)
const projectRoot = path.resolve(currentDir, '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const portsToReset = [4000, 5173]

const formatPrefix = (label) => `[${label}]`
const activeChildren = new Set()
const portResetAttempts = 10
const portResetDelayMs = 500

const quoteWindowsArg = (value) => {
  const stringValue = String(value)

  if (!stringValue.length) return '""'
  if (!/[\s"]/u.test(stringValue)) return stringValue

  return `"${stringValue.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1')}"`
}

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

const readStream = (stream) =>
  new Promise((resolve) => {
    let buffer = ''

    if (!stream) {
      resolve(buffer)
      return
    }

    stream.on('data', (chunk) => {
      buffer += chunk.toString()
    })

    stream.on('end', () => resolve(buffer))
  })

const waitForExit = (child) =>
  new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Process exited with code ${code ?? 'unknown'}.`))
    })
  })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runCommand = (label, args) => {
  const command =
    process.platform === 'win32'
      ? {
          file: process.env.ComSpec ?? 'cmd.exe',
          args: ['/d', '/c', `${npmCommand} ${args.map(quoteWindowsArg).join(' ')}`],
        }
      : {
          file: npmCommand,
          args,
        }

  const child = spawn(command.file, command.args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  })

  activeChildren.add(child)
  pipeWithPrefix(child.stdout, process.stdout, label)
  pipeWithPrefix(child.stderr, process.stderr, label)
  child.on('exit', () => {
    activeChildren.delete(child)
  })
  child.on('error', (error) => {
    process.stderr.write(`${formatPrefix(label)} failed to start: ${error.message}\n`)
    void shutdown(1)
  })

  return child
}

const killChildTree = (child) =>
  new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve()
      return
    }

    const finish = () => resolve()
    child.once('exit', finish)

    if (process.platform === 'win32' && child.pid) {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      })

      killer.on('exit', () => resolve())
      killer.on('error', () => {
        child.kill('SIGTERM')
        setTimeout(resolve, 300)
      })
      return
    }

    child.kill('SIGTERM')
    setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL')
      }
      resolve()
    }, 300)
  })

const killPidTree = (pid) =>
  new Promise((resolve) => {
    if (!pid || pid === process.pid) {
      resolve()
      return
    }

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      })

      killer.on('exit', () => resolve())
      killer.on('error', () => resolve())
      return
    }

    const killer = spawn('kill', ['-TERM', String(pid)], {
      stdio: 'ignore',
      windowsHide: true,
    })

    killer.on('exit', () => resolve())
    killer.on('error', () => resolve())
  })

const getListeningPidsForPorts = async (ports) => {
  const targetPorts = new Set(ports.map((port) => String(port)))

  if (process.platform === 'win32') {
    const netstat = spawn('netstat', ['-ano', '-p', 'tcp'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    })
    const outputPromise = readStream(netstat.stdout)
    await waitForExit(netstat)
    const output = await outputPromise
    const pids = new Set()

    output.split(/\r?\n/).forEach((line) => {
      const parts = line.trim().split(/\s+/)

      if (parts.length < 5 || parts[0] !== 'TCP' || parts[3].toUpperCase() !== 'LISTENING') {
        return
      }

      const portMatch = parts[1].match(/:(\d+)$/)
      if (!portMatch || !targetPorts.has(portMatch[1])) return

      const pid = Number(parts[4])
      if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) {
        pids.add(pid)
      }
    })

    return [...pids]
  }

  const pids = new Set()
  await Promise.all(
    [...targetPorts].map(async (port) => {
      const lsof = spawn('lsof', ['-ti', `tcp:${port}`], {
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      })
      const outputPromise = readStream(lsof.stdout)

      try {
        await waitForExit(lsof)
      } catch {
        return
      }

      const output = await outputPromise
      output
        .split(/\r?\n/)
        .map((value) => Number(value.trim()))
        .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid)
        .forEach((pid) => pids.add(pid))
    }),
  )

  return [...pids]
}

const resetPorts = async (ports) => {
  const pids = await getListeningPidsForPorts(ports)

  if (!pids.length) return

  await Promise.all(pids.map((pid) => killPidTree(pid)))
}

const canListenOnPort = (port, host) =>
  new Promise((resolve) => {
    const probe = net.createServer()

    probe.unref()

    probe.once('error', (error) => {
      if (error?.code === 'EAFNOSUPPORT' || error?.code === 'EADDRNOTAVAIL') {
        resolve(true)
        return
      }

      resolve(false)
    })

    probe.listen({ port, host, exclusive: true }, () => {
      probe.close(() => resolve(true))
    })
  })

const isPortFree = async (port) => {
  const ipv4Free = await canListenOnPort(port, '127.0.0.1')
  const ipv6Free = await canListenOnPort(port, '::1')

  return ipv4Free && ipv6Free
}

const ensurePortsAvailable = async (ports) => {
  for (let attempt = 0; attempt < portResetAttempts; attempt += 1) {
    const blockedPorts = []

    for (const port of ports) {
      const free = await isPortFree(port)
      if (!free) blockedPorts.push(port)
    }

    if (!blockedPorts.length) return

    await resetPorts(blockedPorts)
    await delay(portResetDelayMs)
  }

  const stillBlocked = []
  for (const port of ports) {
    const free = await isPortFree(port)
    if (!free) stillBlocked.push(port)
  }

  if (stillBlocked.length) {
    throw new Error(`Ports still busy after cleanup: ${stillBlocked.join(', ')}`)
  }
}

let isShuttingDown = false

const shutdown = async (exitCode = 0) => {
  if (isShuttingDown) return
  isShuttingDown = true

  await Promise.all([...activeChildren].map((child) => killChildTree(child)))

  process.exit(exitCode)
}

const handleChildExit = (label, code) => {
  if (isShuttingDown) return
  process.stderr.write(`\n${formatPrefix(label)} exited with code ${code ?? 0}\n`)
  void shutdown(code ?? 0)
}

process.on('SIGINT', () => void shutdown(0))
process.on('SIGTERM', () => void shutdown(0))
process.on('SIGBREAK', () => void shutdown(0))

try {
  console.log(`Closing stale dev servers on ports ${portsToReset.join(' and ')}...`)
  await resetPorts(portsToReset)
  await ensurePortsAvailable(portsToReset)

  console.log('Starting Legasus frontend and backend...')
  console.log('Frontend: http://localhost:5173/')
  console.log('Backend:  http://localhost:4000/api/health')
  console.log('Press Ctrl+C to stop both.\n')

  const backend = runCommand('backend', ['run', 'server:dev'])
  const frontend = runCommand('frontend', ['run', 'dev:frontend'])

  frontend.on('exit', (code) => handleChildExit('frontend', code))
  backend.on('exit', (code) => handleChildExit('backend', code))
} catch (error) {
  process.stderr.write(`${formatPrefix('dev-all')} ${error instanceof Error ? error.message : 'Failed to start dev servers.'}\n`)
  process.exit(1)
}
