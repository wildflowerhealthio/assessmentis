# test-component

Generate comprehensive property-based tests for a React component.

**Component path:** $ARGUMENTS

## Steps

1. Read the component implementation at `$ARGUMENTS`
2. Identify the component's props interface
3. Analyze component logic and possible states
4. Create test file `$ARGUMENTS.test.tsx` (or add tests if exists)
5. Generate fast-check arbitraries for all props
6. Write property tests for rendering without errors
7. Write MECE (Mutually Exclusive, Completely Exhaustive) tests for all component states
8. Add accessibility checks (ARIA attributes, semantic HTML)
9. Run tests with `npm run test`
10. Fix any failing tests

## Example Property-Based Component Test

```typescript
import { render, screen } from '@testing-library/react'
import { fc } from 'fast-check'
import { MyComponent, MyComponentProps } from './MyComponent'

// Generate arbitrary props
const MyComponentPropsArb = fc.record<MyComponentProps>({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  count: fc.integer({ min: 0, max: 1000 }),
  status: fc.constantFrom('active', 'inactive', 'pending'),
  onAction: fc.constant(() => {})
})

describe('MyComponent', () => {
  it('should render without errors for all valid props', () => {
    fc.assert(
      fc.property(MyComponentPropsArb, (props) => {
        const { container } = render(<MyComponent {...props} />)
        expect(container).toBeInTheDocument()
      })
    )
  })

  it('should display title text', () => {
    fc.assert(
      fc.property(MyComponentPropsArb, (props) => {
        render(<MyComponent {...props} />)
        expect(screen.getByText(props.title)).toBeInTheDocument()
      })
    )
  })
})
```

## MECE State Coverage Example

```typescript
describe('MyComponent states', () => {
  // Partition component states completely

  describe('when status is active', () => {
    it('should display active indicator', () => {
      render(<MyComponent status="active" title="Test" count={5} />)
      expect(screen.getByRole('status')).toHaveTextContent('Active')
    })
  })

  describe('when status is inactive', () => {
    it('should display inactive indicator', () => {
      render(<MyComponent status="inactive" title="Test" count={5} />)
      expect(screen.getByRole('status')).toHaveTextContent('Inactive')
    })
  })

  describe('when status is pending', () => {
    it('should display pending indicator', () => {
      render(<MyComponent status="pending" title="Test" count={5} />)
      expect(screen.getByRole('status')).toHaveTextContent('Pending')
    })
  })
})
```

## Accessibility Checks

```typescript
it('should have proper ARIA labels', () => {
  render(<MyComponent title="Test" count={5} status="active" />)

  // Check for semantic HTML
  expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

  // Check for ARIA attributes
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
})
```

## Testing Guidelines

- Test properties, not specific examples (when possible)
- Use fast-check for prop generation
- Cover all component states exhaustively (MECE)
- Check accessibility (ARIA, semantic HTML)
- Test user interactions with `@testing-library/user-event`
- Avoid testing implementation details
- Focus on component behavior from user perspective
