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
import { PM2Service, Repository } from "@pm2-dashboard/shared";
import { useQuery } from "react-query";
import { getRepositories, getBranches } from "../api/github";

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
  });

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

  useEffect(() => {
    if (service) {
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
      });
    }
  }, [service]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "useNpm" ? checked : value,
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
              onChange={handleChange}
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
              onChange={handleChange}
              fullWidth
              helperText="Leave empty if the service is in the root directory"
            />
            <FormControlLabel
              control={
                <Switch
                  name="useNpm"
                  checked={formData.useNpm}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  name="npmArgs"
                  label="NPM Arguments"
                  value={formData.npmArgs}
                  onChange={handleChange}
                  fullWidth
                />
              </>
            )}
            <TextField
              name="script"
              label="Script"
              value={formData.script}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="args"
              label="Arguments"
              value={formData.args}
              onChange={handleChange}
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
