import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Storage as StorageIcon } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServices,
  startService,
  stopService,
  restartService,
  reloadService,
  deleteService,
} from "../api/services";
import { PM2Service } from "@pm2-dashboard/shared";
import { useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import ServiceCard from "../components/ServiceCard";

export default function Services() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    serviceId: string;
    serviceName: string;
  }>({
    open: false,
    serviceId: "",
    serviceName: "",
  });

  // Track loading states for each service action
  const [loadingStates, setLoadingStates] = useState<{
    [serviceId: string]: {
      starting?: boolean;
      stopping?: boolean;
      restarting?: boolean;
      reloading?: boolean;
    };
  }>({});

  const { data: services = [], isLoading } = useQuery<PM2Service[], Error>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const startMutation = useMutation<void, Error, string>({
    mutationFn: startService,
    onMutate: (serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], starting: true },
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onSettled: (_, __, serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], starting: false },
      }));
    },
  });

  const stopMutation = useMutation<void, Error, string>({
    mutationFn: stopService,
    onMutate: (serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], stopping: true },
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onSettled: (_, __, serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], stopping: false },
      }));
    },
  });

  const restartMutation = useMutation<void, Error, string>({
    mutationFn: restartService,
    onMutate: (serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], restarting: true },
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onSettled: (_, __, serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], restarting: false },
      }));
    },
  });

  const reloadMutation = useMutation<void, Error, string>({
    mutationFn: reloadService,
    onMutate: (serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], reloading: true },
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onSettled: (_, __, serviceId) => {
      setLoadingStates((prev) => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], reloading: false },
      }));
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const handleDeleteClick = (serviceId: string, serviceName: string) => {
    setDeleteConfirmation({
      open: true,
      serviceId,
      serviceName,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteConfirmation.serviceId);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      open: false,
      serviceId: "",
      serviceName: "",
    });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Loading services...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Services
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor your PM2 services
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate("/services/new")}
          sx={{ px: 3 }}
        >
          Add Service
        </Button>
      </Box>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card
          sx={{
            textAlign: "center",
            py: 8,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          }}
        >
          <CardContent>
            <StorageIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No services yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get started by adding your first PM2 service
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/services/new")}
            >
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} lg={4} key={service._id}>
              <ServiceCard
                service={service}
                onStart={(id) => startMutation.mutate(id)}
                onStop={(id) => stopMutation.mutate(id)}
                onRestart={(id) => restartMutation.mutate(id)}
                onReload={(id) => reloadMutation.mutate(id)}
                onDelete={handleDeleteClick}
                isStarting={loadingStates[service._id]?.starting}
                isStopping={loadingStates[service._id]?.stopping}
                isRestarting={loadingStates[service._id]?.restarting}
                isReloading={loadingStates[service._id]?.reloading}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmation.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteConfirmation.serviceName}"? This action cannot be undone and will remove the service and its repository files.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </Box>
  );
}
