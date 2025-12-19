import { describe, expect, expectTypeOf, test } from 'vitest'
import { SectionRenderers } from './SectionRenderers'
import {
  TableBodyProps,
  TableRowProps,
  TitleProps,
  ScoringProps,
} from './componentProps'
import { Schema } from 'effect'

const tableBodySchema = TableBodyProps(Schema.String)
const sampleRows = tableBodySchema.make({
  rows: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
})

const renderers: SectionRenderers<string> = {
  Title: (props) => `Title:${props.title ?? ''}`,
  TableHeader: () => 'Header',
  TableRow: (props) => props.cells.join('|'),
  TableBody: (props) => props.rows.join(','),
  Scoring: (props) => `${props.totalScore}:${props.subtitle ?? ''}`,
}

describe('SectionRenderers', () => {
  test('structural contract is preserved', () => {
    expect(renderers.Title({ title: 'Hello' })).toBe('Title:Hello')

    const row = TableRowProps.make({
      question: 'Q1',
      cells: ['1', '0', '0', '0'],
    })

    expect(renderers.TableRow(row)).toBe('1|0|0|0')
    expect(renderers.TableBody(sampleRows)).toBe('a,b,c,d,e,f,g')
    expect(renderers.TableHeader()).toBe('Header')
    expect(
      renderers.Scoring({
        totalScore: 7,
        subtitle: 'Moderate',
      } as ScoringProps)
    ).toBe('7:Moderate')
  })

  test('type-level guarantees for renderer inputs', () => {
    expectTypeOf<SectionRenderers<string>['Title']>()
      .parameter(0)
      .toMatchTypeOf<TitleProps>()

    expectTypeOf<SectionRenderers<string>['TableRow']>()
      .parameter(0)
      .toMatchTypeOf<TableRowProps>()

    expectTypeOf<SectionRenderers<string>['Scoring']>()
      .parameter(0)
      .toMatchTypeOf<ScoringProps>()
  })
})
