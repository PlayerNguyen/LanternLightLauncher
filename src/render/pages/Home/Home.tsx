import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLauncherConfiguration } from "../../hook/useLauncherConfiguration";
import { setConfig } from "../../store/ConfigurationSlice";
import { getStringFromLanguage } from "../../locates/Language";
import { useSelector } from "react-redux";
import { selectAppSlice, selectConfigurationSlice } from "../../Store";
import { useOnClickOutside } from "../../hook/useOnClickOutside";

function UsernameInput() {
  const [username, setUsername] = useState<string>("");

  const { configuration } = useLauncherConfiguration();
  const dispatch = useDispatch();

  useEffect(() => {
    if (configuration.config) {
      setUsername(configuration.config?.offline.username);
    }
  }, [configuration]);

  /**
   * Handles on blur of the input to save the username into storage files.
   * @param e an event target of input
   */
  const handleOnChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);

    const configurationObject = {
      ...configuration,
      config: {
        ...configuration.config,
        offline: {
          username: e.target.value,
        },
      },
    };

    // Save settings
    if (username != configuration.config?.offline.username) {
      dispatch(setConfig(configurationObject.config));
      window.api.send(
        "lantern:set-launcher-configuration",
        configurationObject.config
      );
    }
  };

  return (
    <input
      type="text"
      placeholder={
        configuration.config &&
        getStringFromLanguage(
          configuration.config.language,
          "home.usernamePlaceholder"
        )
      }
      className=" px-3 py-2 rounded-md outline-none border-blue-400 border"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      onBlur={handleOnChangeUsername}
    />
  );
}

interface VersionSelectorProps {
  placeholder?: string;
}

export interface MinecraftVersionResponse {
  id: string;
  type: "snapshot" | "release";
}

function VersionSelector(props: VersionSelectorProps) {
  const dispatch = useDispatch();

  const [expand, setExpand] = useState<boolean>(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const app = useSelector(selectAppSlice);
  const configuration = useSelector(selectConfigurationSlice);
  const [versions, setVersions] = useState<MinecraftVersionResponse[]>([]);

  useEffect(() => {
    if (app.versions.length > 0) {
      setVersions(app.versions);

      // If the configuration selected version is latest,
      //   then select the latest version and set it to the configuration
      if (
        configuration.config &&
        configuration.config.lastSelectedVersion === "latest"
      ) {
        // Get the latest version id
        const latestVersion = app.versions.find(
          (version) => version.type === "release"
        );

        if (latestVersion) {
          const configObject = {
            ...configuration.config,
            lastSelectedVersion: latestVersion.id,
          };

          dispatch(setConfig(configObject));
          window.api.send("lantern:set-launcher-configuration", configObject);
          // Set the selected version to the latest version
          setSelectedVersion(latestVersion.id);
        }
        return;
      }

      // If the configuration selected version is not latest,
      //   then select the version from the configuration
      const _selectedVersion = app.versions.find(
        (version) => version.id === configuration.config?.lastSelectedVersion
      );

      if (_selectedVersion) {
        setSelectedVersion(_selectedVersion.id);
      }
    }
  }, [app.versions]);

  const handleOnSelect = (id: string) => {
    const configObject = {
      ...configuration.config,
      lastSelectedVersion: id,
    };

    dispatch(setConfig(configObject));
    window.api.send("lantern:set-launcher-configuration", configObject);
    // let _selectedIndex = versions.find((version) => version.id === id);
    setSelectedVersion(id);

    setExpand(false);
  };

  const wrapperRef = useRef(null);

  useOnClickOutside(wrapperRef, () => {
    setExpand(false);
  });

  return (
    <div
      className=""
      ref={wrapperRef}
      onClick={() => {
        setExpand(!expand);
      }}
    >
      <div
        className={`px-3 py-2 bg-white rounded-md border border-blue-400 w-[180px] ${
          !selectedVersion ? `text-zinc-400` : `text-zinc-600 font-bold`
        }`}
      >
        {selectedVersion || props.placeholder}
        {/* {props.placeholder ? props.placeholder : versions[selected]?.id} */}
      </div>
      {expand && (
        <div
          className={`absolute w-[180px] overflow-y-auto max-h-[40%] bg-white mt-1 rounded-md border`}
        >
          <div className="flex flex-col">
            {versions
              .filter((version) => {
                if (
                  configuration &&
                  configuration.config &&
                  configuration.config.allowSnapshot
                ) {
                  return version.type === "snapshot";
                }
                return version.type === "release";
              })
              .map((data, index) => {
                return (
                  <div
                    className={`${
                      selectedVersion === data.id ? `font-bold` : `font-normal`
                    } px-6 py-1 hover:bg-zinc-100`}
                    key={index}
                    onClick={() => {
                      handleOnSelect(data.id);
                    }}
                  >
                    <div>{data.id}</div>
                    {/* <small className="text-zinc-400">Info</small> */}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { configuration } = useLauncherConfiguration();

  const handleLaunchMinecraft = () => {
    window.api.send("lantern:launch-minecraft");
  };

  /**
   * Render home
   */
  return (
    <div className=" absolute h-full w-full">
      <div className=" text-zinc-900 bg-[url('asset/background.jpeg')] bg-center bg-cover bg-no-repeat">
        <h1 className="font-bold text-3xl text-center p-12 bg-zinc-300 bg-opacity-90">
          Welcome to lantern light, the most powerful Minecraft launcher in the
          world.
        </h1>
      </div>

      <div className="mx-12 my-3">
        <div
          className={`flex flex-row gap-3 px-12 py-6 text-zinc-500
           bg-zinc-50 rounded-xl align-middle items-center hover:shadow-md transition-shadow`}
        >
          <div className="">
            <div className="font-bold">
              {configuration.config &&
                getStringFromLanguage(
                  configuration.config.language,
                  "home.username"
                )}
            </div>
            <div>
              <UsernameInput />
            </div>
          </div>
          {/* Versions */}
          <div>
            <div className="font-bold">
              {configuration.config &&
                getStringFromLanguage(
                  configuration.config.language,
                  "home.version"
                )}
            </div>
            <div>
              <VersionSelector placeholder="Version" />
            </div>
          </div>
          {/* Play */}
          <div className="flex-1">
            <div>
              <button
                className={`bg-blue-400 hover:bg-zinc-700 
                text-white h-full font-bold py-6 px-12 rounded-lg`}
                onClick={handleLaunchMinecraft}
              >
                {configuration.config &&
                  getStringFromLanguage(
                    configuration.config.language,
                    "home.play"
                  )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* News */}
    </div>
  );
}
