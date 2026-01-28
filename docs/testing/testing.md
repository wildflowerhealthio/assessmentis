# Testing

This project uses **Vitest** across all packages and prioritizes **property-based testing** over example-based testing. Where code interacts with external APIs, we use **VCR-style integration testing** to record and replay HTTP interactions deterministically.

## When to Use Each Approach

| Approach                                        | Use When                                                        |
| ----------------------------------------------- | --------------------------------------------------------------- |
| [Unit testing](./unit-testing.md)               | Testing pure domain logic, schemas, helpers, and Effect-TS code |
| [React unit testing](./react-unit-testing.md)   | Testing React components, hooks, and UI behavior                |
| [Integration testing](./integration-testing.md) | Testing code that calls external HTTP APIs (FHIR, OAuth, etc.)  |

## Key Principles

- **Property-based first**: Default to `fast-check` properties with `Arbitrary.make(Schema)` for data generation. Use example-based tests only for regressions and documentation.
- **MECE structure**: Tests should be Mutually Exclusive and Completely Exhaustive.
- **Concise and high-value**: A single powerful property test beats ten trivial example tests.
- **Colocate tests**: Place `*.test.ts` files next to the source files they test.
