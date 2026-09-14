import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('独立任务 Worker 在禁用轮询模式下可启动并自然退出', () => {
  const result = spawnSync(process.execPath, ['src/workers/asyncTaskWorker.js'], {
    cwd: backendDir,
    env: { ...process.env, NODE_ENV: 'test', DISABLE_TASK_WORKER: 'true' },
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /\[task-worker\] started/)
})
