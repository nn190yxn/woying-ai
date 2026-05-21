import { createMockRedis } from './mockRedis.js'
import { logger } from '../middleware/logger.js'

const USE_REAL_REDIS = process.env.USE_REAL_REDIS === 'true'

let redisInstance = createMockRedis()
logger.info('redis', 'Using in-memory mock')

if (USE_REAL_REDIS) {
  (async () => {
    try {
      const Redis = (await import('ioredis')).default
      const instance = new Redis(process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379', {
        maxRetriesPerRequest: 2,
        connectTimeout: 3000
      })

      let lastErrorTime = 0
      const ERROR_THROTTLE_MS = 60 * 1000
      instance.on('error', (err) => {
        const now = Date.now()
        if (now - lastErrorTime > ERROR_THROTTLE_MS) {
          logger.warn('redis', `Connection error: ${err.message}`)
          lastErrorTime = now
        }
      })

      instance.on('connect', () => {
        logger.info('redis', 'Connected')
      })

      await instance.ping()
      redisInstance = instance
      logger.info('redis', 'Ready')
    } catch (err) {
      logger.warn('redis', `Real Redis unavailable: ${err.message}`)
    }
  })()
}

export { redisInstance as redis }