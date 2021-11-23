import React, { useState } from "react";
import { Link } from "react-router-dom";

import { UserDetails } from "./user-details.component";

export const RestDetailsPage: React.FC = () => {
  const [mount, setMount] = useState(true);

  const handleToggle = () => {
    setMount((prev) => !prev);
  };

  return (
    <div>
      <h1>Rest details</h1>
      <Link to="/">back</Link>
      <p />
      <button type="button" onClick={handleToggle}>
        {mount ? "Unmount" : "Mount"}
      </button>
      {mount && <UserDetails />}
    </div>
  );
};
