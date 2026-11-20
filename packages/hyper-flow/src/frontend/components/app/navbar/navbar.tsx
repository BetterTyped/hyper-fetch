import { useNavigate } from "@tanstack/react-router";
import { Home, Maximize2, X, Minus } from "lucide-react";
import React from "react";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { useIsFocused } from "@/hooks/use-is-focused";

const dragStyle = {
  WebkitUserSelect: "none",
  WebkitAppRegion: "drag",
} as React.CSSProperties;

const noDragStyle = {
  WebkitUserSelect: "none",
  WebkitAppRegion: "no-drag",
} as React.CSSProperties;

export const Navbar = () => {
  const isFocused = useIsFocused();
  const navigate = useNavigate();

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
                <BreadcrumbLink
                  className="flex gap-1 items-center"
                  style={noDragStyle}
                  onClick={() => {
                    navigate({ to: "/" });
                  }}
                >
                  <Home className="w-4 h-4" /> Home
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
};
