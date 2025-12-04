import { handleRedirectResult, redirectToSignIn } from 'app/firebase'

export default function AuthHandlerPage() {
  return (
    <>
      <h1>Authentication</h1>
      <button onClick={() => redirectToSignIn()}>Sign In</button>
      <button
        onClick={() =>
          handleRedirectResult()
            .catch((loginErr) => console.error({ loginErr }))
            .then((credential) => console.log({ credential }))
        }
      >
        Handle Result
      </button>
    </>
  )
}
