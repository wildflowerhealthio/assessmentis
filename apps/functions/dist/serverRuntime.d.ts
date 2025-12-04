import { Layer, ManagedRuntime } from 'effect';
export declare const serverAppLayer: Layer.Layer<import("@assessmentis/domain/video-calls").ExternalVideoCallClient | import("@effect/opentelemetry/Resource").Resource, never, never>;
export declare const serverRuntime: () => ManagedRuntime.ManagedRuntime<import("@assessmentis/domain/video-calls").ExternalVideoCallClient | import("@effect/opentelemetry/Resource").Resource, never>;
export type ServerRuntime = typeof serverRuntime;
//# sourceMappingURL=serverRuntime.d.ts.map