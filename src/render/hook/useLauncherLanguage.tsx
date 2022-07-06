import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLanguage } from "../store/AppSlice";
import { selectAppSlice } from "../Store";

export function useLauncherLanguage() {
  let app = useSelector(selectAppSlice);
  let dispatch = useDispatch();

  useEffect(() => {
    window.api.send("lantern:get-language");
    // Wait for retrieve language from main-thread.
    window.api.on("lantern:get-language", (event, language) => {
      console.log(
        `Retrieve language code ${app.language} from ${event.senderId}`
      );

      dispatch(setLanguage(app.language));
    });
  }, []);

  // return { language: app.language };
}
