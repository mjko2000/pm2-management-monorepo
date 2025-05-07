import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { Environment } from "@pm2-dashboard/shared";

interface EnvironmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Environment) => void;
  editingEnv: Environment | null;
}

export default function EnvironmentDialog({
  open,
  onClose,
  onSubmit,
  editingEnv,
}: EnvironmentDialogProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [envVarsJson, setEnvVarsJson] = useState<string>("");
  useEffect(() => {
    if (editingEnv?.variables) {
      try {
        setEnvVarsJson(JSON.stringify(editingEnv.variables, null, 2));
      } catch (error) {
        setEnvVarsJson("{}");
      }
    } else {
      setEnvVarsJson("{}");
    }
  }, [editingEnv]);

  const { control, handleSubmit } = useForm<Environment>({
    defaultValues: editingEnv
      ? {
          name: editingEnv?.name || "",
          description: editingEnv?.description || "",
          variables: editingEnv?.variables || {},
        }
      : undefined,
  });

  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const onSubmitForm = (data: Environment) => {
    if (!validateJson(envVarsJson)) {
      return;
    }

    try {
      const variables = JSON.parse(envVarsJson);
      onSubmit({
        ...data,
        variables,
      });
    } catch (error) {
      setJsonError("Failed to parse environment variables");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingEnv ? "Edit Environment" : "Add Environment"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            defaultValue={editingEnv?.name || ""}
            rules={{ required: "Name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Environment Name"
                fullWidth
                margin="normal"
                required
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            defaultValue={editingEnv?.description || ""}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            )}
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Environment Variables (JSON)
          </Typography>
          <TextField
            label="Environment Variables"
            value={envVarsJson}
            onChange={(e) => {
              setEnvVarsJson(e.target.value);
              validateJson(e.target.value);
            }}
            multiline
            rows={8}
            fullWidth
            error={!!jsonError}
            helperText={jsonError || "Enter environment variables as JSON"}
            sx={{
              fontFamily: "monospace",
              "& .MuiInputBase-input": {
                fontFamily: "monospace",
              },
            }}
          />
          {jsonError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {jsonError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingEnv ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
