import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  Key as KeyIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import {
  getGithubTokens,
  createGithubToken,
  updateGithubToken,
  deleteGithubToken,
  validateGithubToken,
  GithubToken,
  CreateGithubTokenDto,
  UpdateGithubTokenDto,
} from "../api/githubTokens";

interface TokenFormData {
  name: string;
  token: string;
  visibility: "private" | "public";
}

export default function GithubTokens() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<GithubToken | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<GithubToken | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState("");
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TokenFormData>({
    defaultValues: {
      name: "",
      token: "",
      visibility: "private",
    },
  });

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["github-tokens"],
    queryFn: getGithubTokens,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateGithubTokenDto) => createGithubToken(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-tokens"] });
      handleCloseDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGithubTokenDto }) =>
      updateGithubToken(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-tokens"] });
      handleCloseDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGithubToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-tokens"] });
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setDeleteDialogOpen(false);
    },
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => validateGithubToken(id),
    onSuccess: (data) => {
      if (data.valid) {
        setError("");
      } else {
        setError(
          "Token validation failed. The token may be invalid or expired."
        );
      }
      setValidatingId(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setValidatingId(null);
    },
  });

  const handleOpenDialog = (token?: GithubToken) => {
    setError("");
    if (token) {
      setEditingToken(token);
      reset({
        name: token.name,
        token: "",
        visibility: token.visibility,
      });
    } else {
      setEditingToken(null);
      reset({
        name: "",
        token: "",
        visibility: "private",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingToken(null);
    setError("");
    setShowToken(false);
    reset();
  };

  const onSubmit = (data: TokenFormData) => {
    setError("");
    if (editingToken) {
      const updateData: UpdateGithubTokenDto = {
        name: data.name,
        visibility: data.visibility,
      };
      if (data.token) {
        updateData.token = data.token;
      }
      updateMutation.mutate({ id: editingToken._id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClick = (token: GithubToken) => {
    setTokenToDelete(token);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tokenToDelete) {
      deleteMutation.mutate(tokenToDelete._id);
    }
  };

  const handleValidate = (id: string) => {
    setValidatingId(id);
    validateMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
            GitHub Tokens
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage GitHub access tokens for repository operations
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
          Add Token
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
                  <TableCell>Visibility</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Created</TableCell>
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
                          No GitHub tokens yet. Add one to get started.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((token) => (
                    <TableRow
                      key={token._id}
                      sx={{
                        "&:hover": { bgcolor: "grey.50" },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <KeyIcon color="action" fontSize="small" />
                          <Typography fontWeight={500}>{token.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            token.visibility === "public" ? (
                              <PublicIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <LockIcon sx={{ fontSize: 16 }} />
                            )
                          }
                          label={
                            token.visibility.charAt(0).toUpperCase() +
                            token.visibility.slice(1)
                          }
                          size="small"
                          color={
                            token.visibility === "public" ? "info" : "default"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {token.createdBy.username}
                          {token.isOwner && (
                            <Chip
                              label="You"
                              size="small"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(token.createdAt)}</TableCell>
                      <TableCell>
                        {token.lastUsedAt
                          ? formatDate(token.lastUsedAt)
                          : "Never"}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Validate Token">
                          <IconButton
                            size="small"
                            onClick={() => handleValidate(token._id)}
                            disabled={validatingId === token._id}
                          >
                            <CheckIcon
                              fontSize="small"
                              color={
                                validatingId === token._id
                                  ? "disabled"
                                  : "success"
                              }
                            />
                          </IconButton>
                        </Tooltip>
                        {token.isOwner && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(token)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(token)}
                                sx={{
                                  "&:hover": { color: "error.main" },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Token Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingToken ? "Edit Token" : "Add New GitHub Token"}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Alert severity="info" sx={{ mb: 2 }}>
              Create a GitHub Personal Access Token at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/settings/tokens
              </a>
              . Required scopes: <strong>repo</strong> (for private repos) or{" "}
              <strong>public_repo</strong> (for public repos only).
            </Alert>

            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Token Name"
                  placeholder="e.g., My Personal Token"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="token"
              control={control}
              rules={{
                required: editingToken ? false : "Token is required",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={
                    editingToken
                      ? "New Token (leave empty to keep)"
                      : "GitHub Token"
                  }
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  type={showToken ? "text" : "password"}
                  fullWidth
                  margin="normal"
                  error={!!errors.token}
                  helperText={errors.token?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowToken(!showToken)}
                          edge="end"
                        >
                          {showToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Visibility</InputLabel>
                  <Select {...field} label="Visibility">
                    <MenuItem value="private">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LockIcon fontSize="small" />
                        Private - Only you can use this token
                      </Box>
                    </MenuItem>
                    <MenuItem value="public">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PublicIcon fontSize="small" />
                        Public - All users can use this token
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingToken ? "Save Changes" : "Add Token"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Token</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete token{" "}
            <strong>{tokenToDelete?.name}</strong>? Services using this token
            will no longer be able to access GitHub repositories.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
