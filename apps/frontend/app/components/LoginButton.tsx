import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import {
  auth,
  signIn,
  getOauth2FromDb,
  initGapi,
  setOauth2FromDb,
} from "../firebase";

export const LoginButton = () => {
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

  useEffect(() => {
    return auth.onIdTokenChanged(async (user) => {
      if (user) {
        const token = await getOauth2FromDb();
        if (!token) {
          // signOut(auth);
          return;
        }
        if (gapi.client) {
          gapi.client.setToken({ access_token: token });
        } else {
          gapi.load("client", () => initGapi(token));
        }
      } else {
        setOauth2FromDb(undefined);
      }
    });
  }, []);

  return (
    <>
      <button
        className="button-2"
        style={{ width: 90, margin: "auto" }}
        onClick={action}
        disabled={disabled}
      >
        {label}
      </button>
    </>
  );
};
