import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createService } from "../api/services";
import { getRepositories, getBranches } from "../api/github";
import { getNodeVersions } from "../api/services";
import { getGithubTokens, GithubToken } from "../api/githubTokens";
import {
  Repository,
  PM2Service,
  ServiceStatus,
  ServiceVisibility,
  PackageManager,
} from "@pm2-dashboard/shared";

interface NewServiceForm {
  name: string;
  githubTokenId: string;
  repositoryUrl: string;
  branch: string;
  sourceDirectory?: string;
  useNpm: boolean;
  npmScript?: string;
  npmArgs?: string;
  script: string;
  args?: string;
  nodeVersion: string;
  cluster?: number | null;
  useCluster: boolean;
  clusterInstances: number;
  autostart: boolean;
  visibility: ServiceVisibility;
  packageManager: PackageManager;
}

export default function NewService() {
  const navigate = useNavigate();
  const { control, handleSubmit, watch, setValue } = useForm<NewServiceForm>({
    defaultValues: {
      name: "",
      githubTokenId: "",
      repositoryUrl: "",
      branch: "",
      sourceDirectory: "",
      useNpm: false,
      npmScript: "",
      npmArgs: "",
      script: "",
      args: "",
      nodeVersion: "",
      cluster: null,
      useCluster: false,
      clusterInstances: 1,
      autostart: false,
      visibility: "private",
      packageManager: "yarn",
    },
  });

  const selectedTokenId = watch("githubTokenId");
  const selectedRepo = watch("repositoryUrl");
  const useNpm = watch("useNpm");
  const useCluster = watch("useCluster");

  // Fetch GitHub tokens
  const { data: tokens, isLoading: isLoadingTokens } = useQuery({
    queryKey: ["github-tokens"],
    queryFn: getGithubTokens,
  });

  // Fetch repositories for selected token
  const { data: repositories, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["repositories", selectedTokenId],
    queryFn: () => getRepositories(selectedTokenId),
    enabled: !!selectedTokenId,
  });

  // Fetch branches for selected repository
  const { data: branches, isLoading: isLoadingBranches } = useQuery({
    queryKey: ["branches", selectedRepo, selectedTokenId],
    queryFn: () => getBranches(selectedRepo, selectedTokenId),
    enabled: !!selectedRepo && !!selectedTokenId,
  });

  // Fetch Node.js versions
  const { data: nodeVersions, isLoading: isLoadingNodeVersions } = useQuery({
    queryKey: ["nodeVersions"],
    queryFn: getNodeVersions,
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: NewServiceForm) => {
      const serviceData: Omit<PM2Service, "_id"> & { githubTokenId: string } = {
        name: data.name,
        repositoryUrl: data.repositoryUrl,
        branch: data.branch,
        sourceDirectory: data.sourceDirectory,
        useNpm: data.useNpm,
        npmScript: data.npmScript,
        npmArgs: data.npmArgs,
        script: data.script,
        args: data.args,
        nodeVersion: data.nodeVersion,
        cluster: data.useCluster ? data.clusterInstances : null,
        environments: [],
        status: ServiceStatus.STOPPED,
        autostart: data.autostart,
        githubTokenId: data.githubTokenId,
        visibility: data.visibility,
        packageManager: data.packageManager,
      };
      return createService(serviceData);
    },
    onSuccess: () => {
      navigate("/services");
    },
  });

  const onSubmit = (data: NewServiceForm) => {
    createServiceMutation.mutate(data);
  };

  // Reset repository and branch when token changes
  const handleTokenChange = (tokenId: string) => {
    setValue("githubTokenId", tokenId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("repositoryUrl", "");
    setValue("branch", "");
  };

  // Reset branch when repository changes
  const handleRepoChange = (repoUrl: string) => {
    setValue("repositoryUrl", repoUrl, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("branch", "");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New Service
      </Typography>

      {(!tokens || tokens.length === 0) && !isLoadingTokens && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need to add a GitHub token before creating a service.{" "}
          <Button
            size="small"
            onClick={() => navigate("/github-tokens")}
            sx={{ ml: 1 }}
          >
            Add Token
          </Button>
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Service name is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Service Name"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="githubTokenId"
                  control={control}
                  rules={{ required: "GitHub token is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>GitHub Token</InputLabel>
                      <Select
                        {...field}
                        label="GitHub Token"
                        onChange={(e) => handleTokenChange(e.target.value)}
                        endAdornment={
                          isLoadingTokens ? (
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                          ) : null
                        }
                      >
                        {tokens?.map((token: GithubToken) => (
                          <MenuItem key={token._id} value={token._id}>
                            {token.name}{" "}
                            {token.visibility === "public"
                              ? "(Public)"
                              : "(Private)"}
                            {!token.isOwner &&
                              ` - by ${token.createdBy.username}`}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="repositoryUrl"
                  control={control}
                  rules={{ required: "Repository is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Repository</InputLabel>
                      <Select
                        {...field}
                        onChange={(e) =>
                          handleRepoChange(e.target.value as string)
                        }
                        label="Repository"
                        disabled={!selectedTokenId}
                        endAdornment={
                          isLoadingRepos ? (
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                          ) : null
                        }
                      >
                        {repositories?.map((repo: Repository) => (
                          <MenuItem key={repo.id} value={repo.url}>
                            {repo.fullName}
                          </MenuItem>
                        ))}
                      </Select>
                      {!selectedTokenId && (
                        <Typography variant="caption" color="text.secondary">
                          Select a GitHub token first
                        </Typography>
                      )}
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="branch"
                  control={control}
                  rules={{ required: "Branch is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Branch</InputLabel>
                      <Select
                        {...field}
                        onChange={(e) =>
                          setValue("branch", e.target.value as string, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        label="Branch"
                        disabled={!selectedRepo}
                        endAdornment={
                          isLoadingBranches ? (
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                          ) : null
                        }
                      >
                        {branches?.map((branch: string) => (
                          <MenuItem key={branch} value={branch}>
                            {branch}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="sourceDirectory"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Source Directory (optional)"
                      fullWidth
                      helperText="Relative path to the source directory within the repository"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="nodeVersion"
                  control={control}
                  rules={{ required: "Node.js version is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Node.js Version</InputLabel>
                      <Select
                        {...field}
                        label="Node.js Version"
                        endAdornment={
                          isLoadingNodeVersions ? (
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                          ) : null
                        }
                      >
                        {nodeVersions?.map((version: string) => (
                          <MenuItem key={version} value={version}>
                            {version}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="packageManager"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Package Manager</InputLabel>
                      <Select {...field} label="Package Manager">
                        <MenuItem value="yarn">Yarn</MenuItem>
                        <MenuItem value="npm">npm</MenuItem>
                        <MenuItem value="pnpm">pnpm</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="useCluster"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Use cluster mode"
                    />
                  )}
                />
              </Grid>

              {useCluster && (
                <Grid item xs={12}>
                  <Controller
                    name="clusterInstances"
                    control={control}
                    rules={{
                      required:
                        "Number of instances is required when using cluster mode",
                      min: {
                        value: 1,
                        message: "Must have at least 1 instance",
                      },
                      max: { value: 16, message: "Cannot exceed 16 instances" },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Number of Cluster Instances"
                        fullWidth
                        type="number"
                        inputProps={{ min: 1, max: 16 }}
                        error={!!error}
                        helperText={
                          error?.message || "Number of cluster instances to run"
                        }
                        value={field.value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          field.onChange(isNaN(value) ? 1 : value);
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Controller
                  name="autostart"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Enable autostart on backend startup"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Visibility</InputLabel>
                      <Select {...field} label="Visibility">
                        <MenuItem value="private">
                          Private - Only you can access this service
                        </MenuItem>
                        <MenuItem value="public">
                          Public - All users can access and manage this service
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="useNpm"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Use npm to start the service"
                    />
                  )}
                />
              </Grid>

              {useNpm ? (
                <>
                  <Grid item xs={12}>
                    <Controller
                      name="npmScript"
                      control={control}
                      rules={{
                        required: "npm script is required when using npm",
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          label="npm Script"
                          fullWidth
                          error={!!error}
                          helperText={
                            error?.message ||
                            "The npm script to run (e.g., 'start', 'dev')"
                          }
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="npmArgs"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="npm Arguments (optional)"
                          fullWidth
                          helperText="Space-separated arguments to pass to npm (e.g., '-- --port 3000')"
                          onChange={(e) => {
                            const args = e.target.value;
                            setValue("npmArgs", args);
                          }}
                        />
                      )}
                    />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12}>
                    <Controller
                      name="script"
                      control={control}
                      rules={{ required: "Script path is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          label="Script Path"
                          fullWidth
                          error={!!error}
                          helperText={
                            error?.message ||
                            "Path to the script file relative to the source directory"
                          }
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="args"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Arguments (optional)"
                          fullWidth
                          helperText="Space-separated arguments to pass to the script"
                          onChange={(e) => {
                            const args = e.target.value;
                            setValue("args", args);
                          }}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {createServiceMutation.isError && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    Failed to create service. Please try again.
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/services")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      createServiceMutation.isPending ||
                      !tokens ||
                      tokens.length === 0
                    }
                  >
                    Create Service
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
