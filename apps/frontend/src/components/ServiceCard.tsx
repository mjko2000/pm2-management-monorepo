import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  Tooltip,
  IconButton,
  Button,
  Box,
  alpha,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  SystemUpdateAlt as ReloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  AutoMode as AutoModeIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { PM2Service, ServiceStatus } from "@pm2-dashboard/shared";

interface ServiceCardProps {
  service: PM2Service;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onReload: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isStarting?: boolean;
  isStopping?: boolean;
  isRestarting?: boolean;
  isReloading?: boolean;
}

export default function ServiceCard({
  service,
  onStart,
  onStop,
  onRestart,
  onReload,
  onDelete,
  isStarting = false,
  isStopping = false,
  isRestarting = false,
  isReloading = false,
}: ServiceCardProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  const getStatusColor = (status: string) => {
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

  const isDisabled =
    service.status === ServiceStatus.BUILDING ||
    isStarting ||
    isStopping ||
    isRestarting ||
    isReloading;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header Section */}
        <ServiceCardHeader
          service={service}
          getStatusColor={getStatusColor}
          onViewDetails={() => navigate(`/services/${service._id}`)}
        />

        <Divider sx={{ my: 2 }} />

        {/* Info Section */}
        <ServiceCardInfo service={service} theme={theme} />

        <Divider sx={{ my: 2 }} />

        {/* Actions Section */}
        <ServiceCardActions
          service={service}
          onStart={() => onStart(service._id)}
          onStop={() => onStop(service._id)}
          onRestart={() => onRestart(service._id)}
          onReload={() => onReload(service._id)}
          onDelete={() => onDelete(service._id, service.name)}
          isStarting={isStarting}
          isStopping={isStopping}
          isRestarting={isRestarting}
          isReloading={isReloading}
          isDisabled={isDisabled}
          theme={theme}
        />
      </CardContent>
    </Card>
  );
}

// Header Component
interface ServiceCardHeaderProps {
  service: PM2Service;
  getStatusColor: (status: string) => any;
  onViewDetails: () => void;
}

function ServiceCardHeader({
  service,
  getStatusColor,
  onViewDetails,
}: ServiceCardHeaderProps) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      mb={2}
    >
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="h6"
          component="div"
          fontWeight={600}
          sx={{
            mb: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {service.name}
        </Typography>
        <Chip
          label={service.status}
          color={getStatusColor(service.status || "unknown")}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Box>
      <Tooltip title="View Details">
        <IconButton
          size="small"
          onClick={onViewDetails}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
            },
          }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// Info Component
interface ServiceCardInfoProps {
  service: PM2Service;
  theme: any;
}

function ServiceCardInfo({ service, theme }: ServiceCardInfoProps) {
  return (
    <Stack spacing={1.5} mb={2}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <StorageIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.25 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Repository
          </Typography>
          <Typography
            variant="body2"
            sx={{
              wordBreak: "break-all",
              fontSize: "0.875rem",
            }}
          >
            {service.repositoryUrl.split("/").slice(-2).join("/")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CodeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Branch
          </Typography>
          <Chip
            label={service.branch}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: "0.75rem" }}
          />
        </Box>
      </Box>

      {service.useNpm && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CodeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              NPM Script
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {service.npmScript}
            </Typography>
          </Box>
        </Box>
      )}

      {service.autostart && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoModeIcon
            sx={{
              fontSize: 18,
              color: theme.palette.success.main,
            }}
          />
          <Typography variant="body2" color="success.main" fontWeight={500}>
            Autostart enabled
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {service.visibility === "public" ? (
          <PublicIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
        ) : (
          <PrivateIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
        )}
        <Typography
          variant="body2"
          color={service.visibility === "public" ? "info.main" : "warning.main"}
          fontWeight={500}
        >
          {service.visibility === "public" ? "Public" : "Private"}
        </Typography>
      </Box>

      {service.createdBy && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {service.isOwner ? "You" : service.createdBy.username}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

// Actions Component
interface ServiceCardActionsProps {
  service: PM2Service;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onReload: () => void;
  onDelete: () => void;
  isStarting: boolean;
  isStopping: boolean;
  isRestarting: boolean;
  isReloading: boolean;
  isDisabled: boolean;
  theme: any;
}

function ServiceCardActions({
  service,
  onStart,
  onStop,
  onRestart,
  onReload,
  onDelete,
  isStarting,
  isStopping,
  isRestarting,
  isReloading,
  isDisabled,
  theme,
}: ServiceCardActionsProps) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Tooltip title="Start Service">
        <span>
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={
              isStarting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <StartIcon />
              )
            }
            onClick={onStart}
            disabled={
              service.status === ServiceStatus.ONLINE ||
              service.status === ServiceStatus.BUILDING ||
              isDisabled
            }
            sx={{ flexGrow: 1, minWidth: 80 }}
          >
            {isStarting ? "Starting..." : "Start"}
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="Stop Service">
        <span>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={
              isStopping ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <StopIcon />
              )
            }
            onClick={onStop}
            disabled={
              service.status === ServiceStatus.STOPPED ||
              service.status === ServiceStatus.BUILDING ||
              isDisabled
            }
            sx={{ flexGrow: 1, minWidth: 80 }}
          >
            {isStopping ? "Stopping..." : "Stop"}
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="Restart Service">
        <span>
          <IconButton
            size="small"
            onClick={onRestart}
            disabled={
              service.status === ServiceStatus.STOPPED ||
              service.status === ServiceStatus.BUILDING ||
              isDisabled
            }
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
              borderRadius: 1,
              position: "relative",
            }}
          >
            {isRestarting ? (
              <CircularProgress size={16} />
            ) : (
              <RestartIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Reload Service">
        <span>
          <IconButton
            size="small"
            onClick={onReload}
            disabled={
              service.status === ServiceStatus.STOPPED ||
              service.status === ServiceStatus.BUILDING ||
              isDisabled
            }
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
              borderRadius: 1,
              position: "relative",
            }}
          >
            {isReloading ? (
              <CircularProgress size={16} />
            ) : (
              <ReloadIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Delete Service">
        <IconButton
          size="small"
          onClick={onDelete}
          disabled={isDisabled}
          sx={{
            border: `1px solid ${alpha(theme.palette.error.main, 0.5)}`,
            color: "error.main",
            borderRadius: 1,
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
