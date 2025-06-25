import { useNavigate } from "react-router-dom";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

import { Viewer } from "../components/viewer";

export function Index() {
  const navigate = useNavigate();

  return (
    <Viewer name="Dashboard" noButtons>
      <Card sx={{ maxWidth: 345, mb: 2 }}>
        <CardActionArea onClick={() => navigate("/details")}>
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
        <CardActionArea onClick={() => navigate("/list")}>
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
        <CardActionArea onClick={() => navigate("/forms")}>
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

// eslint-disable-next-line import/no-default-export
export default Index;
