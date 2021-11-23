import React from "react";
import { Link } from "react-router-dom";

import styles from "./dashboard.module.css";

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1>Rest examples</h1>
      <div className={styles.links}>
        <Link to="rest/details">Details</Link>
        <Link to="rest/list">List</Link>
        <Link to="rest/form">Form</Link>
      </div>
    </div>
  );
};
