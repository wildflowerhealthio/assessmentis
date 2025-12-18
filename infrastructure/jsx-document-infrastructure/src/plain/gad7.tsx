import type { Gad7ReportProps } from '@assessmentis/document-templates'

const PlainGad7Report = (data: Gad7ReportProps) => (
  <>
    <h2>GAD-7 Anxiety Report</h2>
    <table>
      <thead>
        <tr>
          <th>Question</th>
          {data.table.dataHeaders.map((header, idx) => (
            <th key={idx}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <td>{row.question}</td>
            {row.data.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
        <tr>
          <td>
            <strong>Total Score</strong>
          </td>
          <td
            colSpan={data.table.dataHeaders.length}
            style={{ textAlign: 'center' }}
          >
            <strong>{data.table.totalScore}</strong>
          </td>
        </tr>
      </tbody>
    </table>
    <h2>Scoring GAD-7 Anxiety Severity</h2>
    <p>
      This is calculated by assigning scores of 0, 1, 2, and 3 to the response
      categories, respectively, of “not at all,” “several days,” “more than half
      the days,” and “nearly every day.” GAD-7 total score for the seven items
      ranges from 0 to 21. 0-4: minimal anxiety 5-9: mild anxiety 10-14:
      moderate anxiety 15-21: severe anxiety
    </p>
  </>
)

export default PlainGad7Report
