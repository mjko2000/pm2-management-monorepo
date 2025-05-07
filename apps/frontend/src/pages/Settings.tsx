import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { setGitHubToken, validateGitHubToken } from "../api/github";

interface GitHubFormData {
  token: string;
  username?: string;
}

export default function Settings() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GitHubFormData>({
    defaultValues: {
      token: "",
      username: "",
    },
  });

  const onSubmit = async (data: GitHubFormData) => {
    try {
      await setGitHubToken(data.token, data.username);
      const isValid = await validateGitHubToken();

      setTokenValid(isValid);
      if (isValid) {
        setSuccess(true);
        setError(null);
      } else {
        setError("GitHub token validation failed. Please check your token.");
      }
    } catch (err) {
      setError("Failed to save GitHub token");
      setTokenValid(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardHeader title="GitHub Integration" />
        <Divider />
        <CardContent>
          <Typography variant="body1" paragraph>
            Configure your GitHub access token to enable repository access and
            management.
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 2 }}
          >
            <Controller
              name="token"
              control={control}
              rules={{ required: "GitHub token is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="GitHub Token"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.token}
                  helperText={
                    errors.token?.message ||
                    "Personal access token with repo scope"
                  }
                  type="password"
                />
              )}
            />

            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="GitHub Username (Optional)"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              )}
            />

            {tokenValid === true && (
              <Alert severity="success" sx={{ mt: 2 }}>
                GitHub token validated successfully!
              </Alert>
            )}

            {tokenValid === false && (
              <Alert severity="error" sx={{ mt: 2 }}>
                GitHub token validation failed. Please check your token.
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Save GitHub Token
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Settings saved successfully"
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
