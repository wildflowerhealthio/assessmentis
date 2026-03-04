import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Effect, Option } from 'effect'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { makeCreateResourcePage } from './makeCreateResourcePage'
import type { ResourcePagesConfig } from './resourcePagesConfigType'

// --- Mocks ---------------------------------------------------------------

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../global/components/BreadcrumbProvider/useBreadcrumbs', () => ({
  useBreadcrumbs: vi.fn(),
}))

vi.mock('../../../layers/PlatformContext', () => ({
  usePlatformContext: () => ({
    clinicalDataRepositoryService: {},
  }),
}))

// --- Test helpers --------------------------------------------------------

/** Minimal FormComponent that renders a submit button calling onSubmit with test data */
function TestForm({
  onSubmit,
  submitLabel,
}: {
  onSubmit: (data: { name: string }) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<unknown>
}) {
  return (
    <button onClick={() => onSubmit({ name: 'New Item' })}>
      {submitLabel}
    </button>
  )
}

function createTestConfig(
  overrides: Partial<ResourcePagesConfig<any, any>> = {}
): ResourcePagesConfig<any, any> {
  return {
    resourceType: 'TestResource',
    singularLabel: 'Test Resource',
    pluralLabel: 'Test Resources',
    paramName: 'testResourceId',
    decodeUrl: (s: string) => Option.some(ReadonlyUrl.make({ pathname: s })),
    getDisplayName: () => 'Display Name',
    schema: {} as never,
    FormComponent: TestForm as never,
    defaultFormValues: { name: '' },
    extractFormValues: () => ({ name: '' }),
    createAction: () =>
      Effect.succeed({ id: 'created-123', resourceType: 'TestResource' }),
    updateAction: () =>
      Effect.succeed({ id: 'updated-123', resourceType: 'TestResource' }),
    getListSummaryItems: () => [],
    ...overrides,
  }
}

function renderPage(config = createTestConfig()) {
  const Page = makeCreateResourcePage(config)
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>
  )
}

// --- Tests ---------------------------------------------------------------

describe('CreateResourcePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title with singular label', () => {
    renderPage()
    expect(screen.getByText('Create New Test Resource')).toBeDefined()
  })

  it('renders the form with "Save" as submit label', () => {
    renderPage()
    expect(screen.getByText('Save')).toBeDefined()
  })

  it('calls createAction and navigates to detail page on submit', async () => {
    const createAction = vi.fn(() =>
      Effect.succeed({
        url: 'http://example.com/new-456',
        domainType: 'TestResource',
      })
    )
    const config = createTestConfig({ createAction })

    renderPage(config)

    const user = userEvent.setup()
    await user.click(screen.getByText('Save'))

    expect(createAction).toHaveBeenCalledWith({ name: 'New Item' })
    expect(mockNavigate).toHaveBeenCalledWith(
      `/TestResource/${encodeURIComponent('http://example.com/new-456')}`
    )
  })
})
