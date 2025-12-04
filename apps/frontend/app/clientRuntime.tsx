import { createContext, useContext } from 'react'

import { WebSdk, Resource } from '@effect/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ConfigProvider, Effect, Layer, ManagedRuntime } from 'effect'
import {
  VideoCallRepository,
  type ExternalVideoCallClient,
} from '@assessmentis/domain/video-calls'
import {
  type QuestionnaireRepository,
  type QuestionnaireResponseRepository,
} from '@assessmentis/domain/questionnaires'
import { EncounterRepository } from '@assessmentis/domain/encounters'
import { DailyCoExternalVideoCallClientLayer } from '@assessmentis/daily-co-infrastructure'
import {
  FhirQuestionnaireRepository,
  FhirQuestionnaireResponseRepository,
  FhirEncounterRepository,
} from '@assessmentis/google-fhir-infrastructure'
import { FetchHttpClient, HttpClient } from '@effect/platform'
import { layerCurrentZoneLocal, type CurrentTimeZone } from 'effect/DateTime'

export class ContextSetupError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
  }
}

export type ClientRuntimeContext =
  | Resource.Resource
  | HttpClient.HttpClient
  | CurrentTimeZone
  | ExternalVideoCallClient
  | QuestionnaireRepository
  | QuestionnaireResponseRepository
  | EncounterRepository
  | VideoCallRepository

// Set up tracing with the OpenTelemetry SDK
const WebSdkLive = WebSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-frontend' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

const ShamVideoCallRepository = Layer.effect(
  VideoCallRepository,
  Effect.succeed({
    createVideoCallRooms: (_: unknown) => Effect.succeed([]),
    readVideoCallRoomsByEncounterId: (_: unknown) => Effect.succeed([]),
  }).pipe(Effect.withSpan('createDbQuestionnaireRepository'))
)

const ConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map(Object.entries(import.meta.env)), {})
)

export const clientAppLayer: Layer.Layer<ClientRuntimeContext> = Layer.mergeAll(
  DailyCoExternalVideoCallClientLayer.pipe(Layer.provide(ConfigLayer)),
  FhirQuestionnaireRepository.pipe(Layer.provide(ConfigLayer)),
  FhirQuestionnaireResponseRepository.pipe(Layer.provide(ConfigLayer)),
  FhirEncounterRepository.pipe(Layer.provide(ConfigLayer)),
  ShamVideoCallRepository.pipe(Layer.provide(ConfigLayer)),
  layerCurrentZoneLocal,
  FetchHttpClient.layer,
  WebSdkLive,
  ConfigLayer
).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV), Layer.orDie)

export const RuntimeContext = createContext<
  ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never> | undefined
>(undefined)

export const useRuntimeContext = () => useContext(RuntimeContext)!

/*
interface EffectTsOptions {
  disabled: boolean;
}

export const useEffectTs = <A, E, R extends ClientRuntimeContext>(
  effect: Effect.Effect<A, E, R>,
  options: Partial<EffectTsOptions> = {},
) => {
  const defaultOptions: EffectTsOptions = {
    disabled: false,
  };
  const { disabled } = {
    ...defaultOptions,
    ...options,
  };
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<A | undefined>();
  const [error, setError] = useState<E | undefined>();

  const runtime = useContext(RuntimeContext);
  if (runtime === undefined)
    throw new Error("useEffectTS must eb uses in a RuntimeContext");

  const handleExit: (exit: Exit.Exit<A, E>) => void = Exit.match({
    onFailure(cause) {
      Cause.failureOrCause(cause).pipe(
        Either.match({
          onLeft(error) {
            setLoading(false);
            setError(error);
          },
          onRight(cause) {
            if (Cause.isInterrupted(cause)) {
              return;
            }
            console.error(cause);
            throw cause;
          },
        }),
      );
    },
    onSuccess(data) {
      setLoading(false);
      setData(data);
    },
  });

  useEffect(() => {
    if (disabled) {
      return;
    }

    setLoading(true);
    const fiber = runtime.runFork(effect, {});

    fiber.addObserver((exit) => {
      setLoading(false);
      handleExit(exit);
    });

    return () => {
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [runtime, effect]);

  return { data, error, loading };
};
*/
