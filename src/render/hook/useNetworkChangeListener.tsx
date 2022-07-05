import { useEffect } from "react";

/**
 * This hook will observe the changing of the network and
 * send the ipc message to the main thread whenever
 * the network is offline or online.
 */
export function useNetworkChangeListener() {
  /**
   * For the first load
   */
  useEffect(() => {
    window.api.send(
      "lantern:change-network",
      navigator.onLine ? "online" : "offline"
    );
  }, []);

  /**
   * Others load
   */
  useEffect(() => {
    const handleOnline = () => {
      window.api.send("lantern:change-network", "online");
    };
    const handleOffline = () => {
      window.api.send("lantern:change-network", "offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });
}
