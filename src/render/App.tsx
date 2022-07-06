import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { useLauncherConfiguration } from "./hook/useLauncherConfiguration";
import { useLauncherLanguage } from "./hook/useLauncherLanguage";
import { useMinecraftVersions } from "./hook/useMinecraftVersions";
import { useNetworkChangeListener } from "./hook/useNetworkChangeListener";
import Home from "./pages/Home/Home";
import UnknownPage from "./pages/UnknownPage/UnknownPage";

export default function App() {
  /**
   *
   */
  let { configuration } = useLauncherConfiguration();

  /**
   * Catch the network change event and send ipc to main-thread.
   */
  useNetworkChangeListener();

  /**
   * Load a language from config in main-thread.
   * If the application is first running, the language will be set to "en".
   */
  useLauncherLanguage();

  /**
   * Init the home
   */
  useMinecraftVersions();

  /**
   * Render the app.
   */
  return (
    <div className="fixed w-full h-full bg-[#ebebeb]">
      <div className="navbar-wrapper">
        <Navbar />
      </div>
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <div className="app-content-wrapper fixed top-[38px] left-[76px] w-[calc(100%-76px)] h-[calc(100%-38px)] overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<UnknownPage />} />
        </Routes>
      </div>
    </div>
  );
}
