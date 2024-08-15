import { useState } from "react";

export const ActionMenu = <T extends { value: string; label: string }>({
  items,
  onAction,
}: {
  items: T[];
  onAction: (item: T) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (item: T) => {
    onAction(item);
    setIsOpen(false);
  };

  return (
    <div>
      <button type="button" onClick={(prev) => setIsOpen(!prev)}>
        Action
      </button>
      {isOpen && (
        <div>
          {items.map((item) => (
            <button type="button" key={item.value} onClick={() => handleAction(item)}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
