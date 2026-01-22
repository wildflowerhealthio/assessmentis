import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlatformContext, usePlatformContext } from './PlatformContext'
import type { PlatformContext as PlatformContextType } from './PlatformContext'

describe('PlatformContext', () => {
  describe('usePlatformContext', () => {
    it('should return context value when inside provider', () => {
      const mockContext: PlatformContextType = {
        authDataService: {} as any,
        orgService: {} as any,
        userService: {} as any,
        fhirR4ClientService: {} as any,
        clinicalDataRepositoryService: {} as any,
        externalVideoCallClientService: {} as any,
      }

      const TestComponent = () => {
        const context = usePlatformContext()
        return <div>Context loaded: {context !== null ? 'yes' : 'no'}</div>
      }

      render(
        <PlatformContext.Provider value={mockContext}>
          <TestComponent />
        </PlatformContext.Provider>
      )

      expect(screen.getByText('Context loaded: yes')).toBeDefined()
    })

    it('should return null when used outside provider', () => {
      const TestComponent = () => {
        const context = usePlatformContext()
        return (
          <div>
            Context is null: {context === null || context === undefined ? 'yes' : 'no'}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByText(/Context is null: yes/)).toBeDefined()
    })
  })
})
