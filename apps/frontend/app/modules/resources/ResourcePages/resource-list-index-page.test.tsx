import { Schema } from 'effect'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Location } from '@assessmentis/clinical-domain'

import { act, render, screen } from '@testing-library/react'

import '../../../traits/BreadcrumbLabel/implementations/location'
import '../../../traits/Labeled/implementations/location'
import '../../../traits/Link/implementations/location'
import '../../../traits/Listable/implementations/location'

import { ResourceListIndexPage } from '../../ResourceListIndexPage/resource-list-index-page'

// --- Mocks ---------------------------------------------------------------

vi.mock('../../Breadcrumbs/use-breadcrumbs', () => ({
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
      mode: 'instance',
      name: 'Clinic B',
      status: 'suspended',
      url: 'http://example.com/Location/2',
    }),
    loading: false,
  },
]

vi.mock('../../../layers/use-resource-collection', () => ({
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
      <ResourceListIndexPage klass={Location} FilterComponent={filterComponent} />
    </MemoryRouter>
  )
}

const FilterComponent = () => <div data-testid="filter-component">Filters Active</div>

// --- Tests ---------------------------------------------------------------

describe('ResourceListIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title from Labeled.pluralLabel', () => {
    act(() => {
      renderPage()
    })
    expect(screen.getByText('Locations')).toBeDefined()
  })

  it('renders a create link with correct label', () => {
    act(() => {
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

  it('renders filter component when FilterComponent is provided', () => {
    act(() => {
      renderPage(FilterComponent)
    })

    expect(screen.getByTestId('filter-component')).toBeDefined()
    expect(screen.getByText('Filters Active')).toBeDefined()
  })

  it('does not render filter slot when FilterComponent is undefined', () => {
    act(() => {
      renderPage()
    })

    expect(screen.queryByTestId('filter-component')).toBeNull()
  })
})
