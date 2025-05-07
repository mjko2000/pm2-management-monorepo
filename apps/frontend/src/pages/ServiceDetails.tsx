import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { PM2Service, Environment } from "@pm2-dashboard/shared";
import {
  getService,
  startService,
  stopService,
  restartService,
  deleteService,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
  setActiveEnvironment,
} from "../api/services";
import EnvironmentDialog from "../components/EnvironmentDialog";

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  const { data: service, isLoading } = useQuery<PM2Service>(
    ["service", id],
    () => getService(id!),
    {
      enabled: !!id,
    }
  );

  const startMutation = useMutation(startService, {
    onSuccess: () => {
      queryClient.invalidateQueries(["service", id]);
      setSuccess("Service started successfully");
    },
    onError: () => {
      setError("Failed to start service");
    },
  });

  const stopMutation = useMutation(stopService, {
    onSuccess: () => {
      queryClient.invalidateQueries(["service", id]);
      setSuccess("Service stopped successfully");
    },
    onError: () => {
      setError("Failed to stop service");
    },
  });

  const restartMutation = useMutation(restartService, {
    onSuccess: () => {
      queryClient.invalidateQueries(["service", id]);
      setSuccess("Service restarted successfully");
    },
    onError: () => {
      setError("Failed to restart service");
    },
  });

  const deleteMutation = useMutation(deleteService, {
    onSuccess: () => {
      navigate("/services");
    },
    onError: () => {
      setError("Failed to delete service");
    },
  });

  const handleStart = async () => {
    setProcessing(true);
    try {
      await startMutation.mutateAsync(id!);
    } finally {
      setProcessing(false);
    }
  };

  const handleStop = async () => {
    setProcessing(true);
    try {
      await stopMutation.mutateAsync(id!);
    } finally {
      setProcessing(false);
    }
  };

  const handleRestart = async () => {
    setProcessing(true);
    try {
      await restartMutation.mutateAsync(id!);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      setProcessing(true);
      try {
        await deleteMutation.mutateAsync(id!);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleEnvironmentSubmit = async (data: Environment) => {
    try {
      if (editingEnv) {
        await updateEnvironment(id!, editingEnv.name, data);
      } else {
        await addEnvironment(id!, data);
      }
      queryClient.invalidateQueries(["service", id]);
      setEnvDialogOpen(false);
      setEditingEnv(null);
      setSuccess(
        `Environment ${editingEnv ? "updated" : "added"} successfully`
      );
    } catch (error) {
      setError(`Failed to ${editingEnv ? "update" : "add"} environment`);
    }
  };

  const handleDeleteEnvironment = async (envName: string) => {
    if (window.confirm("Are you sure you want to delete this environment?")) {
      try {
        await deleteEnvironment(id!, envName);
        queryClient.invalidateQueries(["service", id]);
        setSuccess("Environment deleted successfully");
      } catch (error) {
        setError("Failed to delete environment");
      }
    }
  };

  const handleSetActiveEnvironment = async (envName: string) => {
    try {
      await setActiveEnvironment(id!, envName);
      queryClient.invalidateQueries(["service", id]);
      setSuccess("Active environment updated");
    } catch (error) {
      setError("Failed to update active environment");
    }
  };

  if (isLoading) {
    return <Typography>Loading service details...</Typography>;
  }

  if (!service) {
    return <Typography>Service not found</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">{service.name}</Typography>
        <Box>
          {service.status !== "online" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={handleStart}
              disabled={processing}
              sx={{ mr: 1 }}
            >
              Start
            </Button>
          )}

          {service.status === "online" && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRestart}
                disabled={processing}
                sx={{ mr: 1 }}
              >
                Restart
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStop}
                disabled={processing}
                sx={{ mr: 1 }}
              >
                Stop
              </Button>
            </>
          )}

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={processing}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Service Information" />
            <Divider />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                <strong>Repository:</strong> {service.repositoryUrl}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Branch:</strong> {service.branch}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Script:</strong> {service.script}
              </Typography>
              {service.sourceDirectory && (
                <Typography variant="body1" gutterBottom>
                  <strong>Source Directory:</strong> {service.sourceDirectory}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong>{" "}
                <Chip
                  label={service.status || "unknown"}
                  color={
                    service.status === "online"
                      ? "success"
                      : service.status === "stopped"
                        ? "default"
                        : "error"
                  }
                  size="small"
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Environments"
              action={
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingEnv(null);
                    setEnvDialogOpen(true);
                  }}
                >
                  Add Environment
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {service.environments.length === 0 ? (
                <Typography>No environments configured</Typography>
              ) : (
                service.environments.map((env) => (
                  <Paper key={env.name} sx={{ p: 2, mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6">
                        {env.name}
                        {service.activeEnvironment === env.name && (
                          <Chip
                            label="Active"
                            color="primary"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Box>
                        {service.activeEnvironment !== env.name && (
                          <Button
                            size="small"
                            onClick={() => handleSetActiveEnvironment(env.name)}
                            sx={{ mr: 1 }}
                          >
                            Set Active
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingEnv(env);
                            setEnvDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteEnvironment(env.name)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {env.description && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {env.description}
                      </Typography>
                    )}
                    <Typography variant="subtitle2" gutterBottom>
                      Environment Variables:
                    </Typography>
                    {env.variables &&
                      Object.entries(env.variables).map(([key, value]) => (
                        <Typography key={key} variant="body2">
                          {key}: {value}
                        </Typography>
                      ))}
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EnvironmentDialog
        open={envDialogOpen}
        onClose={() => {
          setEnvDialogOpen(false);
          setEditingEnv(null);
        }}
        onSubmit={handleEnvironmentSubmit}
        editingEnv={editingEnv}
      />

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

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
}
