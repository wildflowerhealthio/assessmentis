import {
  useDailyEvent,
  useLocalSessionId,
  useParticipantIds,
  useScreenShare,
} from "@daily-co/daily-react";
import { JSX, useCallback, useState } from "react";

import classes from "./Call.module.css";
import Tile from "../Tile/Tile";
import UserMediaError from "../UserMediaError/UserMediaError";

export default function Call() {
  /* If a participant runs into a getUserMedia() error, we need to warn them. */
  const [getUserMediaError, setGetUserMediaError] = useState(false);

  /* We can use the useDailyEvent() hook to listen for daily-js events. Here's a full list
   * of all events: https://docs.daily.co/reference/daily-js/events */
  useDailyEvent(
    "camera-error",
    useCallback(() => {
      setGetUserMediaError(true);
    }, []),
  );

  /* This is for displaying remote participants: this includes other humans, but also screen shares. */
  const { screens } = useScreenShare();
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });

  /* This is for displaying our self-view. */
  const localSessionId = useLocalSessionId();

  if (getUserMediaError) {
    return <UserMediaError />;
  }

  let focus: JSX.Element;
  if (screens.length > 0) {
    focus = <Tile id={screens[0].session_id} isScreenShare />;
  } else if (remoteParticipantIds.length > 0) {
    focus = (
      <Tile
        id={remoteParticipantIds[0]}
        style={{
          aspectRatio: "calc(16/9)",
          margin: "auto",
          maxWidth: "100%",
        }}
      />
    );
  } else {
    focus = (
      <div className={classes.Call__info}>
        <h2 className="heading-3">Waiting for others</h2>
        <p>Invite someone by sharing this link:</p>
        <span className="room-url">{window.location.href}</span>
      </div>
    );
  }
  return (
    <div className={classes.Call}>
      {focus}
      <div className={classes.Call__miniVideoRow}>
        {localSessionId && (
          <Tile
            id={localSessionId}
            isLocal
            style={{
              height: "100%",
              aspectRatio: "calc(16/9)",
              margin: "auto",
              maxWidth: "100%",
            }}
          />
        )}
      </div>
    </div>
  );
}
