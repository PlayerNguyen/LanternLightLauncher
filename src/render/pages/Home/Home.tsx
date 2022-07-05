import React, { useState } from "react";

function UsernameInput() {
  return (
    <input
      type="text"
      placeholder="Who is playing"
      className=" px-3 py-2 rounded-md outline-none border-blue-400 border"
    />
  );
}

interface VersionSelectorProps {
  placeholder?: string;
}
function VersionSelector(props: VersionSelectorProps) {
  let [expand, setExpand] = useState<boolean>(false);
  let [selected, setSelected] = useState<number>(-1);
  let [versions, setVersions] = useState<string[]>([
    "1.19",
    "1.18",
    "1.17",
    "1.16",
    "1.15",
    "1.14",
  ]);
  return (
    <div
      className=""
      onClick={() => {
        setExpand(!expand);
      }}
    >
      <div
        className={`px-3 py-2 bg-white rounded-md border border-blue-400 w-[180px] ${
          selected == -1 ? `text-zinc-400` : `text-zinc-900`
        }`}
      >
        {props.placeholder ? props.placeholder : `Version`}
      </div>
      {expand && (
        <div
          className={`absolute w-[180px] overflow-y-auto h-[300px] bg-white mt-1 rounded-md border`}
        >
          <div className="flex flex-col">
            {versions.map((data, index) => {
              return (
                <div className="p-3 hover:bg-zinc-200" key={index}>
                  <div>{data}</div>
                  <small className="text-zinc-400">Info</small>
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
  return (
    <div className=" bg-zinc-100">
      <div className="bg-zinc-700 text-zinc-500">
        <h1 className="font-bold text-3xl text-center p-12">Lantern Light</h1>
      </div>
      <div className="flex flex-row gap-3 p-4 text-zinc-500">
        <div className="">
          <div>Username</div>
          <div>
            <UsernameInput />
          </div>
        </div>
        {/* Versions */}
        <div className="">
          <div>Version</div>
          <div>
            <VersionSelector placeholder="Version" />
          </div>
        </div>
        {/* Play */}
        <div>
          <div>
            <button className="bg-zinc-500 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-full">
              Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
