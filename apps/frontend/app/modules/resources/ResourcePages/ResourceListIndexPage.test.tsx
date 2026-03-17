import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Schema } from 'effect'
import { MemoryRouter } from 'react-router'

import { Location } from '@assessmentis/clinical-domain'

import { act, render, screen } from '@testing-library/react'

import '../../../traits/BreadcrumbLabel/implementations/Location'
import '../../../traits/Labeled/implementations/Location'
import '../../../traits/Link/implementations/Location'
import '../../../traits/Listable/implementations/Location'

import { ResourceListIndexPage } from '../../ResourceListIndexPage/ResourceListIndexPage'

// --- Mocks ---------------------------------------------------------------

vi.mock('../../Breadcrumbs/useBreadcrumbs', () => ({
  useBreadcrumbs: vi.fn(),
}))

const decodeLocation = Schema.decodeSync(Location)

const mockDeleteItem = vi.fn(async () => {})
const mockCollectionData = [
  {
    data: decodeLocation({
      name: 'Clinic A',
      status: 'active',
      url: 'http://example.com/Location/1',
    }),
    loading: false,
  },
  {
    data: decodeLocation({
      name: 'Clinic B',
      status: 'suspended',
      mode: 'instance',
      url: 'http://example.com/Location/2',
    }),
    loading: false,
  },
]

vi.mock('../../../layers/useResourceCollection', () => ({
  useResourceCollection: () => ({
    collectionPromise: Promise.resolve(mockCollectionData),
    deleteItem: mockDeleteItem,
  }),
}))

// --- Test helpers --------------------------------------------------------

function renderPage(
  filterComponent?: React.ComponentType<{
    onFiltersChange: (params: object) => void
  }>
) {
  return render(
    <MemoryRouter>
      <ResourceListIndexPage
        klass={Location}
        FilterComponent={filterComponent}
      />
    </MemoryRouter>
  )
}

// --- Tests ---------------------------------------------------------------

describe('ResourceListIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title from Labeled.pluralLabel', async () => {
    await act(async () => {
      renderPage()
    })
    expect(screen.getByText('Locations')).toBeDefined()
  })

  it('renders a create link with correct label', async () => {
    await act(async () => {
      renderPage()
    })
    const createLink = screen.getByText('Create New Location')
    expect(createLink).toBeDefined()
    expect(createLink.getAttribute('href')).toBe('/Location/new')
  })

  it('renders list items with display names from Listable trait', async () => {
    await act(async () => {
      renderPage()
    })
    expect(screen.getByText('Clinic A')).toBeDefined()
    expect(screen.getByText('Clinic B')).toBeDefined()
  })

  it('renders summary items from Listable trait', async () => {
    await act(async () => {
      renderPage()
    })
    // Clinic A: status=active, no mode → "active"
    expect(screen.getByText('active')).toBeDefined()
    // Clinic B: status=suspended, mode=instance → "suspended • instance"
    expect(screen.getByText('suspended • instance')).toBeDefined()
  })

  it('renders filter component when FilterComponent is provided', async () => {
    const FilterComponent = () => (
      <div data-testid="filter-component">Filters Active</div>
    )

    await act(async () => {
      renderPage(FilterComponent)
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
