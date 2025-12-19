import { describe, expect, test } from 'vitest'
import * as publicApi from './index'
import * as gad7Module from './gad7'
import * as componentProps from './componentProps'

describe('gad7-report public API', () => {
  test('re-exports core helpers', () => {
    expect(publicApi.prepareGad7ReportData).toBe(
      gad7Module.prepareGad7ReportData
    )
    expect(publicApi.makeGad7ScoringTable).toBe(gad7Module.makeGad7ScoringTable)
  })

  test('re-exports schemas and typing helpers', () => {
    expect(publicApi.TableRowProps).toBe(componentProps.TableRowProps)
    expect(publicApi.TableBodyProps).toBe(componentProps.TableBodyProps)
    expect(publicApi.ScoringProps).toBe(componentProps.ScoringProps)
    expect(publicApi.TitleProps).toBe(componentProps.TitleProps)
  })
})
