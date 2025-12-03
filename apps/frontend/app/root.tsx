import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./globals.css";
import { RuntimeContextOrErr } from "./components/RuntimeContextOrErr";
import { LoginButton } from "./components/LoginButton";
import { FiberFailureCauseId } from "effect/Runtime";

// HydrateFallback is rendered while the client loader is running
export function HydrateFallback() {
  return <div>Loading...</div>;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RuntimeContextOrErr>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script
            src="https://accounts.google.com/gsi/client"
            async
            defer
          ></script>
          <script src="https://apis.google.com/js/api.js"></script>
          <Links />
          <Meta />
        </head>
        <body style={{ padding: "var(--space-2)" }}>
          <nav
            style={{
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "baseline",
              gap: "var(--space-5)",
            }}
          >
            <Link to="/">
              <h1
                className="heading-4"
                style={{ marginRight: "var(--space-5)" }}
              >
                Assessment.is
              </h1>
            </Link>

            <Link
              className="heading-2"
              style={{ color: "var(--app-foreground)" }}
              to="/Questionnaire"
            >
              Questionnaires
            </Link>

            <Link
              className="heading-2"
              style={{ color: "var(--app-foreground)" }}
              to="/Encounter"
            >
              Encounters
            </Link>

            <Link
              className="heading-2"
              style={{ color: "var(--app-foreground)" }}
              to="/QuestionnaireResponse"
            >
              Questionnaire Responses
            </Link>
            <LoginButton />
          </nav>
          <div
            style={{
              width: "100%",
              maxWidth: 1024,
              margin: "var(--space-4) auto",
            }}
          >
            {children}
          </div>
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </RuntimeContextOrErr>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  const cause =
    error != null && typeof error == "object" && FiberFailureCauseId in error
      ? error[FiberFailureCauseId]
      : undefined;

  console.error("Error Reached Boundary");
  console.error({ error });
  if (cause) {
    console.error({ cause });
  }
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto" style={{ lineHeight: 1.5 }}>
          <code>{stack}</code>
        </pre>
      )}
      <h2>Cause:</h2>
      {cause ? (
        <pre className="w-full p-4 overflow-x-auto" style={{ lineHeight: 1.5 }}>
          <code>{JSON.stringify(cause)}</code>
        </pre>
      ) : undefined}
    </main>
  );
}
