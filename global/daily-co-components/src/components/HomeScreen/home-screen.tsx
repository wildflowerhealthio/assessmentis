// eslint-disable-next-line import/no-unassigned-import
import './HomeScreen.css'

/**
 * Landing screen shown before a call starts. A single button creates a
 * new room and advances to the hair-check screen.
 *
 * @param createCall - Async factory that provisions a new Daily room and
 *   returns its URL
 * @param startHairCheck - Called with the new room URL to transition to
 *   the pre-call device setup screen
 */
export default function HomeScreen({
  createCall,
  startHairCheck,
}: {
  createCall: () => Promise<string>
  startHairCheck: (url: string) => void
}): React.JSX.Element {
  const startDemo = (): void => {
    void createCall().then((url) => {
      startHairCheck(url)
    })
  }

  return (
    <div className="home-screen">
      <h1>Daily React custom video application</h1>
      <p>Start the demo with a new unique room by clicking the button below.</p>
      <button onClick={startDemo} type="button">
        Click to start a call
      </button>
      <p className="small">
        Select &quot;Allow&quot; to use your camera and mic for this call if prompted
      </p>
    </div>
  )
}
