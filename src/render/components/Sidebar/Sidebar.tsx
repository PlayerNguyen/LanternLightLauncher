import React, { useState } from "react";

import {
  AiOutlineHome,
  AiFillHome,
  AiOutlineSetting,
  AiFillSetting,
} from "react-icons/ai";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import Language from "../../locates/Language";
import { selectAppSlice } from "../../Store";
import "./Navbar.scss";

export default function Sidebar() {
  let app = useSelector(selectAppSlice);

  let [sidebarData] = useState([
    {
      icon: <AiOutlineHome />,
      filledIcon: <AiFillHome />,
      text: Language[app.language].sidebar.home,
      href: "/",
    },
    {
      icon: <AiOutlineSetting />,
      filledIcon: <AiFillSetting />,
      text: Language[app.language].sidebar.settings,
      href: "/settings",
    },
  ]);

  let location = useLocation();

  return (
    <div className="sidebar absolute max-w-sm w-[76px] bg-zinc-900 h-full -z-10 text-zinc-400">
      <div className="sidebar-traffic-region w-full h-[38px]"></div>
      {/* Safe zone */}
      <div className="sidebar-content flex flex-col gap-4 mt-16">
        {sidebarData.map((data, index) => {
          return (
            <div
              className="flex flex-col align-middle items-center w-full font-normal"
              key={index}
            >
              <Link
                className={`flex flex-row gap-5 items-center align-baseline px-5 py-4 rounded-md hover:bg-zinc-800 transition-colors ease-in-out  ${
                  location.pathname === data.href
                    ? `bg-zinc-800 text-zinc-100`
                    : ``
                }`}
                to={data.href}
              >
                <div className="text-xl">
                  <i>
                    {location.pathname === data.href
                      ? data.filledIcon
                      : data.icon}
                  </i>
                </div>
                <div className="absolute hidden left-[76px] bg-zinc-800 px-2 py-3 font-light w-[100px] rounded-r-lg text-center">
                  {data.text}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
