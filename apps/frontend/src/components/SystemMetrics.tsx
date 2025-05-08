import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Box,
} from "@mui/material";
import { getSystemMetrics, type SystemMetrics } from "../api/pm2";

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

export const SystemMetricsComponent = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await getSystemMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch system metrics");
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

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

  const averageCpuUsage =
    metrics.cpu.usage.reduce((acc, cpu) => acc + cpu.usage, 0) /
    metrics.cpu.usage.length;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Memory Usage
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Used: {formatBytes(metrics.memory.used)} /{" "}
                {formatBytes(metrics.memory.total)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.memory.usagePercentage}
                sx={{ mt: 1 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              CPU Usage
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Average: {averageCpuUsage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={averageCpuUsage}
                sx={{ mt: 1 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Cores: {metrics.cpu.cores}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
