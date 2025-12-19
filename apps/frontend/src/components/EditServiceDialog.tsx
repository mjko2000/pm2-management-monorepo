import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent,
} from "@mui/material";
import { PM2Service, Repository, ServiceVisibility } from "@pm2-dashboard/shared";
import { useQuery } from "react-query";
import { getRepositories, getBranches } from "../api/github";
import { getNodeVersions } from "../api/services";

interface EditServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PM2Service>) => Promise<void>;
  service: PM2Service;
}

export default function EditServiceDialog({
  open,
  onClose,
  onSubmit,
  service,
}: EditServiceDialogProps) {
  const [formData, setFormData] = useState<Partial<PM2Service>>({
    name: "",
    repositoryUrl: "",
    branch: "",
    sourceDirectory: "",
    script: "",
    args: "",
    useNpm: false,
    npmScript: "",
    npmArgs: "",
    nodeVersion: "",
    cluster: null,
    autostart: false,
    visibility: "private" as ServiceVisibility,
  });

  const [useCluster, setUseCluster] = useState(false);
  const [clusterInstances, setClusterInstances] = useState(1);

  // Fetch repositories
  const { data: repositories, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["repositories"],
    queryFn: getRepositories,
  });

  // Fetch branches for selected repository
  const { data: branches, isLoading: isLoadingBranches } = useQuery({
    queryKey: ["branches", formData.repositoryUrl],
    queryFn: () => getBranches(formData.repositoryUrl!),
    enabled: !!formData.repositoryUrl,
  });

  // Fetch Node.js versions
  const { data: nodeVersions, isLoading: isLoadingNodeVersions } = useQuery({
    queryKey: ["nodeVersions"],
    queryFn: getNodeVersions,
  });

  useEffect(() => {
    if (service) {
      const hasCluster = Boolean(service.cluster && service.cluster > 0);
      setFormData({
        name: service.name,
        repositoryUrl: service.repositoryUrl,
        branch: service.branch,
        sourceDirectory: service.sourceDirectory || "",
        script: service.script,
        args: service.args || "",
        useNpm: service.useNpm || false,
        npmScript: service.npmScript || "",
        npmArgs: service.npmArgs || "",
        nodeVersion: service.nodeVersion || "",
        cluster: service.cluster || null,
        autostart: service.autostart || false,
        visibility: service.visibility || "private",
      });
      setUseCluster(hasCluster);
      setClusterInstances(hasCluster ? service.cluster! : 1);
    }
  }, [service]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "useNpm" || name === "autostart" ? checked : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRepositoryChange = (e: SelectChangeEvent) => {
    const repoUrl = e.target.value;
    setFormData((prev) => ({
      ...prev,
      repositoryUrl: repoUrl,
      branch: "", // Reset branch when repository changes
    }));
  };

  const handleBranchChange = (e: SelectChangeEvent) => {
    const branch = e.target.value;
    setFormData((prev) => ({
      ...prev,
      branch,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              name="name"
              label="Service Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Repository</InputLabel>
              <Select
                value={formData.repositoryUrl}
                label="Repository"
                onChange={handleRepositoryChange}
                endAdornment={
                  isLoadingRepos ? <CircularProgress size={20} /> : null
                }
                disabled
              >
                {repositories?.map((repo: Repository) => (
                  <MenuItem key={repo.id} value={repo.url}>
                    {repo.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={formData.branch}
                label="Branch"
                onChange={handleBranchChange}
                disabled={!formData.repositoryUrl}
                endAdornment={
                  isLoadingBranches ? <CircularProgress size={20} /> : null
                }
              >
                {branches?.map((branch: string) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="sourceDirectory"
              label="Source Directory (optional)"
              value={formData.sourceDirectory}
              onChange={handleInputChange}
              fullWidth
              helperText="Leave empty if the service is in the root directory"
            />
            <FormControl fullWidth>
              <InputLabel>Node.js Version</InputLabel>
              <Select
                name="nodeVersion"
                value={formData.nodeVersion || ""}
                label="Node.js Version"
                onChange={handleSelectChange}
                endAdornment={
                  isLoadingNodeVersions ? <CircularProgress size={20} /> : null
                }
              >
                {nodeVersions?.map((version: string) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={useCluster}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseCluster(checked);
                    setFormData((prev) => ({
                      ...prev,
                      cluster: checked ? clusterInstances : null,
                    }));
                  }}
                />
              }
              label="Use cluster mode"
            />
            {useCluster && (
              <TextField
                label="Number of Cluster Instances"
                value={clusterInstances}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  const instances = isNaN(value)
                    ? 1
                    : Math.max(1, Math.min(16, value));
                  setClusterInstances(instances);
                  setFormData((prev) => ({
                    ...prev,
                    cluster: instances,
                  }));
                }}
                type="number"
                inputProps={{ min: 1, max: 16 }}
                fullWidth
                helperText="Number of cluster instances to run"
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  name="autostart"
                  checked={formData.autostart || false}
                  onChange={handleInputChange}
                />
              }
              label="Enable autostart on backend startup"
            />
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                name="visibility"
                value={formData.visibility || "private"}
                label="Visibility"
                onChange={handleSelectChange}
              >
                <MenuItem value="private">
                  Private - Only you can access this service
                </MenuItem>
                <MenuItem value="public">
                  Public - All users can access and manage this service
                </MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  name="useNpm"
                  checked={formData.useNpm}
                  onChange={handleInputChange}
                />
              }
              label="Use NPM"
            />
            {formData.useNpm && (
              <>
                <TextField
                  name="npmScript"
                  label="NPM Script"
                  value={formData.npmScript}
                  onChange={handleInputChange}
                  fullWidth
                />
                <TextField
                  name="npmArgs"
                  label="NPM Arguments"
                  value={formData.npmArgs}
                  onChange={handleInputChange}
                  fullWidth
                />
              </>
            )}
            <TextField
              name="script"
              label="Script"
              value={formData.script}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="args"
              label="Arguments"
              value={formData.args}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
