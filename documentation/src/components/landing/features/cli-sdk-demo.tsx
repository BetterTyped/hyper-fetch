/* eslint-disable react/jsx-no-comment-textnodes */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Sparkles, Code, Check, MousePointer2 } from "lucide-react";

import { FeaturesCard } from "./features-card";
import { Box } from "./box";

export function CliSdkDemo() {
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const steps = [
    {
      title: "Generate from OpenAPI",
      command: "npx hyper-fetch generate",
      status: "running",
    },
    {
      title: "Types Generated",
      command: "✓ Creating type definitions...",
      status: "complete",
    },
    {
      title: "SDK Ready",
      command: "✓ SDK generated successfully!",
      status: "complete",
    },
    {
      title: "Autocomplete Active",
      command: "Done! 🎉",
      status: "demo",
    },
  ];

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setStep((prev) => (prev + 1) % steps.length);
      }, steps.length * 500);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  return (
    <FeaturesCard bgColor="transparent">
      <div className="h-fit w-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="grid gap-4">
          {/* Terminal Section */}
          <Box className="flex flex-col h-48">
            <div className="flex items-center gap-2 p-4 border-b border-white/10">
              <Terminal className="size-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Terminal</span>
              <div className="flex gap-1 ml-auto">
                <div className="size-2 rounded-full bg-red-400" />
                <div className="size-2 rounded-full bg-yellow-400" />
                <div className="size-2 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400">$</span>
                    <span className="text-gray-300">{steps[step].command}</span>
                    {steps[step].status === "running" && (
                      <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="size-2 bg-green-400 rounded-full"
                      />
                    )}
                    {steps[step].status === "complete" && <Check className="size-4 text-green-400" />}
                  </div>
                  {step === 0 && <div className="text-xs text-gray-500 ml-4">📄 Fetching OpenAPI schema...</div>}
                </motion.div>
              </AnimatePresence>
            </div>
          </Box>

          {/* Code Section */}
          <Box className="flex flex-col h-64">
            <div className="flex items-center gap-2 p-4 border-b border-white/10">
              <Code className="size-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Generated SDK</span>
              <Sparkles className="size-4 text-yellow-400 ml-auto" />
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-hidden">
              <motion.div animate={{ opacity: step >= 2 ? 1 : 0.3 }} transition={{ duration: 0.5 }}>
                <div className="space-y-1">
                  <div className="text-purple-400">// Generated SDK with full types</div>
                  {step >= 3 && (
                    <span className="text-gray-300">
                      <span className="!text-blue-500">const</span> <span className="!text-blue-400">response</span> ={" "}
                      <span className="!text-purple-500">await</span>{" "}
                      <span className="relative">
                        <span className="!text-yellow-400 relative">
                          sdk
                          {/* Mouse cursor over "sdk" */}
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                x: [0, 2, 0],
                                y: [0, -1, 0],
                              }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{
                                duration: 0.4,
                                x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                              }}
                              className="absolute top-1 -right-1 pointer-events-none"
                            >
                              <MousePointer2 className="size-4 stroke-white fill-black drop-shadow-md rotate-12" />
                            </motion.div>
                          </AnimatePresence>
                          {/* Autocomplete suggestions */}
                          <AnimatePresence>
                            {step >= 3 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className="absolute top-6 right-0 md:right-[-150px] translate-x-1/2 flex justify-end"
                              >
                                <div className="text-xs space-y-1 bg-gray-800 border border-gray-600 rounded-md p-2 shadow-lg min-w-[250px]">
                                  <div className="flex items-center gap-2 bg-blue-600 px-2 py-1 rounded text-white text-xs md:text-base">
                                    <span>users</span>
                                    <span className="md:text-xs text-blue-200">• GET /users</span>
                                  </div>
                                  <div className="flex items-center gap-2 px-2 py-1 text-gray-300 hover:bg-gray-700 rounded text-xs md:text-base">
                                    <span>posts</span>
                                    <span className="md:text-xs text-gray-400">• GET /posts</span>
                                  </div>
                                  <div className="hidden md:flex items-center gap-2 px-2 py-1 text-gray-300 hover:bg-gray-700 rounded text-xs">
                                    <span>products</span>
                                    <span className="md:text-xs text-gray-400">• GET /products</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </span>
                      </span>
                      .
                    </span>
                  )}

                  <div className="text-gray-500 mt-4">
                    {step === 2 && (
                      <>
                        <div className="!text-green-400">✓ Full TypeScript support</div>
                        <div className="!text-green-400">✓ Auto-generated from schema</div>
                        <div className="!text-green-400">✓ tRPC-like syntax</div>
                      </>
                    )}
                    {step === 1 && <div className="text-gray-600">Generating...</div>}
                  </div>
                </div>
              </motion.div>
            </div>
          </Box>
        </div>
      </div>
    </FeaturesCard>
  );
}
