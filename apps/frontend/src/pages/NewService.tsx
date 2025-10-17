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
import { Repository, PM2Service, ServiceStatus } from "@pm2-dashboard/shared";

interface NewServiceForm {
  name: string;
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
}

export default function NewService() {
  const navigate = useNavigate();
  const { control, handleSubmit, watch, setValue } = useForm<NewServiceForm>({
    defaultValues: {
      name: "",
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
    },
  });

  const selectedRepo = watch("repositoryUrl");
  const useNpm = watch("useNpm");
  const useCluster = watch("useCluster");

  // Fetch repositories
  const { data: repositories, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["repositories"],
    queryFn: getRepositories,
  });

  // Fetch branches for selected repository
  const { data: branches, isLoading: isLoadingBranches } = useQuery({
    queryKey: ["branches", selectedRepo],
    queryFn: () => getBranches(selectedRepo),
    enabled: !!selectedRepo,
  });

  // Fetch Node.js versions
  const { data: nodeVersions, isLoading: isLoadingNodeVersions } = useQuery({
    queryKey: ["nodeVersions"],
    queryFn: getNodeVersions,
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: NewServiceForm) => {
      const serviceData: Omit<PM2Service, "_id"> = {
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New Service
      </Typography>

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
                  name="repositoryUrl"
                  control={control}
                  rules={{ required: "Repository is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Repository</InputLabel>
                      <Select
                        {...field}
                        label="Repository"
                        endAdornment={
                          isLoadingRepos ? <CircularProgress size={20} /> : null
                        }
                      >
                        {repositories?.map((repo: Repository) => (
                          <MenuItem key={repo.id} value={repo.url}>
                            {repo.fullName}
                          </MenuItem>
                        ))}
                      </Select>
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
                        label="Branch"
                        disabled={!selectedRepo}
                        endAdornment={
                          isLoadingBranches ? (
                            <CircularProgress size={20} />
                          ) : null
                        }
                      >
                        {branches?.map((branch: string) => (
                          <MenuItem key={branch} value={branch}>
                            {branch}
                          </MenuItem>
                        ))}
                      </Select>
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
                            <CircularProgress size={20} />
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
                    disabled={createServiceMutation.isPending}
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
