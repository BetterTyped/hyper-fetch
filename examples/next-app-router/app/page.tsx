"use client";

import { useRouter } from "next/navigation";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

import { Viewer } from "../components/viewer";
import { DETAILS_PAGE, FORM_PAGE, LIST_PAGE } from "../constants/routing.constants";

export function Index() {
  const { push } = useRouter();

  return (
    <Viewer name="Dashboard" noButtons>
      <Card sx={{ maxWidth: 345, mb: 2 }}>
        <CardActionArea onClick={() => push(DETAILS_PAGE.path)}>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Server side rendering
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data hydration
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      <Card sx={{ maxWidth: 345, mb: 2 }}>
        <CardActionArea onClick={() => push(DETAILS_PAGE.path)}>
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
      <Card sx={{ maxWidth: 345, mb: 2 }}>
        <CardActionArea onClick={() => push(LIST_PAGE.path)}>
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
      <Card sx={{ maxWidth: 345, mb: 2 }}>
        <CardActionArea onClick={() => push(FORM_PAGE.path)}>
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
    </Viewer>
  );
}

export default Index;
