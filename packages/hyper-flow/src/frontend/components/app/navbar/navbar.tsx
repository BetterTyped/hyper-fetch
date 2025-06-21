import React from "react";
import { Link } from "@tanstack/react-router";
import { Home, Maximize2, X, Minus } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  // BreadcrumbPage,
  // BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
// import { Button } from "@/components/ui/button";
// import { NavUser } from "./nav-user";
import { useIsFocused } from "@/hooks/use-is-focused";

const dragStyle = {
  "-webkit-user-select": "none",
  "-webkit-app-region": "drag",
} as React.CSSProperties;

const noDragStyle = {
  "-webkit-user-select": "none",
  "-webkit-app-region": "no-drag",
} as React.CSSProperties;

// type BreadcrumbsType = {
//   name: string;
//   breadcrumb: string;
//   params: Record<string, string>;
// }[];

// const Item = ({ name, params, breadcrumb }: BreadcrumbsType[number]) => {
//   switch (name) {
//     case "application": {
//       return (
//         <>
//           <AppWindowMac className="w-4 h-4" />
//           {params.applicationName}
//         </>
//       );
//     }
//     default:
//       return breadcrumb;
//   }
// };

export const Navbar = () => {
  const isFocused = useIsFocused();
  // const breadcrumbs = useBreadcrumbs();

  const handleClose = () => {
    window.electron.ipcRenderer.send("window-close");
  };

  const handleMinimize = () => {
    window.electron.ipcRenderer.send("window-minimize");
  };

  const handleMaximize = () => {
    window.electron.ipcRenderer.send("window-maximize");
  };

  return (
    <div className="flex gap-1 pt-2 px-3 justify-between" style={dragStyle}>
      <div className="flex gap-1 items-center">
        <div className="window-controls w-22">
          <div className="flex gap-2 items-center">
            <button
              id="close-btn"
              className={`w-3 h-3 rounded-full transition-colors flex items-center justify-center group ${
                isFocused ? "bg-red-500 hover:bg-red-600" : "bg-zinc-700"
              }`}
              aria-label="Close"
              type="button"
              style={noDragStyle}
              onClick={handleClose}
            >
              <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" stroke="#4A0002" />
            </button>
            <button
              id="min-btn"
              className={`w-3 h-3 rounded-full transition-colors flex items-center justify-center group ${
                isFocused ? "bg-yellow-500 hover:bg-yellow-600" : "bg-zinc-700"
              }`}
              aria-label="Minimize"
              type="button"
              style={noDragStyle}
              onClick={handleMinimize}
            >
              <Minus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" stroke="#4A3802" />
            </button>
            <button
              id="max-btn"
              className={`w-3 h-3 rounded-full transition-colors flex items-center justify-center group ${
                isFocused ? "bg-green-500 hover:bg-green-600" : "bg-zinc-700"
              }`}
              aria-label="Maximize"
              type="button"
              style={noDragStyle}
              onClick={handleMaximize}
            >
              <Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" stroke="#0A4102" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink className="flex gap-1 items-center" style={noDragStyle} asChild>
                  <Link to="/">
                    <Home className="w-4 h-4" /> Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* {breadcrumbs.map((data, index) => {
                const { path, name } = data;
                const isLast = index === breadcrumbs.length - 1;

                if (!isLast) {
                  return (
                    <Fragment key={path}>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          href={path}
                          className="flex gap-1 items-center capitalize"
                          style={noDragStyle}
                          asChild
                        >
                          <Link href={path}>
                            <Item {...data} />
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={name}>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="capitalize">
                        <Item {...data} />
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </Fragment>
                );
              })} */}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <div className="flex gap-3 items-center text-sm text-zinc-400" style={noDragStyle}>
        {/* <Button size="sm">
          <Rocket className="w-3.5 h-3.5" />
          Upgrade
        </Button>
        <Button variant="ghost" size="icon">
          <RefreshCcw className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="w-3.5 h-3.5" />
        </Button>
        <NavUser /> */}
      </div>
    </div>
  );
};
