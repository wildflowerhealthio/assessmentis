import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Effect, Option } from 'effect'
import { MemoryRouter } from 'react-router'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { act, render, screen } from '@testing-library/react'

import { makeResourceListIndexPage } from './makeResourceListIndexPage'
import type { ResourcePagesConfig } from './resourcePagesConfigType'

// --- Mocks ---------------------------------------------------------------

vi.mock('../../global/components/BreadcrumbProvider/useBreadcrumbs', () => ({
  useBreadcrumbs: vi.fn(),
}))

const mockDeleteItem = vi.fn(async () => {})
const mockCollectionData = [
  {
    data: {
      id: 'item-1',
      name: 'First Item',
      resourceType: 'TestResource',
    },
    loading: false,
  },
  {
    data: {
      id: 'item-2',
      name: 'Second Item',
      resourceType: 'TestResource',
    },
    loading: false,
  },
]

vi.mock('../../common/utils/createResourceCollectionHook', () => ({
  createResourceCollectionHook: () => () => ({
    collectionPromise: Promise.resolve(mockCollectionData),
    deleteItem: mockDeleteItem,
  }),
}))

// --- Test helpers --------------------------------------------------------

function createTestConfig(
  overrides: Partial<ResourcePagesConfig<any, any>> = {}
): ResourcePagesConfig<any, any> {
  return {
    resourceType: 'TestResource',
    singularLabel: 'Test Resource',
    pluralLabel: 'Test Resources',
    paramName: 'testResourceId',
    decodeUrl: (raw: string) =>
      Option.some(ReadonlyUrl.make({ pathname: raw })),
    getDisplayName: (r: { name: string }) => r.name,
    schema: {} as never,
    FormComponent: (() => null) as never,
    defaultFormValues: { name: '' },
    extractFormValues: () => ({ name: '' }),
    createAction: () =>
      Effect.succeed({ id: 'x', resourceType: 'TestResource' }),
    updateAction: () =>
      Effect.succeed({ id: 'x', resourceType: 'TestResource' }),
    getListSummaryItems: (r: { name: string }) => [`Summary for ${r.name}`],
    ...overrides,
  }
}

function renderPage(config = createTestConfig()) {
  const Page = makeResourceListIndexPage(config)
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>
  )
}

// --- Tests ---------------------------------------------------------------

describe('ResourceListIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title from pluralLabel', async () => {
    await act(async () => {
      renderPage()
    })
    expect(screen.getByText('Test Resources')).toBeDefined()
  })

  it('renders a create link with correct label', async () => {
    await act(async () => {
      renderPage()
    })
    const createLink = screen.getByText('Create New Test Resource')
    expect(createLink).toBeDefined()
    expect(createLink.getAttribute('href')).toBe('/TestResource/new')
  })

  it('renders list items with display names from config', async () => {
    await act(async () => {
      renderPage()
    })
    expect(screen.getByText('First Item')).toBeDefined()
    expect(screen.getByText('Second Item')).toBeDefined()
  })

  it('renders summary items from getListSummaryItems', async () => {
    await act(async () => {
      renderPage()
    })
    expect(screen.getByText('Summary for First Item')).toBeDefined()
    expect(screen.getByText('Summary for Second Item')).toBeDefined()
  })

  it('renders filter component when FilterComponent is defined', async () => {
    const config = createTestConfig({
      FilterComponent: () => (
        <div data-testid="filter-component">Filters Active</div>
      ),
    })

    await act(async () => {
      renderPage(config)
    })

    expect(screen.getByTestId('filter-component')).toBeDefined()
    expect(screen.getByText('Filters Active')).toBeDefined()
  })

  it('does not render filter slot when FilterComponent is undefined', async () => {
    await act(async () => {
      renderPage()
    })

    expect(screen.queryByTestId('filter-component')).toBeNull()
  })
})
