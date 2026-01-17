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
  Box,
  ToggleButton,
  ToggleButtonGroup,
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
  const [inputFormat, setInputFormat] = useState<"json" | "env">("json");

  // Parse .env format to object
  const parseEnvFormat = (envString: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = envString.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }
      // Find the first = sign
      const equalIndex = trimmedLine.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        // Remove surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        result[key] = value;
      }
    }
    return result;
  };

  // Convert object to .env format
  const toEnvFormat = (obj: Record<string, string>): string => {
    return Object.entries(obj)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
  };

  useEffect(() => {
    if (editingEnv?.variables) {
      try {
        if (inputFormat === "json") {
          setEnvVarsJson(JSON.stringify(editingEnv.variables, null, 2));
        } else {
          setEnvVarsJson(toEnvFormat(editingEnv.variables));
        }
      } catch (error) {
        setEnvVarsJson(inputFormat === "json" ? "{}" : "");
      }
    } else {
      setEnvVarsJson(inputFormat === "json" ? "{}" : "");
    }
  }, [editingEnv, inputFormat]);

  const handleFormatChange = (
    _: React.MouseEvent<HTMLElement>,
    newFormat: "json" | "env" | null
  ) => {
    if (!newFormat) return;

    try {
      if (newFormat === "env" && inputFormat === "json") {
        // Convert JSON to env format
        const parsed = JSON.parse(envVarsJson);
        setEnvVarsJson(toEnvFormat(parsed));
      } else if (newFormat === "json" && inputFormat === "env") {
        // Convert env to JSON format
        const parsed = parseEnvFormat(envVarsJson);
        setEnvVarsJson(JSON.stringify(parsed, null, 2));
      }
      setJsonError(null);
    } catch (error) {
      // Keep current content if conversion fails
    }
    setInputFormat(newFormat);
  };

  const { control, handleSubmit } = useForm<Environment>({
    defaultValues: editingEnv
      ? {
          name: editingEnv?.name || "",
          description: editingEnv?.description || "",
          variables: editingEnv?.variables || {},
        }
      : undefined,
  });

  const validateInput = (input: string): boolean => {
    try {
      if (inputFormat === "json") {
        JSON.parse(input);
      } else {
        // Basic validation for env format - just check it's not completely broken
        parseEnvFormat(input);
      }
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError(
        inputFormat === "json" ? "Invalid JSON format" : "Invalid .env format"
      );
      return false;
    }
  };

  const onSubmitForm = (data: Environment) => {
    if (!validateInput(envVarsJson)) {
      return;
    }

    try {
      const variables =
        inputFormat === "json"
          ? JSON.parse(envVarsJson)
          : parseEnvFormat(envVarsJson);
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
          <Box
            sx={{
              mt: 2,
              mb: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2">Environment Variables</Typography>
            <ToggleButtonGroup
              value={inputFormat}
              exclusive
              onChange={handleFormatChange}
              size="small"
            >
              <ToggleButton value="json">JSON</ToggleButton>
              <ToggleButton value="env">.env</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TextField
            label={
              inputFormat === "json"
                ? "Environment Variables (JSON)"
                : "Environment Variables (.env format)"
            }
            value={envVarsJson}
            onChange={(e) => {
              setEnvVarsJson(e.target.value);
              validateInput(e.target.value);
            }}
            multiline
            rows={8}
            fullWidth
            error={!!jsonError}
            helperText={
              jsonError ||
              (inputFormat === "json"
                ? 'Enter as JSON: { "KEY": "value" }'
                : "Enter as .env: KEY=value (one per line, # for comments)")
            }
            placeholder={
              inputFormat === "json"
                ? '{\n  "KEY": "value"\n}'
                : "KEY=value\nANOTHER_KEY=another_value\n# This is a comment"
            }
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
