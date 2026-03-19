import { useNavigate } from 'react-router'

export const Generic404Content = ({
  resourceType,
}: {
  resourceType: string
}): React.JSX.Element => {
  const navigate = useNavigate()
  return (
    <>
      <h1 style={{ textAlign: 'center' }}>This {resourceType} could not be found.</h1>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 'var(--space-3)',
        }}
      >
        <button
          className="element-button button-2"
          style={{ display: 'block', margin: '0 auto' }}
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
        <button
          className="element-button button-2"
          style={{ display: 'block', margin: '0 auto' }}
          onClick={() => {
            window.location.reload()
          }}
        >
          Hard Reload Page
        </button>
      </div>
    </>
  )
}
