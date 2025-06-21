import { Link } from "@tanstack/react-router";

import { Button } from "../ui/button";
import { FlickeringGrid } from "../ui/flickering-grid";

export const NotFound = () => {
  return (
    <div className="relative h-full w-full">
      <FlickeringGrid
        className="absolute inset-0 z-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.1}
        flickerChance={0.1}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <h1 className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-zinc-300/80 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent dark:from-white dark:to-zinc-900/10">
          Page not found
        </h1>
        <p className="text-xl text-zinc-400 mt-8 mb-12">The page you are looking for does not exist.</p>

        <Button variant="secondary" asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};
