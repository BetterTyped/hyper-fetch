import React, { useState } from "react";
import { Link } from "react-router-dom";

import { UsersList } from "./users-list.component";

export const RestListPage: React.FC = () => {
  const [mount, setMount] = useState(true);

  const handleToggle = () => {
    setMount((prev) => !prev);
  };

  return (
    <div>
      <h1>Rest list</h1>
      <Link to="/">back</Link>
      <p />
      <button type="button" onClick={handleToggle}>
        {mount ? "Unmount" : "Mount"}
      </button>
      {mount && <UsersList />}
    </div>
  );
};
