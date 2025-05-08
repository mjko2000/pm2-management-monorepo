import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Paper,
  Box,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { PM2Service, Environment } from "@pm2-dashboard/shared";

interface ServiceEnvironmentsProps {
  service: PM2Service;
  onAddEnvironment: () => void;
  onEditEnvironment: (env: Environment) => void;
  onDeleteEnvironment: (envName: string) => void;
  onSetActiveEnvironment: (envName: string) => void;
}

export default function ServiceEnvironments({
  service,
  onAddEnvironment,
  onEditEnvironment,
  onDeleteEnvironment,
  onSetActiveEnvironment,
}: ServiceEnvironmentsProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Environments"
        action={
          <Button startIcon={<AddIcon />} onClick={onAddEnvironment}>
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
                      onClick={() => onSetActiveEnvironment(env.name)}
                      sx={{ mr: 1 }}
                    >
                      Set Active
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => onEditEnvironment(env)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteEnvironment(env.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              {env.description && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
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
  );
}
