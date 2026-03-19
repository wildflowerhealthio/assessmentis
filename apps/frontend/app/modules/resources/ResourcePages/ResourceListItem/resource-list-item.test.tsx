import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { act, render, screen } from '@testing-library/react'

import { ResourceListItem } from './resource-list-item'

function renderItem(props: Partial<Parameters<typeof ResourceListItem>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ResourceListItem
        displayName="Test Resource"
        summaryItems={['Item A', 'Item B']}
        viewPath={props.viewPath ?? '/Resource/123'}
        editPath={props.editPath ?? '/Resource/123/edit'}
        onDelete={() => {}}
        loading={false}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('ResourceListItem', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the display name', () => {
    renderItem({ displayName: 'Jane Doe' })
    expect(screen.getByText('Jane Doe')).toBeDefined()
  })

  it('renders summary items joined with bullet separator', () => {
    renderItem({ summaryItems: ['Male', 'Born: 1990-01-01'] })
    expect(screen.getByText('Male \u2022 Born: 1990-01-01')).toBeDefined()
  })

  it('renders dash when summary items are empty', () => {
    renderItem({ summaryItems: [] })
    expect(screen.getByText('-')).toBeDefined()
  })

  it('links to the view path', () => {
    renderItem({ viewPath: '/Patient/abc' })
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/Patient/abc')
  })

  it('reveals menu after button click', async () => {
    renderItem({
      editPath: '/Patient/abc/edit',
      loading: false,
      viewPath: '/Patient/abc',
    })

    await expect(screen.findByTestId('ResourceItemActions__menu')).rejects.toThrow(
      /unable to find/i
    )

    const actions = screen.getByLabelText('Actions')
    act(() => {
      actions.click()
    })

    await expect(screen.findByTestId('ResourceItemActions__menu')).resolves.toBeDefined()

    await expect(screen.findByText('View')).resolves.toHaveProperty(
      'href',
      `${window.location.origin}/Patient/abc`
    )

    await expect(screen.findByText('Edit')).resolves.toHaveProperty(
      'href',
      `${window.location.origin}/Patient/abc/edit`
    )
  })
})
