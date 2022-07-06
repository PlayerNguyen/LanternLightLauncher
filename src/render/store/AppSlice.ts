import { createSlice } from "@reduxjs/toolkit";

export interface AppSliceInterface {
  language: string;
  versions: Array<{
    id: string;
    type: "release" | "snapshot";
  }>;
}
const initialState: AppSliceInterface = {
  language: "en",
  versions: [],
};

const AppSlice = createSlice({
  name: "App",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },

    setVersions: (state, action) => {
      state.versions = action.payload;
    },
  },
});

export const { setLanguage, setVersions } = AppSlice.actions;

export default AppSlice.reducer;
