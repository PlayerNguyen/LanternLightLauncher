import { configureStore } from "@reduxjs/toolkit";
import AppSlice from "./store/AppSlice";

const store = configureStore({
  reducer: {
    App: AppSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const selectAppSlice = (state: RootState) => state.App;

export default store;
