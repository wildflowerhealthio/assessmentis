import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrgContext, useOrg } from './OrgContext'
import type { Org } from '@assessmentis/platform-domain'

describe('OrgContext', () => {
  describe('useOrg', () => {
    it('should return org value when inside provider', () => {
      const mockOrg: Org = {
        slug: 'test-org' as any,
        name: 'Test Organization',
        owner_uid: 'user-123',
        members: {},
      }

      const TestComponent = () => {
        const org = useOrg()
        return <div>Org name: {org.name}</div>
      }

      render(
        <OrgContext.Provider value={mockOrg}>
          <TestComponent />
        </OrgContext.Provider>
      )

      expect(screen.getByText('Org name: Test Organization')).toBeDefined()
    })

    it('should return null when used outside provider', () => {
      const TestComponent = () => {
        const org = useOrg()
        return (
          <div>
            Org is null: {org === null || org === undefined ? 'yes' : 'no'}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByText(/Org is null: yes/)).toBeDefined()
    })
  })
})
