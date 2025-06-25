import { BookOpen } from "lucide-react";

import { Button } from "./button";

export const DocsButton = ({ href = "https://hyperfetch.bettertyped.com/docs/hyper-flow" }: { href?: string }) => {
  return (
    <Button variant="secondary" size="lg" asChild className="h-8">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <BookOpen className="w-4 h-4" />
        View Documentation
      </a>
    </Button>
  );
};
