import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(process.env.PRIVATE_STORAGE_DIR || './storage/private')

function resolveStoragePath(storageKey) {
  const key = String(storageKey || '')
  if (!key || key.includes('\0') || path.isAbsolute(key)) throw Object.assign(new Error('非法存储路径'), { code: 'INVALID_STORAGE_KEY', status: 500 })
  const target = path.resolve(root, key)
  const relative = path.relative(root, target)
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    throw Object.assign(new Error('非法存储路径'), { code: 'INVALID_STORAGE_KEY', status: 500 })
  }
  return target
}

export const localFileStorage = Object.freeze({
  async put(storageKey, buffer) {
    const target = resolveStoragePath(storageKey)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, buffer, { flag: 'w' })
  },
  async get(storageKey) {
    return fs.readFile(resolveStoragePath(storageKey))
  },
  async remove(storageKey) {
    await fs.rm(resolveStoragePath(storageKey), { force: true })
  },
  resolve(storageKey) {
    return resolveStoragePath(storageKey)
  }
})

export function getFileStorageAdapter() {
  return localFileStorage
}
