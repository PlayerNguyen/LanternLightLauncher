import { configureStore } from "@reduxjs/toolkit";
import AppSlice from "./store/AppSlice";
import ConfigurationSlice from "./store/ConfigurationSlice";

const store = configureStore({
  reducer: {
    App: AppSlice,
    Configuration: ConfigurationSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const selectAppSlice = (state: RootState) => state.App;
export const selectConfigurationSlice = (state: RootState) =>
  state.Configuration;

export default store;
