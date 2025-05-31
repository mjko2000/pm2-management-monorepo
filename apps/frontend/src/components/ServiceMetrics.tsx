import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import { getServiceMetrics, type ServiceMetrics } from "../api/pm2";

const formatBytes = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

const formatUptime = (uptime: number): string => {
  const seconds = Math.floor((Date.now() - uptime) / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "online":
      return "success";
    case "stopped":
      return "default";
    case "errored":
    case "error":
      return "error";
    case "stopping":
    case "launching":
      return "warning";
    default:
      return "default";
  }
};

interface ServiceMetricsProps {
  serviceId: string;
}

export const ServiceMetricsComponent = ({ serviceId }: ServiceMetricsProps) => {
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await getServiceMetrics(serviceId);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch service metrics");
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [serviceId]);

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading metrics...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {metrics.cpu.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.cpu}
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(metrics.memory)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.memory / (1024 * 1024 * 100)) * 100} // Assuming 100MB as max for visualization
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uptime
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatUptime(metrics.uptime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Restarts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metrics.restarts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instances
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metrics.instances}{" "}
                {metrics.instances === 1 ? "instance" : "instances"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Individual Process Status for Cluster Mode */}
      {metrics.processes && metrics.processes.length > 1 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Process Details (Cluster Mode)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>PID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>CPU (%)</TableCell>
                    <TableCell>Memory</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Restarts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.processes.map((process, index) => (
                    <TableRow key={process.pid || index}>
                      <TableCell>{process.pid}</TableCell>
                      <TableCell>
                        <Chip
                          label={process.status}
                          color={getStatusColor(process.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{process.cpu.toFixed(1)}%</TableCell>
                      <TableCell>{formatBytes(process.memory)}</TableCell>
                      <TableCell>{formatUptime(process.uptime)}</TableCell>
                      <TableCell>{process.restarts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
