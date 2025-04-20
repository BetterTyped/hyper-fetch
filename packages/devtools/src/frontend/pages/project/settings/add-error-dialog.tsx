import * as z from "zod";
import { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseResponse } from "@hyper-fetch/core";

import { Button } from "frontend/components/ui/button";
import { Input } from "frontend/components/ui/input";
import { Textarea } from "frontend/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "frontend/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/components/ui/form";
import { SimulatedError } from "frontend/store/project/projects.store";
import { Checkbox } from "frontend/components/ui/checkbox";
import { Label } from "frontend/components/ui/label";

const errorFormSchema = z.object({
  name: z.string().min(1, "Error name is required"),
  status: z.union([z.string(), z.number()]),
  body: z.string().min(1, "Error body is required"),
});

type ErrorFormValues = z.infer<typeof errorFormSchema>;

interface AddErrorDialogProps {
  onAddError: (data: SimulatedError & { initialName?: string }) => void;
  initialError?: SimulatedError;
  isEdit?: boolean;
}

const stringifyBody = (body: any) => {
  try {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return body;
  }
};

export const AddErrorDialog = ({ onAddError, initialError, isEdit }: AddErrorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isNumericStatus, setIsNumericStatus] = useState(true);

  const form = useForm<ErrorFormValues>({
    resolver: zodResolver(errorFormSchema),
    defaultValues: {
      name: "",
      status: "400",
      body: "{}",
    },
  });

  useEffect(() => {
    if (initialError) {
      form.reset({
        name: initialError.name,
        status: initialError.status.toString(),
        body: stringifyBody(initialError.body),
      });
      setIsNumericStatus(typeof initialError.status === "number");
    }
  }, [initialError, form]);

  const onSubmit = (values: ErrorFormValues) => {
    onAddError({
      initialName: initialError?.name,
      name: values.name,
      status: values.status,
      body: parseResponse(values.body),
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="sm" variant="secondary">
            <Pencil className="size-4" />
            Edit
          </Button>
        ) : (
          <Button size="sm" variant="secondary">
            <Plus className="size-4" />
            Add Error Response
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Error Response" : "Add Error Response"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modify the simulated error response."
              : "Create a new simulated error response that will be returned when the request matches."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Error Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Error name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Status Code</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="numeric-status"
                        checked={isNumericStatus}
                        onCheckedChange={(checked: boolean) => {
                          setIsNumericStatus(checked);
                          // Convert current value when switching types
                          if (checked) {
                            const numValue = parseInt(field.value as string, 10);
                            if (!Number.isNaN(numValue)) {
                              field.onChange(numValue);
                            } else {
                              field.onChange(400);
                            }
                          } else {
                            field.onChange(field.value.toString());
                          }
                        }}
                      />
                      <Label
                        htmlFor="numeric-status"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Numeric Status
                      </Label>
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      type={isNumericStatus ? "number" : "text"}
                      placeholder={isNumericStatus ? "Status code" : "Status (e.g. ok, error)"}
                      {...(isNumericStatus ? { min: "400", max: "599" } : {})}
                      {...field}
                      onChange={(e) => {
                        const value = isNumericStatus ? parseInt(e.target.value, 10) : e.target.value;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Error Body (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Error body (JSON)"
                      className="min-h-[100px]"
                      onKeyDown={(event) => {
                        if (event.key === "Tab") {
                          event.preventDefault();
                          const { currentTarget } = event;
                          const { selectionStart, selectionEnd, value } = currentTarget;
                          const newValue = `${value.substring(0, selectionStart)}    ${value.substring(selectionEnd)}`;
                          const newCursorPosition = selectionStart + 4;

                          // Update the form field value
                          field.onChange(newValue);

                          // Update cursor position after React re-renders
                          requestAnimationFrame(() => {
                            currentTarget.selectionStart = newCursorPosition;
                            currentTarget.selectionEnd = newCursorPosition;
                          });
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {isEdit ? "Save Changes" : "Add Error"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
