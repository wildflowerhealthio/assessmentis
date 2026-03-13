import { describe, expect, it, vi } from 'vitest'

import {
  createLoggingProxy,
  type MethodCallLog,
} from './createLoggingProxy'

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
      expect(logs).toEqual([{ method: 'add', args: [2, 3], result: 5 }])
    })

    it('passes through non-function properties unchanged', () => {
      const target = { name: 'test', count: 42 }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      expect(proxy.name).toBe('test')
      expect(proxy.count).toBe(42)
      expect(logs).toHaveLength(0)
    })

    it('preserves `this` binding for the target object', () => {
      const target = {
        value: 10,
        getValue() {
          return this.value
        },
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      expect(proxy.getValue()).toBe(10)
      expect(logs).toEqual([
        { method: 'getValue', args: [], result: 10 },
      ])
    })
  })

  describe('async methods', () => {
    it('logs resolved value for async calls', async () => {
      const target = {
        fetch: async (id: string) => ({ id, data: 'ok' }),
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      const result = await proxy.fetch('123')

      expect(result).toEqual({ id: '123', data: 'ok' })
      expect(logs).toEqual([
        { method: 'fetch', args: ['123'], resolved: { id: '123', data: 'ok' } },
      ])
    })

    it('logs rejection for failed async calls', async () => {
      const err = new Error('boom')
      const target = {
        fail: async () => {
          throw err
        },
      }
      const logs: MethodCallLog[] = []
      const proxy = createLoggingProxy(target, (entry) => logs.push(entry))

      await expect(proxy.fail()).rejects.toThrow('boom')
      expect(logs).toEqual([
        { method: 'fail', args: [], error: err },
      ])
    })
  })

  describe('multiple methods', () => {
    it('logs calls to different methods independently', () => {
      const target = {
        greet: (name: string) => `hello ${name}`,
        add: (a: number, b: number) => a + b,
      }
      const log = vi.fn()
      const proxy = createLoggingProxy(target, log)

      proxy.greet('world')
      proxy.add(1, 2)

      expect(log).toHaveBeenCalledTimes(2)
      expect(log).toHaveBeenCalledWith({
        method: 'greet',
        args: ['world'],
        result: 'hello world',
      })
      expect(log).toHaveBeenCalledWith({
        method: 'add',
        args: [1, 2],
        result: 3,
      })
    })
  })
})
