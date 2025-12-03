import { Layer, ManagedRuntime } from "effect";
export declare const serverAppLayer: Layer.Layer<import("@effect/opentelemetry/Resource").Resource | import("assessmentis-domain").ExternalVideoCallClient, never, never>;
export declare const serverRuntime: () => ManagedRuntime.ManagedRuntime<import("@effect/opentelemetry/Resource").Resource | import("assessmentis-domain").ExternalVideoCallClient, never>;
export type ServerRuntime = typeof serverRuntime;
