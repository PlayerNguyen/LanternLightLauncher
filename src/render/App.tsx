import React from "react";
import { useNetworkChangeListener } from "./hooks/useNetworkChangeListener";

export default function App() {
  /**
   * Catch the network change event and send ipc to main-thread.
   */
  useNetworkChangeListener();

  return (
    <div>
      <h1 style={{ margin: "2rem auto", width: "30%" }}>
        This is an electron application
      </h1>
    </div>
  );
}
