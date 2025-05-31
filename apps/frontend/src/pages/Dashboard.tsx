import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { useQuery } from "react-query";
import { PM2Service, ServiceStatus } from "@pm2-dashboard/shared";
import { getServices } from "../api/services";
import { SystemMetricsComponent } from "../components/SystemMetrics";
import { ServiceMetricsComponent } from "../components/ServiceMetrics";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function Dashboard() {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const {
    data: services,
    isLoading,
    error,
  } = useQuery<PM2Service[]>("services", getServices);

  const stats = {
    total: services?.length || 0,
    running:
      services?.filter((s) => s.status === ServiceStatus.ONLINE).length || 0,
    stopped:
      services?.filter((s) => s.status === ServiceStatus.STOPPED).length || 0,
    errored:
      services?.filter((s) => s.status === ServiceStatus.ERRORED).length || 0,
    building:
      services?.filter((s) => s.status === ServiceStatus.BUILDING).length || 0,
  };

  const getStatusColor = (status?: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.ONLINE:
        return "success";
      case ServiceStatus.STOPPED:
        return "default";
      case ServiceStatus.ERRORED:
        return "error";
      case ServiceStatus.BUILDING:
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Services
              </Typography>
              <Typography variant="h3">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Running
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats.running}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Building
              </Typography>
              <Typography variant="h3" color="warning.main">
                {stats.building}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Stopped
              </Typography>
              <Typography variant="h3" color="info.main">
                {stats.stopped}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Errored
              </Typography>
              <Typography variant="h3" color="error.main">
                {stats.errored}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        System Metrics
      </Typography>
      <SystemMetricsComponent />

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        All Services
      </Typography>

      {isLoading ? (
        <Typography>Loading services...</Typography>
      ) : error ? (
        <Typography color="error">Error loading services</Typography>
      ) : services && services.length > 0 ? (
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item key={service._id} xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">{service.name}</Typography>
                  <Chip
                    label={service.status || ServiceStatus.UNKNOWN}
                    color={getStatusColor(service.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Branch: {service.branch}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Environment: {service.activeEnvironment || "None"}
                </Typography>
                {service.status === ServiceStatus.ONLINE && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedServiceId(service._id)}
                    >
                      View Metrics
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No services found</Typography>
      )}
      <Dialog
        open={selectedServiceId !== null}
        onClose={() => setSelectedServiceId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {services?.find((s) => s._id === selectedServiceId)?.name} Metrics
          <IconButton
            aria-label="close"
            onClick={() => setSelectedServiceId(null)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedServiceId && (
            <ServiceMetricsComponent serviceId={selectedServiceId} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
