"use client";

import { githubClient } from "@site/src/api/client";
import { cn } from "@site/src/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

export interface GitHubStarButtonProps {
  /**
   * The owner of the GitHub repository
   * @example "johuniq"
   */
  owner: string;
  /**
   * The name of the GitHub repository
   * @example "jolyui"
   */
  repo: string;
  /**
   * Manual star count override. If provided, the component will not fetch from GitHub API.
   */
  stars?: number;
  /**
   * Additional CSS classes for the button
   */
  className?: string;
  /**
   * Compact style for the documentation navbar.
   */
  variant?: "default" | "navbar";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

interface GitHubRepositoryResponse {
  stargazers_count: number;
}

const getRepository = githubClient.createRequest<{ response: GitHubRepositoryResponse }>()({
  endpoint: "/repos/:owner/:repo",
  method: "GET",
});

const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 1.5l1.85 4.1 4.65.55-3.5 3.15.95 4.6L8 11.7l-4 2.2.95-4.6-3.5-3.15 4.65-.55L8 1.5z" />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return num.toLocaleString();
}

function useGitHubStars(owner: string, repo: string, manualStars?: number) {
  const [stars, setStars] = React.useState<number>(manualStars ?? 0);
  const [loading, setLoading] = React.useState(!manualStars);

  React.useEffect(() => {
    let isMounted = true;

    if (manualStars !== undefined) {
      setStars(manualStars);
      setLoading(false);
      return;
    }

    setLoading(true);

    getRepository
      .send({ params: { owner, repo } })
      .then(({ data }) => {
        if (isMounted && data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [owner, repo, manualStars]);

  return { stars, loading };
}

const AnimatedDigit = ({ digit }: { digit: string }) => {
  const isNumber = /\d/.test(digit);

  if (!isNumber) {
    return <span className="inline-block px-0.5">{digit}</span>;
  }

  const num = parseInt(digit, 10);

  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
      <motion.span
        className="absolute top-0 left-0 flex w-full flex-col items-center"
        initial={{ y: 0 }}
        animate={{ y: `${-num * 10}%` }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          mass: 1,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="flex h-[1em] items-center justify-center leading-none">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
};

function RollingNumber({ value }: { value: number }) {
  const formatted = formatNumber(value);
  const digits = formatted.split("");

  return (
    <div className="flex items-center">
      {digits.map((digit, i) => (
        <AnimatedDigit key={`${i}-${digit}`} digit={digit} />
      ))}
    </div>
  );
}

function StarParticles({ particles }: { particles: Particle[] }) {
  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="pointer-events-none absolute"
          initial={{
            opacity: 1,
            scale: particle.scale,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: 0,
            scale: 0,
            x: Math.cos(particle.angle) * 60,
            y: Math.sin(particle.angle) * 60,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          style={{
            left: particle.x,
            top: particle.y,
          }}
        >
          <StarIcon className="h-3 w-3 text-yellow-400" filled />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function GitHubStarButton({
  owner,
  repo,
  stars: manualStars,
  className,
  variant = "default",
}: GitHubStarButtonProps) {
  const { stars, loading } = useGitHubStars(owner, repo, manualStars);
  const [localStars, setLocalStars] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isStarred, setIsStarred] = React.useState(false);
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const buttonRef = React.useRef<HTMLAnchorElement>(null);
  const isNavbar = variant === "navbar";

  React.useEffect(() => {
    if (stars > 0) {
      setLocalStars(stars);
    }
  }, [stars]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isStarred) {
      e.preventDefault();
      setIsStarred(true);
      setLocalStars((prev) => prev + 1);

      const centerX = isNavbar ? 12 : 20;
      const centerY = isNavbar ? 12 : 20;

      const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        angle: (Math.PI * 2 * i) / 12 + Math.random() * 0.3,
        scale: 0.4 + Math.random() * 0.6,
      }));

      setParticles(newParticles);
      setTimeout(() => setParticles([]), 800);

      // After simulation, navigate to the repo
      setTimeout(() => {
        window.open(`https://github.com/${owner}/${repo}`, "_blank");
      }, 600);
    }
  };

  const repoUrl = `https://github.com/${owner}/${repo}`;

  if (loading && localStars === 0) {
    return (
      <div
        className={cn(
          "relative inline-flex animate-pulse items-center rounded-xl border",
          isNavbar
            ? "h-9 gap-2 border-white/10 bg-[#141415] px-3 py-0"
            : "gap-3 border-border bg-card px-4 py-2.5",
          className,
        )}
      >
        <div className={cn("rounded-full bg-muted", isNavbar ? "h-4 w-4" : "h-5 w-5")} />
        <div className={cn("w-px bg-border", isNavbar ? "h-4 bg-white/10" : "h-5")} />
        <div className={cn("rounded bg-muted", isNavbar ? "h-4 w-12" : "h-5 w-20")} />
      </div>
    );
  }

  return (
    <motion.a
      ref={buttonRef}
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative inline-flex items-center rounded-xl border",
        "group cursor-pointer !no-underline transition-all duration-300",
        isNavbar
          ? "h-9 gap-2 border-white/10 bg-[#141415] px-3 py-0 text-zinc-100 shadow-none hover:border-white/20 hover:bg-[#19191b] hover:shadow-none"
          : "gap-3 border-border bg-card px-4 py-2.5 shadow-sm hover:shadow-lg",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={isNavbar ? { scale: 1.02 } : { scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* GitHub Icon */}
      <GitHubIcon className={cn("transition-colors", isNavbar ? "h-4 w-4 text-white" : "h-5 w-5 text-foreground")} />

      {/* Divider */}
      <div className={cn("w-px", isNavbar ? "h-4 bg-white/10" : "h-5 bg-border")} />

      {/* Star Section */}
      <div className="relative flex items-center gap-2">
        <StarParticles particles={particles} />

        <motion.div
          className={cn("relative", isNavbar && "flex items-center")}
          animate={{
            rotate: isHovered || isStarred ? [0, -15, 15, -10, 10, 0] : 0,
            scale: isHovered || isStarred ? 1.2 : 1,
          }}
          transition={{
            rotate: { duration: 0.5, ease: "easeInOut" },
            scale: { type: "spring", stiffness: 300, damping: 15 },
          }}
        >
          <StarIcon
            className={cn(
              "transition-colors duration-300",
              isNavbar ? "h-4 w-4" : "h-5 w-5",
              isHovered || isStarred ? "text-yellow-400" : isNavbar ? "text-zinc-400" : "text-muted-foreground",
            )}
            filled={isHovered || isStarred}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || isStarred ? 0.8 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <StarIcon className={cn("text-yellow-300/80", isNavbar ? "h-4 w-4" : "h-5 w-5")} filled />
          </motion.div>
        </motion.div>

        {/* Divider */}

        {/* Count */}
        <div
          className={cn(
            "font-mono font-semibold tabular-nums",
            isNavbar ? "min-w-[2.5rem] text-sm leading-none text-zinc-100" : "min-w-[3rem] text-sm text-foreground",
          )}
        >
          <RollingNumber value={localStars} />
        </div>
      </div>

      {/* Hover shimmer effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"
          animate={{
            x: isHovered ? ["100%", "-100%"] : "100%",
          }}
          transition={{
            duration: 1.2,
            repeat: isHovered ? Infinity : 0,
            repeatDelay: 0.8,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.a>
  );
}
