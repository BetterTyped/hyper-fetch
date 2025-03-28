import { Home, Settings, Bell, Package, RefreshCcw, Rocket } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "frontend/components/ui/breadcrumb";
import { Button } from "frontend/components/ui/button";
import { NavUser } from "./nav-user";
import { Link } from "frontend/routing/router";

const dragStyle = {
  "-webkit-user-select": "none",
  "-webkit-app-region": "drag",
} as React.CSSProperties;

const noDragStyle = {
  "-webkit-user-select": "none",
  "-webkit-app-region": "no-drag",
} as React.CSSProperties;

export const Navbar = () => {
  return (
    <div className="flex gap-1 pt-2 px-3 justify-between" style={dragStyle}>
      <div className="flex gap-1 items-center">
        <div className="window-controls w-22">
          <button
            id="close-btn"
            className="window-control close"
            aria-label="Close"
            type="button"
            style={noDragStyle}
          />
          <button
            id="min-btn"
            className="window-control minimize"
            aria-label="Minimize"
            type="button"
            style={noDragStyle}
          />
          <button
            id="max-btn"
            className="window-control maximize"
            aria-label="Maximize"
            type="button"
            style={noDragStyle}
          />
        </div>
        <div className="flex gap-1 items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink className="flex gap-1 items-center" style={noDragStyle} asChild>
                  <Link to="projects">
                    <Home className="w-4 h-4" /> Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Package className="w-4 h-4" />
                  Project 1
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <div className="flex gap-3 items-center text-sm text-gray-400" style={noDragStyle}>
        <Button size="sm">
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
        <NavUser />
      </div>
    </div>
  );
};
