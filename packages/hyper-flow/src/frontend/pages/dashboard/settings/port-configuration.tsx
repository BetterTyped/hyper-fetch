import { toast } from "sonner";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Cpu, Info, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardTitle, CardDescription, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useSettings } from "@/store/general/settings.store";

const portSchema = z.object({
  port: z.number().int().min(1, "Port must be at least 1").max(65535, "Port cannot exceed 65535"),
});

type PortConfigurationFormData = z.infer<typeof portSchema>;

export const PortConfiguration = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Dummy state for demonstration
  const [loading, setLoading] = useState(false);

  const { serverStatus, settings, setServerPort } = useSettings();

  const form = useForm<PortConfigurationFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      port: settings.serverPort,
    },
  });

  const handleSubmit = (data: PortConfigurationFormData) => {
    if (loading) return;
    setLoading(true);
    window.electron.server.restart({ port: data.port }).then(({ success, message }) => {
      if (success) {
        setIsDialogOpen(false);
        setServerPort(data.port);
        toast.success(message);
      } else {
        toast.error(message);
      }
      setLoading(false);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="size-4" />
          Server Configuration
        </CardTitle>
        <CardDescription>
          A background server that runs alongside your application to communicate with the HyperFetch DevTools plugin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-muted-foreground">Current Port</div>
          <div className="text-2xl font-bold">{settings.serverPort}</div>
        </div>
        <div className="flex-1">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Server Status</div>
            <div className="flex items-center gap-2">
              {serverStatus === "running" ? (
                <>
                  <div className="relative">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-green-500 font-medium">Running</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-red-500 font-medium">Crashed</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Setup</div>
            <Button size="sm" variant="secondary" onClick={() => setIsDialogOpen(true)} className="w-fit">
              <Wrench className="size-4 mr-1" />
              Change Port
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {serverStatus === "crashed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Server Crashed</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>The server has crashed. Please check the logs or try changing the port.</span>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setLoading(true);
                  window.electron.server.restart({ port: settings.serverPort }).then(({ success, message }) => {
                    if (success) {
                      toast.success(message);
                    } else {
                      toast.error(message);
                    }
                    setLoading(false);
                  });
                }}
                disabled={loading}
              >
                Restart Server
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertTitle>Additional information</AlertTitle>
          <AlertDescription>
            Backend server listens for connections from applications using the plugin and facilitates real-time
            information exchange. It enables monitoring of network requests, caching behavior, and application state in
            real-time. You can change the port if the default one conflicts with other services.
          </AlertDescription>
        </Alert>
      </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Port</DialogTitle>
            <DialogDescription>
              Enter a new port number for the application server. The server will need to restart for changes to take
              effect.
            </DialogDescription>
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                If you change the port, you must update the plugin configuration in your application to use the same
                port.
              </AlertDescription>
            </Alert>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="65535"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
