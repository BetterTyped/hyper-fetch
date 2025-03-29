interface ProjectCardProps {
  project: {
    // ... existing project props ...
    isOnline?: boolean; // Add this new prop
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className={`relative rounded-lg border p-4 ${!project.isOnline ? "opacity-60" : ""}`}>
      {project.isOnline && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Online
          </span>
        </div>
      )}
      // ... existing card content ...
    </div>
  );
}
