import { use } from "react";

export default function allowPropAsPromise<
  K extends keyof P & string,
  P extends object,
>(
  promiseKey: K,
  Component: React.ComponentType<P>,
): React.FC<Omit<P, K> & Record<K, Promise<P[K]>>> {
  const NewComponent: React.FC<Omit<P, K> & Record<K, Promise<P[K]>>> = (
    props: Omit<P, K> & Record<K, Promise<P[K]>>,
  ) => {
    "use-client";
    const data = use(props[promiseKey]);

    const newProps = {
      ...props,
      [promiseKey]: data,
    } as unknown as P;

    return <Component {...newProps} />;
  };

  return NewComponent;
}
