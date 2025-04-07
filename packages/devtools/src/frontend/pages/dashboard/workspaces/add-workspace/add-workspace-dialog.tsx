import { useState } from "react";
import { FolderOpen, Upload } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "frontend/components/ui/dialog";
import { Button } from "frontend/components/ui/button";
import { Input } from "frontend/components/ui/input";
import { Label } from "frontend/components/ui/label";
import { useWorkspaces } from "frontend/store/workspace/workspaces.store";

interface AddWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddWorkspaceDialog = ({ open, onOpenChange }: AddWorkspaceDialogProps) => {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const addWorkspace = useWorkspaces((state) => state.addWorkspace);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (name.trim()) {
      addWorkspace({
        id: `workspace-${Date.now()}`,
        name,
        icon: iconPreview || iconUrl,
      });

      // Reset form
      setName("");
      setIconUrl("");
      setIconPreview(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div
              className="h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border cursor-pointer"
              onClick={() => document.getElementById("icon-upload")?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  document.getElementById("icon-upload")?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload workspace icon"
            >
              {iconPreview ? (
                <img src={iconPreview} alt="Workspace icon" className="w-full h-full object-cover" />
              ) : (
                <FolderOpen className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <input id="icon-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" size="sm" onClick={() => document.getElementById("icon-upload")?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Icon
            </Button>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="My Workspace"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={!name.trim()}>
            Create Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
