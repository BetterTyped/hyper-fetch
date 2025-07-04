import { useState } from "react";
import { CacheValueType } from "@hyper-fetch/core";
import { TrashIcon, FileXIcon, TriangleAlert, Database, XIcon, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SidebarHeader } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DevtoolsCacheEvent } from "@/context/applications/types";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStore } from "@/store/applications/cache.store";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SimulatedError } from "@/store/applications/apps.store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export const SectionToolbar = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { application, client } = useDevtools();
  const [selectedError, setSelectedError] = useState<SimulatedError | null>(null);
  const { setCacheItem, closeDetails } = useCacheStore(
    useShallow((selector) => ({
      setCacheItem: selector.setCacheItem,
      closeDetails: selector.closeDetails,
    })),
  );

  const { settings } = application;

  const invalidate = () => {
    if (!item) return;
    client.cache.events.emitInvalidation(item.cacheKey, true);
  };

  const closeSidebar = () => {
    closeDetails(application.name);
  };

  const remove = () => {
    client.cache.events.emitDelete(item.cacheKey, true);
  };

  const simulateError = (simulatedError: SimulatedError) => {
    if (!item) return;
    const data: CacheValueType<unknown, unknown, any> = {
      ...item.cacheData,
      data: null,
      error: simulatedError.body,
      responseTimestamp: Date.now(),
      extra: client.adapter.defaultExtra,
      success: false,
      cached: true,
    };
    setCacheItem({
      application: application.name,
      cacheKey: item.cacheKey,
      cacheData: data,
    });
    client.cache.events.emitCacheData(data, true);
  };

  return (
    <SidebarHeader className="flex flex-row items-center h-12 mt-1 border-b border-sidebar-border gap-3">
      <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2" onClick={closeSidebar}>
        <XIcon className="h-4 w-4 stroke-muted-foreground" />
      </Button>
      <div className="flex flex-row items-center gap-1 text-sm font-light text-muted-foreground flex-1">
        <span className="flex flex-row items-center gap-1 font-medium">
          <Database className="w-4 h-4" /> Cache
        </span>{" "}
        / Details
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="quaternary" size="sm">
            <Sparkles className="size-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuLabel className="flex flex-row items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Cache Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Simulate Error */}
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <TriangleAlert className="mr-2 h-4 w-4" />
                Simulate Error
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Simulate Error</DialogTitle>
                <DialogDescription>
                  This will simulate an error state for this cache entry. Select the error type below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <RadioGroup
                  value={selectedError?.body ? JSON.stringify(selectedError.body) : undefined}
                  onValueChange={(value) => {
                    const error = Object.values(settings.simulatedErrors).find((e) => JSON.stringify(e.body) === value);
                    setSelectedError(error || null);
                  }}
                >
                  {Object.entries(settings.simulatedErrors).map(([name, errorData]) => (
                    <div key={name}>
                      <RadioGroupItem value={JSON.stringify(errorData.body)} id={name} className="peer sr-only" />
                      <label
                        htmlFor={name}
                        className={cn(
                          "flex flex-col gap-2 p-4 text-left border rounded-lg transition-colors cursor-pointer",
                          "hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{name}</span>
                          <span className="text-sm text-muted-foreground">Status: {errorData.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {errorData.body instanceof Error ? errorData.body.message : JSON.stringify(errorData.body)}
                        </p>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (!selectedError) return;
                      simulateError(selectedError);
                    }}
                  >
                    Continue
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FileXIcon className="mr-2 size-4" />
                Invalidate Cache
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Invalidate Cache Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate the current cache entry. The data will need to be refetched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={invalidate}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DropdownMenuSeparator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <TrashIcon className="mr-2 size-4" />
                Remove Cache Entry
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Cache Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this cache entry. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700">
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  );
};
