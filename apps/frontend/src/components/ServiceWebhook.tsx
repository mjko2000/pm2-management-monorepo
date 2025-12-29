import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Collapse,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Webhook as WebhookIcon,
  CloudSync as CloudSyncIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  getWebhookStatus,
  enableWebhook,
  disableWebhook,
} from "../api/services";
import { colors, infoBoxSx } from "../theme";
import { alpha } from "@mui/material/styles";

interface ServiceWebhookProps {
  serviceId: string;
}

export default function ServiceWebhook({ serviceId }: ServiceWebhookProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: webhookStatus, isLoading } = useQuery(
    ["webhookStatus", serviceId],
    () => getWebhookStatus(serviceId),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const enableMutation = useMutation(() => enableWebhook(serviceId), {
    onSuccess: () => {
      queryClient.invalidateQueries(["webhookStatus", serviceId]);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to enable webhook");
    },
  });

  const disableMutation = useMutation(() => disableWebhook(serviceId), {
    onSuccess: () => {
      queryClient.invalidateQueries(["webhookStatus", serviceId]);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to disable webhook");
    },
  });

  const handleToggle = async () => {
    if (webhookStatus?.enabled) {
      await disableMutation.mutateAsync();
    } else {
      await enableMutation.mutateAsync();
    }
  };

  const handleCopyUrl = async () => {
    if (webhookStatus?.webhookUrl) {
      await navigator.clipboard.writeText(webhookStatus.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isProcessing = enableMutation.isLoading || disableMutation.isLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            <Typography>Loading webhook status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WebhookIcon sx={{ color: colors.primary.main }} />
            <Typography variant="h6">CI/CD Webhook</Typography>
            {webhookStatus?.enabled && (
              <Chip
                label="Active"
                size="small"
                color="success"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={webhookStatus?.enabled || false}
                onChange={handleToggle}
                disabled={isProcessing}
                color="primary"
              />
            }
            label={isProcessing ? <CircularProgress size={16} /> : ""}
            labelPlacement="start"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Collapse in={webhookStatus?.enabled}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Webhook URL
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={webhookStatus?.webhookUrl || ""}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? "Copied!" : "Copy URL"}>
                      <IconButton onClick={handleCopyUrl} size="small">
                        {copied ? (
                          <CheckIcon sx={{ color: colors.success.main }} />
                        ) : (
                          <CopyIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiInputBase-input": {
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                },
              }}
            />

            <Box sx={infoBoxSx}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <CloudSyncIcon sx={{ color: colors.primary.main, mt: 0.5 }} />
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Auto-Deploy Enabled
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Push to the configured branch will automatically trigger a
                    deployment. The service will pull the latest code, install
                    dependencies, build, and reload.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>

        <Collapse in={!webhookStatus?.enabled}>
          <Box
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 2,
              background: alpha(colors.primary.main, 0.05),
              border: `1px dashed ${colors.border.default}`,
              textAlign: "center",
            }}
          >
            <WebhookIcon
              sx={{ fontSize: 40, color: colors.text.muted, mb: 1 }}
            />
            <Typography variant="body1" gutterBottom>
              Enable CI/CD to automatically deploy on push
            </Typography>
            <Typography variant="body2" color="text.secondary">
              When enabled, a webhook will be created on your GitHub repository.
              <br />
              Pushing to the configured branch will trigger an automatic deployment.
            </Typography>
          </Box>
        </Collapse>

        <Box sx={{ mt: 2, display: "flex", alignItems: "flex-start", gap: 1 }}>
          <InfoIcon sx={{ fontSize: 16, color: colors.text.muted, mt: 0.3 }} />
          <Typography variant="caption" color="text.secondary">
            Your GitHub token must have webhook permissions to enable this feature.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

