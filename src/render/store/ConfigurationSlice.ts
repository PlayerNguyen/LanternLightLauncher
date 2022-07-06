import { LauncherConfig } from "../../lantern/launcher/LauncherConfig";
import { createSlice } from "@reduxjs/toolkit";

interface Configuration {
  lastLoaded?: Number;
  config?: LauncherConfig;
}
const initialState: Configuration = {
  lastLoaded: undefined,
  config: undefined,
};

const ConfigurationSlice = createSlice({
  name: "Configuration",
  initialState,
  reducers: {
    setConfig: (state, action) => {
      state.config = action.payload;
    },

    setLastLoaded: (state, action) => {
      state.lastLoaded = action.payload;
    },
  },
});

export const { setConfig, setLastLoaded } = ConfigurationSlice.actions;

export default ConfigurationSlice.reducer;
