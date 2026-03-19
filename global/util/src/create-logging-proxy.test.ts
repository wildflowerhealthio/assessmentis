import { describe, expect, it, vi } from 'vitest'

import { createLoggingProxy } from './create-logging-proxy'
import type { MethodCallLog } from './create-logging-proxy'

describe('createLoggingProxy', () => {
  describe('synchronous methods', () => {
    it('logs method name, args, and result for sync calls', () => {
      const target = {
        add: (a: number, b: number) => a + b,
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      const result = proxy.add(2, 3)

      expect(result).toBe(5)
      expect(logs).toEqual([{ args: [2, 3], method: 'add', result: 5 }])
    })

    it('passes through non-function properties unchanged', () => {
      const target = { count: 42, name: 'test' }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      expect(proxy.name).toBe('test')
      expect(proxy.count).toBe(42)
      expect(logs).toHaveLength(0)
    })

    it('preserves `this` binding for the target object', () => {
      const target = {
        getValue() {
          return this.value
        },
        value: 10,
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      expect(proxy.getValue()).toBe(10)
      expect(logs).toEqual([{ args: [], method: 'getValue', result: 10 }])
    })
  })

  describe('async methods', () => {
    it('logs resolved value for async calls', async () => {
      const target = {
        fetch: (id: string) => Promise.resolve({ data: 'ok', id }),
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      const result = await proxy.fetch('123')

      expect(result).toEqual({ data: 'ok', id: '123' })
      expect(logs).toEqual([
        { args: ['123'], method: 'fetch', resolved: { id: '123', data: 'ok' } },
      ])
    })

    it('logs rejection for failed async calls', async () => {
      const err = new Error('boom')
      const target = {
        fail: () => Promise.reject(err),
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      await expect(proxy.fail()).rejects.toThrow('boom')
      expect(logs).toEqual([{ args: [], error: err, method: 'fail' }])
    })
  })

  describe('multiple methods', () => {
    it('logs calls to different methods independently', () => {
      const target = {
        add: (a: number, b: number) => a + b,
        greet: (name: string) => `hello ${name}`,
      }
      const log = vi.fn()
      const proxy = createLoggingProxy(target, log)

      proxy.greet('world')
      proxy.add(1, 2)

      expect(log).toHaveBeenCalledTimes(2)
      expect(log).toHaveBeenCalledWith({
        args: ['world'],
        method: 'greet',
        result: 'hello world',
      })
      expect(log).toHaveBeenCalledWith({
        args: [1, 2],
        method: 'add',
        result: 3,
      })
    })
  })
})
