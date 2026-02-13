/* eslint-disable @typescript-eslint/consistent-type-imports */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Effect, Option, Either, Stream } from 'effect'
import { makeEditResourcePage } from './EditResourcePage'
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

// Mock useEitherStream to return a resolved promise with the resource
const mockResource = {
  id: 'res-123',
  resourceType: 'TestResource',
  name: 'Test',
}
vi.mock('@assessmentis/react-util', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@assessmentis/react-util')>()
  return {
    ...actual,
    useEitherStream: () => Promise.resolve(mockResource),
  }
})

vi.mock('../../../layers/PlatformContext', () => ({
  usePlatformContext: () => ({
    clinicalDataRepositoryService: {
      repositoryStream: () =>
        Stream.succeed(
          Either.right({ get: () => Effect.succeed(mockResource) })
        ),
    },
  }),
}))

// --- Test helpers --------------------------------------------------------

function TestForm({
  onSubmit,
  submitLabel,
}: {
  onSubmit: (data: { name: string }) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<unknown>
}) {
  return (
    <button onClick={() => onSubmit({ name: 'Updated' })}>{submitLabel}</button>
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
    decodeId: (raw) => (raw === 'invalid' ? Option.none() : Option.some(raw)),
    getDisplayName: (r: typeof mockResource) => r.name,
    schema: {} as never,
    FormComponent: TestForm as never,
    defaultFormValues: { name: '' },
    extractFormValues: (r: typeof mockResource) => ({ name: r.name }),
    createAction: () =>
      Effect.succeed({ id: 'x', resourceType: 'TestResource' }),
    updateAction: () =>
      Effect.succeed({ id: 'res-123', resourceType: 'TestResource' }),
    getListSummaryItems: () => [],
    ...overrides,
  }
}

function renderPage(config = createTestConfig(), resourceId = 'res-123') {
  const Page = makeEditResourcePage(config)
  return render(
    <MemoryRouter>
      <Page params={{ id: resourceId }} />
    </MemoryRouter>
  )
}

// --- Tests ---------------------------------------------------------------

describe('EditResourcePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 404 content when decodeId returns None', async () => {
    await act(async () => {
      renderPage(createTestConfig(), 'invalid')
    })

    expect(
      screen.getByText('This Test Resource could not be found.')
    ).toBeDefined()
  })

  it('renders the form with edit title for valid ID', async () => {
    await act(async () => {
      renderPage()
    })

    expect(screen.getByText('Edit Test Resource')).toBeDefined()
  })

  it('renders form with "Save" submit label', async () => {
    await act(async () => {
      renderPage()
    })

    expect(screen.getByText('Save')).toBeDefined()
  })

  it('calls updateAction and navigates on submit', async () => {
    const updateAction = vi.fn(() =>
      Effect.succeed({ id: 'res-123', resourceType: 'TestResource' })
    )
    const config = createTestConfig({ updateAction })

    await act(async () => {
      renderPage(config)
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('Save'))

    expect(updateAction).toHaveBeenCalledWith('res-123', mockResource, {
      name: 'Updated',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/TestResource/res-123')
  })

  it('shows Go Back and Hard Reload buttons on 404', async () => {
    await act(async () => {
      renderPage(createTestConfig(), 'invalid')
    })

    expect(screen.getByText('Go Back')).toBeDefined()
    expect(screen.getByText('Hard Reload Page')).toBeDefined()
  })
})
