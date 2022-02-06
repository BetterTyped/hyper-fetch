import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";

import { Container } from "components/container";
import { DETAILS_PAGE, FORM_PAGE, LIST_PAGE } from "constants/routing.constants";

import styles from "./dashboard.module.css";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container name="Dashboard">
      <div className={styles.links}>
        <Card sx={{ maxWidth: 345 }}>
          <CardActionArea onClick={() => navigate(DETAILS_PAGE.path)}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Single entity endpoints
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{ maxWidth: 345 }}>
          <CardActionArea onClick={() => navigate(LIST_PAGE.path)}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                List
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Multi entity endpoints, paginated lists
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{ maxWidth: 345 }}>
          <CardActionArea onClick={() => navigate(FORM_PAGE.path)}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Form
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Forms, Deletes, Queues
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </div>
    </Container>
  );
};
