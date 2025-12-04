import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { auth, signIn } from "../firebase";

export const LoginButton = (props: { className: string }) => {
  const [[label, action, disabled], setLabelAndAction] = useState<
    [string, undefined | (() => void), boolean]
  >(["Logout", undefined, true]);

  useEffect(() => {
    return auth.onIdTokenChanged((maybeUser) => {
      if (maybeUser) {
        setLabelAndAction([
          "Logout",
          () => {
            signOut(auth);
          },
          false,
        ]);
      } else {
        setLabelAndAction([
          "Login",
          () => {
            signIn();
          },
          false,
        ]);
      }
    });
  }, []);

  return (
    <button className={props.className} onClick={action} disabled={disabled}>
      {label}
    </button>
  );
};
