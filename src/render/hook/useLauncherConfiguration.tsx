import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectConfigurationSlice } from "../Store";
import { setConfig, setLastLoaded } from "../store/ConfigurationSlice";

export function useLauncherConfiguration() {
  const dispatch = useDispatch();
  const configuration = useSelector(selectConfigurationSlice);

  useEffect(() => {
    // If the configuration is not loaded, load it.
    // console.log(configuration);

    // Send a message to main-thread to load the configuration.
    if (!configuration.config) {
      window.api.send("lantern:get-launcher-configuration");
    }

    // Receive any update from main-thread.
    window.api.on(
      "lantern:get-launcher-configuration",
      (_e, ...args: any[]) => {
        dispatch(setConfig(args[0]));
        dispatch(setLastLoaded(new Date().getTime()));
      }
    );
  }, []);

  return { configuration: configuration };
}
