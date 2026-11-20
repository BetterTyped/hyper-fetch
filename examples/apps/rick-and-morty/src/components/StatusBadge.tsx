import type { CharacterStatus } from "../api/characters";

export const StatusBadge = ({ status }: { status: CharacterStatus }) => (
  <span className={`status status-${status.toLowerCase()}`}>{status}</span>
);
