import { useState } from "react";

import { Header } from "./header/header";
import { Cache } from "./modules/cache/cache";
import { Logs } from "./modules/logs/logs";
import { Network } from "./modules/network/network";
import { Processing } from "./modules/processing/processing";

const modules = {
  Network,
  Cache,
  Logs,
  Processing,
};

export const Devtools = () => {
  const [module] = useState("network");

  const Component = modules[module];

  return (
    <div>
      <Header />
      <Component />
    </div>
  );
};
