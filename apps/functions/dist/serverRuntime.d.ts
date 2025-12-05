import { Layer, ManagedRuntime } from 'effect';
export declare const serverAppLayer: Layer.Layer<import("@effect/opentelemetry/Resource").Resource, never, never>;
export declare const serverRuntime: () => ManagedRuntime.ManagedRuntime<import("@effect/opentelemetry/Resource").Resource, never>;
export type ServerRuntime = typeof serverRuntime;
//# sourceMappingURL=serverRuntime.d.ts.map