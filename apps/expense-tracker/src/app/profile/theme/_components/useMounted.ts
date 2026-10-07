import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Theme is unknown on the server, so wait for hydration
export const useMounted = () =>
    useSyncExternalStore(subscribe, () => true, () => false);
