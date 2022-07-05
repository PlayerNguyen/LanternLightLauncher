import { createSlice } from "@reduxjs/toolkit";

// window.api.send('lantern:get-language');
// window.api.on('lantern:get-language', (event, language) => {})
const initialState = {
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

export const { setLanguage } = AppSlice.actions;

export default AppSlice.reducer;
