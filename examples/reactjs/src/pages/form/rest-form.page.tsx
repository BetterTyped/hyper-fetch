import React, { useState } from "react";
import { Link } from "react-router-dom";

import { UserForm } from "./user-form.component";

export const RestFormPage: React.FC = () => {
  const [mount, setMount] = useState(true);

  const handleToggle = () => {
    setMount((prev) => !prev);
  };

  return (
    <div>
      <h1>Rest form</h1>
      <Link to="/">back</Link>
      <p />
      <button type="button" onClick={handleToggle}>
        {mount ? "Unmount" : "Mount"}
      </button>
      {mount && <UserForm />}
    </div>
  );
};
