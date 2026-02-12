# @assessmentis/react-util

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Shared React components, hooks, and utilities used across Assessment.is React applications, with specialized hooks for integrating Effect-TS patterns into React.

## What This Package Does

- Provides reusable React components
- Offers custom hooks for common patterns (promises, collections, Effects)
- Integrates Effect-TS Stream and Effect with React lifecycle
- Supports UI development across applications

## Dependencies

This package requires:

- **React 19.x** - Core React library
- **React DOM 19.x** - React DOM rendering
- **Effect-TS** - Functional effect system (provided by consuming applications)
- **uuid 13.x** - UUID generation for collections

## Hooks

### Effect-TS Integration Hooks

#### `useStream<A, E>(stream: Stream.Stream<A, E, Scope.Scope>): Promise<A>`

Subscribe to an Effect Stream and get the latest emitted value as a Promise. The stream is automatically scoped and interrupted on component unmount.

**Use case:** Integrating Effect streams into React components for real-time data updates.

**Example:**

```typescript
import { useStream } from '@assessmentis/react-util'
import { Stream, Effect } from 'effect'

function DataComponent() {
  // Simple stream of static data values
  const dataStream = Stream.make(1, 2, 3, 4, 5)

  // Get the latest value as a Promise
  const dataPromise = useStream(dataStream)

  return <Suspense fallback="Loading...">
    {use(dataPromise)}
  </Suspense>
}
```

**Key features:**

- Automatically resets promise when stream dependency changes
- Handles stream interruption on unmount
- Converts Effect failures and defects to Promise rejections
- Logs stream completion and errors to console

---

#### `useEffectTs<A, E>(effect: Effect.Effect<A, E, Scope.Scope>): Promise<A>`

Run an Effect and get the result as a Promise. The effect is automatically scoped and interrupted on component unmount.

**Use case:** Running Effect-based computations in React components.

**Example:**

```typescript
import { useEffectTs } from '@assessmentis/react-util'
import { Effect } from 'effect'

function UserProfile({ userId }: { userId: string }) {
  // Effect that fetches user data
  const fetchUserEffect = Effect.succeed({ name: 'John', id: userId })

  const userPromise = useEffectTs(fetchUserEffect)

  return <Suspense fallback="Loading user...">
    {use(userPromise).name}
  </Suspense>
}
```

**Key features:**

- Automatically interrupts effect on unmount
- Converts Effect failures to Promise rejections
- Handles AggregateError for multiple failures/defects
- Scopes the effect automatically

---

#### `useStatePromise<A>(): [Promise<A>, { resolve, reject, reset, map }]`

Create a controllable promise with explicit resolve/reject/reset capabilities. This is the foundation for many other hooks in this package.

**Use case:** Managing asynchronous state that needs to be controlled imperatively.

**Example:**

```typescript
import { useStatePromise } from '@assessmentis/react-util'

function UserForm() {
  const [userPromise, { resolve, reject, reset }] = useStatePromise<User>()

  const handleSubmit = async (data: UserData) => {
    try {
      const user = await createUser(data)
      resolve(user) // Resolves the promise
    } catch (error) {
      reject(error) // Rejects the promise
    }
  }

  const handleCancel = () => {
    reset() // Creates a new pending promise
  }

  return (
    <form onSubmit={handleSubmit}>
      <Suspense fallback="Submitting...">
        {/* User promise resolves when form submits */}
      </Suspense>
    </form>
  )
}
```

**API:**

- `resolve(value: A)` - Resolves the promise with a value
- `reject(reason: unknown)` - Rejects the promise with an error
- `reset()` - Creates a new pending promise (only if current promise is resolved)
- `map(fn: (a: A) => A)` - Transform the resolved value

**Key features:**

- Promise can be resolved/rejected multiple times (creates new promise each time)
- `map` allows transforming the value before resolution
- Prevents duplicate resets if promise is still pending

---

### Promise State Management Hooks

#### `useLoadingPromise<T>(promise: Promise<T>): LoadingPromiseState<T>`

Track the state of a promise, providing loading, value, and error states. This is essential for displaying loading indicators and error messages.

**Type:**

```typescript
type LoadingPromiseState<T> =
  | { value: T; loading: false; error: undefined }
  | { value: undefined; loading: true; error: undefined }
  | { value: undefined; loading: false; error: unknown }
```

**Use case:** Displaying loading states, values, and errors for asynchronous operations.

**Example:**

```typescript
import { useLoadingPromise } from '@assessmentis/react-util'

function UserProfile({ userId }: { userId: string }) {
  const fetchUserPromise = fetchUser(userId)
  const { value, loading, error } = useLoadingPromise(fetchUserPromise)

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (value) return <UserDetails user={value} />
}
```

**Key features:**

- Type-safe discriminated union for state
- Automatically resets to loading when promise changes
- Cancels state updates if component unmounts
- Only one of `value`, `loading`, or `error` is present at a time

---

#### `usePromiseOrDefault<T>(promise: Promise<T>, defaultValue: T): T`

Use a promise value with a fallback default. Returns the default value while the promise is pending or if it rejects.

**Use case:** Providing a safe fallback value for promises.

**Example:**

