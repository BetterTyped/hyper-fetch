import { useNavigate } from "react-router-dom";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

import { Viewer } from "../components/viewer";
import { routing } from "../constants/routing.constants";

export function Index() {
  const { navigate } = routing.useLocation();

  return (
    <Viewer name="Dashboard" noButtons>
      <Card sx={{ maxWidth: 345, mb: 2 }}>
        <CardActionArea onClick={() => navigate({ to: "Details" })}>
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
        <CardActionArea onClick={() => navigate({ to: "List" })}>
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
        <CardActionArea onClick={() => navigate({ to: "Form" })}>
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
