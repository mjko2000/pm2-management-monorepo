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
      </CardContent>
    </Card>
  );
}
