import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Box, Typography, Grid } from "@mui/material";
import { PM2Service, Environment, ServiceStatus } from "@pm2-dashboard/shared";
import {
  getService,
  startService,
  stopService,
  restartService,
  reloadService,
  deleteService,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
  setActiveEnvironment,
  updateService,
} from "../api/services";
import EnvironmentDialog from "../components/EnvironmentDialog";
import EditServiceDialog from "../components/EditServiceDialog";
import { ServiceMetricsComponent } from "../components/ServiceMetrics";
import { ServiceLogs } from "../components/ServiceLogs";
import ServiceActions from "../components/ServiceActions";
import ServiceInformation from "../components/ServiceInformation";
import ServiceEnvironments from "../components/ServiceEnvironments";
import ServiceDomains from "../components/ServiceDomains";
import Notifications from "../components/Notifications";
import ConfirmationDialog from "../components/ConfirmationDialog";

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    type: "service" | "environment";
    itemName: string;
    envName?: string;
  }>({
    open: false,
    type: "service",
    itemName: "",
  });

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

  const reloadMutation = useMutation(reloadService, {
    onSuccess: () => {
      queryClient.invalidateQueries(["service", id]);
      setSuccess("Service reloaded successfully");
    },
    onError: () => {
      setError("Failed to reload service");
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

  const updateServiceMutation = useMutation(
    (data: Partial<PM2Service>) => updateService(id!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["service", id]);
        setSuccess("Service updated successfully");
        setEditDialogOpen(false);
      },
      onError: () => {
        setError("Failed to update service");
      },
    }
  );

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

  const handleReload = async () => {
    setProcessing(true);
    try {
      await reloadMutation.mutateAsync(id!);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmation({
      open: true,
      type: "service",
      itemName: service?.name || "",
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.type === "service") {
      setProcessing(true);
      try {
        await deleteMutation.mutateAsync(id!);
      } finally {
        setProcessing(false);
      }
    } else if (
      deleteConfirmation.type === "environment" &&
      deleteConfirmation.envName
    ) {
      try {
        await deleteEnvironment(id!, deleteConfirmation.envName);
        queryClient.invalidateQueries(["service", id]);
        setSuccess("Environment deleted successfully");
      } catch (error) {
        setError("Failed to delete environment");
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      open: false,
      type: "service",
      itemName: "",
    });
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
    setDeleteConfirmation({
      open: true,
      type: "environment",
      itemName: envName,
      envName,
    });
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

  const handleEditService = async (data: Partial<PM2Service>) => {
    setProcessing(true);
    try {
      await updateServiceMutation.mutateAsync(data);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return <Typography>Loading service details...</Typography>;
  }

  if (!service || !id) {
    return <Typography>Service not found</Typography>;
  }

  const serviceId = id as string;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">{service.name}</Typography>
        <ServiceActions
          status={service.status || "unknown"}
          processing={processing}
          onStart={handleStart}
          onStop={handleStop}
          onRestart={handleRestart}
          onReload={handleReload}
          onEdit={() => setEditDialogOpen(true)}
          onDelete={handleDelete}
        />
      </Box>

      {service.status === ServiceStatus.ONLINE && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Service Metrics
          </Typography>
          <ServiceMetricsComponent serviceId={serviceId} />
        </>
      )}

      <Grid container spacing={2} my={2}>
        <Grid item xs={12} md={6}>
          <ServiceInformation service={service} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ServiceEnvironments
            service={service}
            onAddEnvironment={() => {
              setEditingEnv(null);
              setEnvDialogOpen(true);
            }}
            onEditEnvironment={(env) => {
              setEditingEnv(env);
              setEnvDialogOpen(true);
            }}
            onDeleteEnvironment={handleDeleteEnvironment}
            onSetActiveEnvironment={handleSetActiveEnvironment}
          />
        </Grid>

        <Grid item xs={12}>
          <ServiceDomains serviceId={serviceId} />
        </Grid>
      </Grid>
      {service.status === ServiceStatus.ONLINE && (
        <ServiceLogs serviceId={serviceId} serviceStatus={service.status} />
      )}

      <EnvironmentDialog
        open={envDialogOpen}
        onClose={() => {
          setEnvDialogOpen(false);
          setEditingEnv(null);
        }}
        onSubmit={handleEnvironmentSubmit}
        editingEnv={editingEnv}
      />

      <EditServiceDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditService}
        service={service}
      />

      <ConfirmationDialog
        open={deleteConfirmation.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteConfirmation.type === "service" ? "Service" : "Environment"}`}
        message={
          deleteConfirmation.type === "service"
            ? `Are you sure you want to delete "${deleteConfirmation.itemName}"? This action cannot be undone and will remove the service and its repository files.`
            : `Are you sure you want to delete the environment "${deleteConfirmation.itemName}"?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <Notifications
        success={success}
        error={error}
        onCloseSuccess={() => setSuccess(null)}
        onCloseError={() => setError(null)}
      />
    </Box>
  );
}
