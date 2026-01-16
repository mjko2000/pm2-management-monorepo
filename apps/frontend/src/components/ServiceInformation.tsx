import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import { PM2Service, ServiceStatus } from "@pm2-dashboard/shared";

interface ServiceInformationProps {
  service: PM2Service;
}

export default function ServiceInformation({
  service,
}: ServiceInformationProps) {
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
    <Card sx={{ height: "100%" }}>
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
            label={service.status || ServiceStatus.UNKNOWN}
            color={getStatusColor(service.status)}
            size="small"
          />
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Autostart:</strong>{" "}
          <Chip
            label={service.autostart ? "Enabled" : "Disabled"}
            color={service.autostart ? "success" : "default"}
            size="small"
          />
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Visibility:</strong>{" "}
          <Chip
            label={service.visibility === "public" ? "Public" : "Private"}
            color={service.visibility === "public" ? "info" : "warning"}
            size="small"
          />
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Package Manager:</strong>{" "}
          <Chip
            label={service.packageManager === "npm" ? "npm" : "Yarn"}
            color="default"
            size="small"
          />
        </Typography>
        {service.createdBy && (
          <Typography variant="body1" gutterBottom>
            <strong>Owner:</strong>{" "}
            {service.isOwner ? "You" : service.createdBy.username}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
