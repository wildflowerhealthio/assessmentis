"use client";

import { type FallbackProps } from "react-error-boundary";

export const JsonErrorDisplay = (props: FallbackProps) => {
  return (
    <pre style={{ maxWidth: 1024, textWrap: "wrap" }}>
      {JSON.stringify(props.error, null, "  ")}
    </pre>
  );
};
