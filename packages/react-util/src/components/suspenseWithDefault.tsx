import { Suspense, use } from "react";

export default function suspenseWithDefault<
  K extends keyof P & string,
  P extends object,
>(
  promiseKey: K,
  value: P[K],
  Component: React.ComponentType<P>,
): React.FC<Omit<P, K> & Record<K, Promise<P[K]>>> {
  const NewComponent: React.FC<Omit<P, K> & Record<K, Promise<P[K]>>> = (
    props: Omit<P, K> & Record<K, Promise<P[K]>>,
  ) => {
    "use-client";
    const data = use(props[promiseKey]);

    const fallbackProps = {
      ...props,
      [promiseKey]: value,
    } as unknown as P;

    const newProps = {
      ...props,
      [promiseKey]: data,
    } as unknown as P;

    return (
      <Suspense fallback={<Component {...fallbackProps} />}>
        <Component {...newProps} />
      </Suspense>
    );
  };

  return NewComponent;
}
