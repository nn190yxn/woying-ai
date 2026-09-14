import process from 'node:process'
import { initDB } from '../models/db.js'
import { startTaskWorker } from '../services/asyncTasks.js'
import '../services/fileCleanupTask.js'
import '../services/mediaTasks.js'

const intervalMs = Math.max(100, Number(process.env.TASK_WORKER_INTERVAL_MS) || 1000)
let stopWorker = null
let shuttingDown = false

async function start() {
  await initDB()
  stopWorker = startTaskWorker(intervalMs)
  console.log(`[task-worker] started, interval=${intervalMs}ms`)
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  stopWorker?.()
  console.log(`[task-worker] stopped by ${signal}`)
  process.exitCode = 0
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))

start().catch(error => {
  console.error(`[task-worker] startup failed: ${error.message}`)
  process.exitCode = 1
})
