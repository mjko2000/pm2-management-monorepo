import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Language as LanguageIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  getDomainsForService,
  getServerIp,
  createDomain,
  verifyDomain,
  activateDomain,
  deleteDomain,
  Domain,
  CreateDomainDto,
  VerifyDomainResponse,
} from "../api/domains";

interface ServiceDomainsProps {
  serviceId: string;
}

const statusConfig: Record<
  string,
  { color: "default" | "warning" | "success" | "error"; icon: JSX.Element }
> = {
  pending: { color: "warning", icon: <PendingIcon fontSize="small" /> },
  verified: { color: "success", icon: <CheckCircleIcon fontSize="small" /> },
  active: { color: "success", icon: <CheckCircleIcon fontSize="small" /> },
  error: { color: "error", icon: <ErrorIcon fontSize="small" /> },
};

export default function ServiceDomains({ serviceId }: ServiceDomainsProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newPort, setNewPort] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyDomainResponse | null>(
    null
  );
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [processingDomainId, setProcessingDomainId] = useState<string | null>(
    null
  );

  // Fetch domains for this service
  const { data: domains, isLoading } = useQuery(
    ["domains", serviceId],
    () => getDomainsForService(serviceId),
    { enabled: !!serviceId }
  );

  // Fetch server IP
  const { data: serverIpData } = useQuery(["server-ip"], getServerIp);

  // Create domain mutation
  const createMutation = useMutation(
    (data: CreateDomainDto) => createDomain(data),
    {
      onSuccess: (domain) => {
        queryClient.invalidateQueries(["domains", serviceId]);
        setDialogOpen(false);
        setNewDomain("");
        setNewPort("");
        // Show guide dialog for the new domain
        setSelectedDomain(domain);
        setGuideDialogOpen(true);
      },
    }
  );

  // Verify domain mutation
  const verifyMutation = useMutation(
    ({ id, skip }: { id: string; skip: boolean }) => verifyDomain(id, skip),
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries(["domains", serviceId]);
        setVerifyResult(result);
      },
      onSettled: () => {
        setProcessingDomainId(null);
      },
    }
  );

  // Activate domain mutation
  const activateMutation = useMutation((id: string) => activateDomain(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(["domains", serviceId]);
      setGuideDialogOpen(false);
      setVerifyResult(null);
    },
    onSettled: () => {
      setProcessingDomainId(null);
    },
  });

  // Delete domain mutation
  const deleteMutation = useMutation((id: string) => deleteDomain(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(["domains", serviceId]);
    },
  });

  const handleCreateDomain = () => {
    if (!newDomain || !newPort) return;

    createMutation.mutate({
      domain: newDomain.toLowerCase().trim(),
      port: parseInt(newPort, 10),
      serviceId,
    });
  };

  const handleVerifyDomain = (domain: Domain, skip: boolean = false) => {
    setSelectedDomain(domain);
    setProcessingDomainId(domain._id);
    setVerifyResult(null);
    verifyMutation.mutate({ id: domain._id, skip });
  };

  const handleActivateDomain = (domain: Domain) => {
    setProcessingDomainId(domain._id);
    activateMutation.mutate(domain._id);
  };

  const handleDeleteDomain = (domain: Domain) => {
    if (
      window.confirm(`Are you sure you want to delete domain ${domain.domain}?`)
    ) {
      deleteMutation.mutate(domain._id);
    }
  };

  const handleShowGuide = (domain: Domain) => {
    setSelectedDomain(domain);
    setGuideDialogOpen(true);
    setVerifyResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const serverIp = serverIpData?.serverIp || "YOUR_SERVER_IP";

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            <LanguageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Domains
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Domain
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : domains && domains.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {domains.map((domain) => (
              <Box
                key={domain._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {domain.domain}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    :{domain.port}
                  </Typography>
                  <Chip
                    size="small"
                    label={domain.status}
                    color={statusConfig[domain.status]?.color || "default"}
                    icon={statusConfig[domain.status]?.icon}
                  />
                  {domain.sslEnabled && (
                    <Chip size="small" label="SSL" color="info" />
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {domain.status === "pending" && (
                    <Tooltip title="Configure DNS">
                      <IconButton
                        size="small"
                        onClick={() => handleShowGuide(domain)}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {domain.status === "verified" && (
                    <Tooltip title="Activate (Create Nginx + SSL)">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleActivateDomain(domain)}
                        disabled={processingDomainId === domain._id}
                      >
                        {processingDomainId === domain._id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <CheckCircleIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteDomain(domain)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            No domains configured. Add a domain to expose this service.
          </Typography>
        )}
      </CardContent>

      {/* Add Domain Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Domain</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Domain"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com or subdomain.example.com"
              fullWidth
              helperText="Enter the domain without http:// or https://"
            />
            <TextField
              label="Port"
              type="number"
              value={newPort}
              onChange={(e) => setNewPort(e.target.value)}
              placeholder="3000"
              fullWidth
              helperText="The port your service is running on"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDomain}
            disabled={!newDomain || !newPort || createMutation.isLoading}
          >
            {createMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              "Add Domain"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DNS Configuration Guide Dialog */}
      <Dialog
        open={guideDialogOpen}
        onClose={() => {
          setGuideDialogOpen(false);
          setVerifyResult(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure DNS for {selectedDomain?.domain}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Alert severity="info">
              To connect your domain, you need to configure a DNS A record
              pointing to this server.
            </Alert>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Step 1: Add an A Record in your DNS provider
              </Typography>
              <Box
                sx={{
                  bgcolor: "action.hover",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    <strong>Type:</strong> A
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    <strong>Name:</strong>{" "}
                    {selectedDomain?.domain.split(".")[0] === "www"
                      ? "www"
                      : selectedDomain?.domain.includes(".")
                        ? selectedDomain.domain.split(".")[0]
                        : "@"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">
                    <strong>Value:</strong> {serverIp}
                  </Typography>
                  <Tooltip title="Copy IP">
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(serverIp)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Step 2: Wait for DNS propagation (usually 5-15 minutes)
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Step 3: Verify your DNS configuration
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    selectedDomain && handleVerifyDomain(selectedDomain, false)
                  }
                  disabled={verifyMutation.isLoading}
                  startIcon={
                    verifyMutation.isLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                >
                  Verify DNS
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() =>
                    selectedDomain && handleVerifyDomain(selectedDomain, true)
                  }
                  disabled={verifyMutation.isLoading}
                >
                  Skip Verification (Cloudflare/Proxy)
                </Button>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Using Cloudflare or another proxy? Click &quot;Skip
                Verification&quot; to proceed without DNS check.
              </Typography>

              {verifyResult && (
                <Alert
                  severity={verifyResult.verified ? "success" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {verifyResult.message}
                  {verifyResult.resolvedIps && (
                    <Typography variant="body2">
                      Resolved IPs: {verifyResult.resolvedIps.join(", ")}
                    </Typography>
                  )}
                  {verifyResult.isCloudflare && !verifyResult.verified && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      sx={{ mt: 1 }}
                      onClick={() =>
                        selectedDomain &&
                        handleVerifyDomain(selectedDomain, true)
                      }
                    >
                      Skip & Verify Anyway
                    </Button>
                  )}
                </Alert>
              )}
            </Box>

            {(selectedDomain?.status === "verified" ||
              verifyResult?.verified) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Step 4: Activate domain (Create Nginx config + SSL)
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() =>
                      selectedDomain && handleActivateDomain(selectedDomain)
                    }
                    disabled={activateMutation.isLoading}
                    startIcon={
                      activateMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CheckCircleIcon />
                      )
                    }
                  >
                    Activate Domain with SSL
                  </Button>
                </Box>
              </>
            )}

            {activateMutation.isError && (
              <Alert severity="error">
                Failed to activate domain. Please check the server logs.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setGuideDialogOpen(false);
              setVerifyResult(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
