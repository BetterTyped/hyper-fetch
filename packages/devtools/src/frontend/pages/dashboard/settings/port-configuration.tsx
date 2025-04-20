import { useState } from "react";
import { AlertCircle, CheckCircle2, Cpu, Info, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "frontend/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "frontend/components/ui/form";
import { Input } from "frontend/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "frontend/components/ui/alert";
import { Card, CardTitle, CardDescription, CardHeader, CardContent, CardFooter } from "frontend/components/ui/card";

interface PortConfigurationFormData {
  port: string;
}

export const PortConfiguration = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Dummy state for demonstration
  const [serverStatus] = useState<"running" | "crashed">("running");
  const [currentPort, setCurrentPort] = useState("3000");

  const form = useForm<PortConfigurationFormData>({
    defaultValues: {
      port: currentPort,
    },
  });

  const handleSubmit = (data: PortConfigurationFormData) => {
    // Dummy function for now
    setCurrentPort(data.port);
    setIsDialogOpen(false);
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
          <div className="text-2xl font-bold">{currentPort}</div>
        </div>
        <div className="flex-1">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Server Status</div>
            <div className="flex items-center gap-2">
              {serverStatus === "running" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-green-500 font-medium">Running</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
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
            <AlertDescription>The server has crashed. Please check the logs or try changing the port.</AlertDescription>
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
                      <Input type="number" min="1" max="65535" {...field} />
                    </FormControl>
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
