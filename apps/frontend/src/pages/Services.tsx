import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServices,
  startService,
  stopService,
  restartService,
  deleteService,
} from "../api/services";
import { PM2Service } from "@pm2-dashboard/shared";

export default function Services() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery<PM2Service[], Error>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const startMutation = useMutation<void, Error, string>({
    mutationFn: startService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const stopMutation = useMutation<void, Error, string>({
    mutationFn: stopService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const restartMutation = useMutation<void, Error, string>({
    mutationFn: restartService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "stopped":
        return "default";
      case "errored":
        return "error";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Services</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/services/new")}
        >
          Add Service
        </Button>
      </Box>

      <Grid container spacing={3}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service._id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="div">
                    {service.name}
                  </Typography>
                  <Chip
                    label={service.status}
                    color={getStatusColor(service.status || "unknown")}
                    size="small"
                  />
                </Box>

                <Typography color="text.secondary" gutterBottom>
                  {service.repositoryUrl}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Branch: {service.branch}
                </Typography>

                {service.sourceDirectory && (
                  <Typography variant="body2" color="text.secondary">
                    Source Directory: {service.sourceDirectory}
                  </Typography>
                )}

                {service.useNpm ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      npm Script: {service.npmScript}
                    </Typography>
                    {service.npmArgs && service.npmArgs.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        npm Args: {service.npmArgs.join(" ")}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Script: {service.script}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 2,
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/services/${service._id}`)}
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => startMutation.mutate(service._id)}
                    disabled={service.status === "online"}
                  >
                    <StartIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => stopMutation.mutate(service._id)}
                    disabled={service.status === "stopped"}
                  >
                    <StopIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => restartMutation.mutate(service._id)}
                    disabled={service.status === "stopped"}
                  >
                    <RestartIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => deleteMutation.mutate(service._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
