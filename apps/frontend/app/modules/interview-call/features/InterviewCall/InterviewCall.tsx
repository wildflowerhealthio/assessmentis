"use client";

import "./InterviewCall.css";

import DailyIframe, {
  type DailyCall,
  type DailyEvent,
} from "@daily-co/daily-js";
import { DailyAudio, DailyProvider } from "@daily-co/daily-react";

import { Schema } from "effect";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Call,
  HairCheck,
  Header,
  Tray,
} from "@assessmentis/daily-co-infrastructure/components";
import { FullEncounter } from "app/modules/interview-call/actions/getFullEncounter";

/* We decide what UI to show to users based on the state of the app, which is dependent on the state of the call object. */
enum VideoCallState {
  STATE_IDLE = "STATE_IDLE",
  STATE_CREATING = "STATE_CREATING",
  STATE_JOINING = "STATE_JOINING",
  STATE_JOINED = "STATE_JOINED",
  STATE_LEAVING = "STATE_LEAVING",
  STATE_ERROR = "STATE_ERROR",
  STATE_HAIRCHECK = "STATE_HAIRCHECK",
}

const useDailyCall = (roomUrl: string | undefined) => {
  const [appState, setAppState] = useState(VideoCallState.STATE_IDLE);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [apiError] = useState(false);

  /**
   * Create a new call room. This function will return the newly created room URL.
   * We'll need this URL when pre-authorizing (https://docs.daily.co/reference/rn-daily-js/instance-methods/pre-auth)
   * or joining (https://docs.daily.co/reference/rn-daily-js/instance-methods/join) a call.
   */
  const createCall = useCallback(() => {
    setAppState(VideoCallState.STATE_CREATING);
    const newCallObject = DailyIframe.createCallObject();
    setCallObject(newCallObject);
    setAppState(VideoCallState.STATE_HAIRCHECK);
    newCallObject.preAuth({ url: roomUrl }); // add a meeting token here if your room is private
    newCallObject.startCamera();
  }, [roomUrl]);

  /**
   * Start leaving the current call.
   */
  const startLeavingCall = useCallback(() => {
    if (!callObject) return;
    // If we're in the error state, we've already "left", so just clean up
    if (appState === VideoCallState.STATE_ERROR) {
      callObject.destroy().then(() => {
        setAppState(VideoCallState.STATE_HAIRCHECK);
      });
    } else {
      /* This will trigger a `left-meeting` event, which in turn will trigger
      the full clean-up as seen in handleNewMeetingState() below. */
      setAppState(VideoCallState.STATE_LEAVING);
      callObject.leave();
    }
  }, [callObject, appState]);

  /**
   * Update app state based on reported meeting state changes.
   *
   * NOTE: Here we're showing how to completely clean up a call with destroy().
   * This isn't strictly necessary between join()s, but is good practice when
   * you know you'll be done with the call object for a while, and you're no
   * longer listening to its events.
   */
  useEffect(() => {
    if (!callObject) return;

    function handleNewMeetingState() {
      switch (callObject?.meetingState()) {
        case "joined-meeting":
          setAppState(VideoCallState.STATE_JOINED);
          break;
        case "left-meeting":
          callObject.destroy().then(() => {
            setAppState(VideoCallState.STATE_HAIRCHECK);
          });
          break;
        case "error":
          setAppState(VideoCallState.STATE_ERROR);
          break;
        default:
          break;
      }
    }

    // Use initial state
    handleNewMeetingState();

    const eventsOfInterest: DailyEvent[] = [
      "joined-meeting",
      "left-meeting",
      "error",
      "camera-error",
    ];

    /*
     * Listen for changes in state.
     * We can't use the useDailyEvent hook (https://docs.daily.co/reference/daily-react/use-daily-event) for this
     * because right now, we're not inside a <DailyProvider/> (https://docs.daily.co/reference/daily-react/daily-provider)
     * context yet. We can't access the call object via daily-react just yet, but we will later in Call.js and HairCheck.js!
     */
    eventsOfInterest.forEach((event) =>
      callObject.on(event, handleNewMeetingState),
    );

    // Stop listening for changes in state
    return () => {
      eventsOfInterest.forEach((event) =>
        callObject.off(event, handleNewMeetingState),
      );
    };
  }, [callObject]);

  const uiState = useMemo(() => {
    if (apiError) return { state: "api_error" } as const;

    switch (appState) {
      case VideoCallState.STATE_HAIRCHECK:
        return { state: "haircheck" } as const;
      case VideoCallState.STATE_JOINING:
      case VideoCallState.STATE_JOINED:
      case VideoCallState.STATE_ERROR:
        return { state: "in_call" } as const;
      default:
        return { state: "home" } as const;
    }
  }, [apiError, appState]);

  /**
   * Once we pass the hair check, we can actually join the call.
   * We'll pass the username entered during Haircheck to .join().
   */
  const joinCall = useCallback(
    (userName: string) => {
      callObject?.join({ url: roomUrl ?? undefined, userName });
    },
    [callObject, roomUrl],
  );

  return {
    joinCall,
    startLeavingCall,
    uiState,
    callObject,
    createCall,
  };
};

interface IProps {
  encounterJson: typeof FullEncounter.Encoded;
}

function InterviewCall({ encounterJson }: IProps) {
  const encounter = Schema.decodeSync(FullEncounter)(encounterJson);

  const { joinCall, startLeavingCall, uiState, callObject, createCall } =
    useDailyCall(encounter.location?.[0].location?.identifier?.value);

  const body = useMemo(() => {
    // If something goes wrong with creating the room.
    if (uiState.state === "api_error") {
      return (
        <div className="api-error">
          <h1>Error</h1>
          <p>
            Room could not be created. Check if your `.env` file is set up
            correctly. For more information, see the{" "}
            <a href="https://github.com/daily-demos/custom-video-daily-react-hooks#readme">
              readme
            </a>
          </p>
        </div>
      );
    }

    if (uiState.state === "haircheck" || uiState.state === "in_call") {
      return (
        <DailyProvider callObject={callObject}>
          {uiState.state == "haircheck" ? (
            // No API errors? Let's check our hair then.
            <HairCheck joinCall={joinCall} cancelCall={startLeavingCall} />
          ) : (
            // No API errors, we passed the hair check, and we've joined the call? Then show the call.
            <>
              <Call />
              <Tray leaveCall={startLeavingCall} />
              <DailyAudio />
            </>
          )}
        </DailyProvider>
      );
    }

    // The default view is the HomeScreen, from where we start the demo.
    return <button onClick={createCall}> Start </button>;
  }, [joinCall, startLeavingCall, uiState, callObject, createCall]);

  return (
    <div className="app">
      <Header />
      {body}
    </div>
  );
}

export default InterviewCall;
