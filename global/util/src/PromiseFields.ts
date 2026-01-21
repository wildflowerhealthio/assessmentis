import { isPromise } from 'effect/Predicate'

export type PromiseFields<O extends object> = {
  [k in keyof O]: Promise<O[k]>
}

export const promiseFieldsFromPromise = <O extends object>(
  promise: Promise<O>
) => {
  const proxy: ProxyHandler<PromiseFields<O>> = {
    async get(_target, prop) {
      const obj = await promise
      if (prop in obj) {
        return obj[prop as keyof O]
      }
      return undefined
    },
  }

  return new Proxy({} as PromiseFields<O>, proxy)
}

export const promiseFieldsFromObject = <O extends object>(obj: O) => {
  const proxy: ProxyHandler<PromiseFields<O>> = {
    async get(_target, prop) {
      if (prop in obj) return Promise.resolve(obj[prop as keyof O])

      return undefined
    },
  }

  return new Proxy({} as PromiseFields<O>, proxy)
}

export const fromPromiseFields = async <O extends object>(
  promiseFields: O
): Promise<{ [K in keyof O]: O[K] extends Promise<infer U> ? U : O[K] }> => {
  const result = {} as {
    [K in keyof O]: O[K] extends Promise<infer U> ? U : O[K]
  }
  const entryPromises = Object.entries(promiseFields).map(
    async ([key, value]) =>
      [key, isPromise(value) ? await value : value] as [
        keyof O,
        O[keyof O] extends Promise<infer U> ? U : O[keyof O],
      ]
  )
  const entries = await Promise.all(entryPromises)

  for (const pair of entries) {
    result[pair[0]] = pair[1]
  }
  return result
}
