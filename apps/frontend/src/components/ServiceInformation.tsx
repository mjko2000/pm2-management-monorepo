import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import { PM2Service } from "@pm2-dashboard/shared";

interface ServiceInformationProps {
  service: PM2Service;
}

export default function ServiceInformation({
  service,
}: ServiceInformationProps) {
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
  );
}
