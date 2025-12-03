import { Layer, ManagedRuntime } from "effect";
export declare const serverAppLayer: Layer.Layer<unknown, never, unknown>;
export declare const serverRuntime: () => ManagedRuntime.ManagedRuntime<unknown, never>;
export type ServerRuntime = typeof serverRuntime;
