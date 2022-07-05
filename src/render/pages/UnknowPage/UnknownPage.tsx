import React from "react";
import { useLocation } from "react-router-dom";

export default function UnknownPage() {
  const location = useLocation();
  return (
    <div className="p-12">
      <h1 className="font-bold text-3xl">
        Page not found
        <code className="bg-zinc-300 rounded-xl px-2 mx-2">
          {location.pathname}
        </code>
      </h1>
    </div>
  );
}
