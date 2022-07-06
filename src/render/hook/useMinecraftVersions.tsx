import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAppSlice } from "../Store";
import { setVersions } from "../store/AppSlice";

export function useMinecraftVersions() {
  let app = useSelector(selectAppSlice);
  let dispatch = useDispatch();

  useEffect(() => {
    window.api.send("lantern:get-minecraft-versions");

    window.api.on("lantern:get-minecraft-versions", (_event, ...args) => {
      dispatch(setVersions(args[0]));
    });
  }, []);

  // return { versions: app.versions };
}