```typescript
import { usePromiseOrDefault } from '@assessmentis/react-util'

function UserGreeting({ userId }: { userId: string }) {
  const userName = usePromiseOrDefault(
    fetchUserName(userId),
    'Guest' // Default value shown while loading or on error
  )

  return <h1>Welcome, {userName}!</h1>
}
```

**Key features:**

- Returns default value immediately
- Updates to promise value when resolved
- Falls back to default on rejection
- Resets to default when promise changes or component unmounts

---

### Collection Management Hooks

#### `useCollection<T>({ apiDelete, apiCreate }, initial: T[])`

Manage a collection with optimistic updates for create/delete operations. Uses local state for immediate UI updates.

**Use case:** Managing lists of items with create/delete operations and loading states.

**Example:**

```typescript
import { useCollection } from '@assessmentis/react-util'

type Todo = { id?: string; text: string; done: boolean }

function TodoList() {
  const { collection, createItem, deleteItem } = useCollection<Todo>(
    {
      apiCreate: async (todo) => {
        const response = await fetch('/api/todos', {
          method: 'POST',
          body: JSON.stringify(todo)
        })
        return response.json()
      },
      apiDelete: async (id) => {
        await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      }
    },
    [] // Initial empty collection
  )

  return (
    <div>
      {collection.map(({ data, loading }) => (
        <div key={data.id} className={loading ? 'opacity-50' : ''}>
          {data.text}
          <button onClick={() => deleteItem(data.id)}>Delete</button>
        </div>
      ))}
      <button onClick={() => createItem({ text: 'New todo', done: false })}>
        Add Todo
      </button>
    </div>
  )
}
```

**API:**

- `collection: Array<{ data: T, loading: boolean }>` - Current collection state
- `createItem(item: T)` - Optimistically create item (generates UUID if no id)
- `deleteItem(id: string)` - Optimistically delete item

**Key features:**

- Optimistic updates with loading indicators
- Automatic rollback on API failure
- UUID generation for new items without ids
- Loading state per item for granular UI feedback

---

#### `useCollectionPromise<T>({ apiDelete, apiCreate }, initial: Promise<T[]>)`

Like `useCollection`, but accepts an initial promise instead of a value. Useful when the initial collection needs to be loaded asynchronously.

**Use case:** Managing collections that need to be fetched on mount.

**Example:**

```typescript
import { useCollectionPromise } from '@assessmentis/react-util'

function TodoList() {
  const { collectionPromise, createItem, deleteItem } = useCollectionPromise<Todo>(
    {
      apiCreate: createTodoApi,
      apiDelete: deleteTodoApi
    },
    fetch('/api/todos').then(r => r.json()) // Initial load from API
  )

  return (
    <Suspense fallback="Loading todos...">
      <TodoListView
        collection={use(collectionPromise)}
        onDelete={deleteItem}
        onCreate={createItem}
      />
    </Suspense>
  )
}
```

**API:**

- `collectionPromise: Promise<Array<{ data: T, loading: boolean }>>` - Promise of collection state
- `createItem(item: T)` - Optimistically create item
- `deleteItem(id: string)` - Optimistically delete item

**Key features:**

- Same optimistic updates as `useCollection`
- Works with React Suspense
- Promise-based API for async initialization

---

### UI Utility Hooks

#### `useOutsideClickHandler(ref: RefObject<Node>, handler: () => void)`

Detect clicks outside a referenced element and call a handler. Useful for closing dropdowns, modals, and popovers.

**Use case:** Closing UI elements when clicking outside them.

**Example:**

```typescript
import { useOutsideClickHandler } from '@assessmentis/react-util'
import { useRef, useState } from 'react'

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useOutsideClickHandler(dropdownRef, () => setIsOpen(false))

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <ul>
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      )}
    </div>
  )
}
```

**Key features:**

- Listens to `mousedown` events on document
- Automatically cleans up event listener on unmount
- Checks if click target is within referenced element
- Safe against null refs and non-Node targets

---

## Testing Patterns

This package follows the project's property-based testing philosophy. For comprehensive testing patterns and guidelines, see:

- [TESTING.md](../../TESTING.md) - Property-based testing with fast-check
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development setup and contribution guidelines

### Testing Hooks

When testing React hooks:

1. Use property-based tests to verify hook behavior across many inputs
2. Test cleanup behavior (unmount, dependency changes)
3. Test error cases and edge conditions
4. Ensure promises/effects are properly cancelled on unmount

**Example property test pattern:**

```typescript
import { renderHook } from '@testing-library/react'
import { fc } from 'fast-check'
import { usePromiseOrDefault } from './usePromiseOrDefault'

it('should return default while pending', () => {
  fc.assert(
    fc.property(fc.string(), (defaultValue) => {
      const { result } = renderHook(() =>
        usePromiseOrDefault(new Promise(() => {}), defaultValue)
      )
      expect(result.current).toBe(defaultValue)
    })
  )
})
```

## Important Guidelines

### ✅ DO:

- Write comprehensive component tests
- Document component props clearly
- Use TypeScript for all components
- Clean up subscriptions and effects on unmount
- Use property-based testing for hook behavior

### ❌ DON'T:

- Add business logic (use domain packages)
- Add application-specific components (keep generic)
- Forget to handle promise/effect cancellation
- Ignore Error boundaries for Effect-based hooks

## Related Packages

- Used by: `apps/frontend` and other React applications
- Depends on: Effect-TS for functional effects and streams
