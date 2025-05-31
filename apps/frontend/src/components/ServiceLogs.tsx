import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuery } from "react-query";
import { getServiceLogs } from "../api/services";
import { ServiceStatus } from "@pm2-dashboard/shared";

interface ServiceLogsProps {
  serviceId: string;
  serviceStatus?: ServiceStatus;
}

export const ServiceLogs: React.FC<ServiceLogsProps> = ({
  serviceId,
  serviceStatus,
}) => {
  const [lines, setLines] = useState(100);

  const { data, isLoading, refetch } = useQuery(
    ["serviceLogs", serviceId, lines],
    () => getServiceLogs(serviceId, lines),
    {
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  const handleRefresh = () => {
    refetch();
  };

  const isReloadDisabled =
    serviceStatus === ServiceStatus.BUILDING ||
    serviceStatus === ServiceStatus.STOPPED ||
    serviceStatus === ServiceStatus.ERRORED;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Service Logs
        </Typography>
        <TextField
          size="small"
          type="number"
          label="Lines"
          value={lines}
          onChange={(e) => setLines(Number(e.target.value))}
          sx={{ width: 100, mr: 2 }}
        />
        <IconButton
          onClick={handleRefresh}
          disabled={isLoading || isReloadDisabled}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      <Paper
        sx={{
          p: 2,
          height: 400,
          overflow: "auto",
          bgcolor: "#1e1e1e",
          color: "#fff",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          data?.logs || "No logs available"
        )}
      </Paper>
    </Box>
  );
};
