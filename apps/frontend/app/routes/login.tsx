import { handleRedirectResult, redirectToSignIn } from '@/firebase'

export default function AuthHandlerPage(): React.JSX.Element {
  return (
    <>
      <h1>Authentication</h1>
      <button onClick={() => redirectToSignIn()}>Sign In</button>
      <button
        onClick={() =>
          handleRedirectResult()
            .catch((error) => {
              console.error({ error })
            })
            .then((credential) => {
              console.log({ credential })
            })
        }
      >
        Handle Result
      </button>
    </>
  )
}
