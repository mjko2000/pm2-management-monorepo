import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLogs, clearLogs } from "../api/logs";

const LogLevelColors = {
  info: "primary",
  error: "error",
  warn: "warning",
  debug: "default",
  verbose: "secondary",
} as const;

export const Logs: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [level, setLevel] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["logs", page, rowsPerPage, level, context],
    queryFn: () =>
      getLogs(
        rowsPerPage,
        page * rowsPerPage,
        level || undefined,
        context || undefined
      ),
  });

  const clearLogsMutation = useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
    onError: () => {
      setError("Failed to clear logs");
    },
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all logs?")) {
      clearLogsMutation.mutate();
    }
  };

  const handleRefreshLogs = () => {
    refetch();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Logs
      </Typography>

      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={level}
            label="Level"
            onChange={(e) => setLevel(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
            <MenuItem value="verbose">Verbose</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <Tooltip title="Reload Logs">
          <IconButton onClick={handleRefreshLogs} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear All Logs">
          <IconButton onClick={handleClearLogs} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Context</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : data?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.level}
                        color={
                          LogLevelColors[
                            log.level as keyof typeof LogLevelColors
                          ] || "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.context || "-"}</TableCell>
                    <TableCell>
                      {log.message}
                      {log.trace && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="error"
                        >
                          {log.trace}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={data?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};
