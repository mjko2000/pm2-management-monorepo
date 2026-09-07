import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import {
  MCP_PERMISSION_GROUPS,
  MCP_PERMISSION_LABELS,
  MCP_PERMISSIONS,
  McpPermission,
  McpToken,
  McpTokenCreated,
  createMcpToken,
  deleteMcpToken,
  getMcpTokens,
  regenerateMcpToken,
  updateMcpToken,
} from "../api/mcpTokens";

interface TokenFormData {
  name: string;
  permissions: McpPermission[];
  isActive: boolean;
}

function mcpEndpoint(): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${apiUrl.replace(/\/$/, "")}/mcp`;
}

function cursorSnippet(token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        "pm2-dashboard": {
          url: mcpEndpoint(),
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );
}

export default function McpTokens() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<McpToken | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<McpToken | null>(null);
  const [revealed, setRevealed] = useState<McpTokenCreated | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"token" | "snippet" | "">("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TokenFormData>({
    defaultValues: {
      name: "",
      permissions: [...MCP_PERMISSIONS],
      isActive: true,
    },
  });

  const selectedPermissions = watch("permissions");
  const allSelected = selectedPermissions.length === MCP_PERMISSIONS.length;

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["mcp-tokens"],
    queryFn: getMcpTokens,
    enabled: currentUser?.role === "admin",
  });

  const createMutation = useMutation({
    mutationFn: createMcpToken,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] });
      handleCloseDialog();
      setRevealed(created);
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TokenFormData }) =>
      updateMcpToken(id, {
        name: data.name,
        permissions: data.permissions,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] });
      handleCloseDialog();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMcpToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] });
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setDeleteDialogOpen(false);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateMcpToken,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] });
      setRevealed(created);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleOpenDialog = (token?: McpToken) => {
    setError("");
    if (token) {
      setEditingToken(token);
      reset({
        name: token.name,
        permissions: token.permissions,
        isActive: token.isActive,
      });
    } else {
      setEditingToken(null);
      reset({
        name: "",
        permissions: [...MCP_PERMISSIONS],
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingToken(null);
    setError("");
    reset();
  };

  const onSubmit = (data: TokenFormData) => {
    setError("");
    if (data.permissions.length === 0) {
      setError("Select at least one permission");
      return;
    }
    if (editingToken) {
      updateMutation.mutate({ id: editingToken._id, data });
    } else {
      createMutation.mutate({
        name: data.name,
        permissions: data.permissions,
      });
    }
  };

  const toggleAll = (checked: boolean) => {
    setValue("permissions", checked ? [...MCP_PERMISSIONS] : [], {
      shouldDirty: true,
    });
  };

  const togglePermission = (
    current: McpPermission[],
    permission: McpPermission,
    checked: boolean,
  ) => {
    if (checked) {
      return current.includes(permission)
        ? current
        : [...current, permission];
    }
    return current.filter((item) => item !== permission);
  };

  const copy = async (value: string, kind: "token" | "snippet") => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(""), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const revealedSnippet = useMemo(
    () => (revealed ? cursorSnippet(revealed.token) : ""),
    [revealed],
  );

  if (currentUser?.role !== "admin") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don&apos;t have permission to access this page. Admin access
          required.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            MCP Tokens
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Create bot tokens for AI clients. Permissions apply to all services.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            },
          }}
        >
          Create Token
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Prefix</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : tokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <KeyIcon
                          sx={{ fontSize: 48, color: "grey.400", mb: 1 }}
                        />
                        <Typography color="text.secondary">
                          No MCP tokens yet. Create one for Cursor or Claude.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((token) => (
                    <TableRow key={token._id}>
                      <TableCell>
                        <Typography fontWeight={500}>{token.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {token.tokenPrefix}…
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {token.permissions.map((permission) => (
                            <Chip
                              key={permission}
                              label={MCP_PERMISSION_LABELS[permission]}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={token.isActive ? "Active" : "Disabled"}
                          size="small"
                          color={token.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>{formatDate(token.lastUsedAt)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(token)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Regenerate">
                          <IconButton
                            onClick={() => regenerateMutation.mutate(token._id)}
                            disabled={regenerateMutation.isPending}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setTokenToDelete(token);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingToken ? "Edit MCP Token" : "Create MCP Token"}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  placeholder="e.g., Cursor production"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={
                    selectedPermissions.length > 0 && !allSelected
                  }
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              }
              label="Select all actions"
              sx={{ mt: 1 }}
            />

            <Controller
              name="permissions"
              control={control}
              render={({ field }) => (
                <Box>
                  {MCP_PERMISSION_GROUPS.map((group) => (
                    <Box key={group.label} sx={{ mt: 1.5 }}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {group.label}
                      </Typography>
                      {group.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission}
                          sx={{ display: "block" }}
                          control={
                            <Checkbox
                              checked={field.value.includes(permission)}
                              onChange={(event) =>
                                field.onChange(
                                  togglePermission(
                                    field.value,
                                    permission,
                                    event.target.checked,
                                  ),
                                )
                              }
                            />
                          }
                          label={MCP_PERMISSION_LABELS[permission]}
                        />
                      ))}
                    </Box>
                  ))}
                </Box>
              )}
            />

            {editingToken && (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ mt: 2 }}
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Active"
                  />
                )}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingToken ? "Save Changes" : "Create Token"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(revealed)}
        onClose={() => setRevealed(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Copy this token now</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This value is shown once. Store it in Cursor — you cannot view it
            again.
          </Alert>
          <TextField
            label="Token"
            value={revealed?.token ?? ""}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace", fontSize: 13 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => revealed && copy(revealed.token, "token")}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {copied === "token" && (
            <Typography variant="caption" color="success.main">
              Token copied
            </Typography>
          )}
          <TextField
            label="Cursor mcp.json"
            value={revealedSnippet}
            fullWidth
            margin="normal"
            multiline
            minRows={8}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace", fontSize: 12 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => copy(revealedSnippet, "snippet")}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {copied === "snippet" && (
            <Typography variant="caption" color="success.main">
              Snippet copied
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevealed(null)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Revoke Token</DialogTitle>
        <DialogContent>
          <Typography>
            Revoke <strong>{tokenToDelete?.name}</strong>? Bots using this token
            will lose access immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => tokenToDelete && deleteMutation.mutate(tokenToDelete._id)}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
