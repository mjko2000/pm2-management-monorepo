import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  Grid,
  InputAdornment,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Check as CheckIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import {
  updateProfile,
  changePassword,
  UpdateProfileDto,
  ChangePasswordDto,
} from "../api/users";

interface ProfileFormData {
  username: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => updateProfile(data),
    onSuccess: async (updatedUser) => {
      setProfileSuccess("Profile updated successfully");
      setProfileError("");
      // Refresh the auth context with new user data
      // For simplicity, we'll just show a success message
      // In production, you might want to update the context directly
    },
    onError: (err: Error) => {
      setProfileError(err.message);
      setProfileSuccess("");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => changePassword(data),
    onSuccess: () => {
      setPasswordSuccess("Password changed successfully");
      setPasswordError("");
      resetPassword();
    },
    onError: (err: Error) => {
      setPasswordError(err.message);
      setPasswordSuccess("");
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    setProfileSuccess("");
    setProfileError("");
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    setPasswordSuccess("");
    setPasswordError("");
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 4 }}>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: "2.5rem",
                  bgcolor: user?.role === "admin" ? "primary.main" : "grey.500",
                  mb: 2,
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" fontWeight={600}>
                {user?.username}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {user?.email}
              </Typography>
              <Chip
                icon={
                  user?.role === "admin" ? (
                    <AdminIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <PersonIcon sx={{ fontSize: 16 }} />
                  )
                }
                label={
                  user?.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "User"
                }
                color={user?.role === "admin" ? "primary" : "default"}
                variant={user?.role === "admin" ? "filled" : "outlined"}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Edit Profile"
              subheader="Update your account information"
            />
            <Divider />
            <CardContent>
              {profileSuccess && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  icon={<CheckIcon />}
                  onClose={() => setProfileSuccess("")}
                >
                  {profileSuccess}
                </Alert>
              )}
              {profileError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setProfileError("")}
                >
                  {profileError}
                </Alert>
              )}

              <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <Controller
                  name="username"
                  control={profileControl}
                  rules={{
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    maxLength: {
                      value: 20,
                      message: "Username must be at most 20 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message:
                        "Username can only contain letters, numbers, and underscores (no spaces)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Username"
                      fullWidth
                      margin="normal"
                      error={!!profileErrors.username}
                      helperText={profileErrors.username?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={profileControl}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      margin="normal"
                      error={!!profileErrors.email}
                      helperText={profileErrors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Box
                  sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!isProfileDirty || profileMutation.isPending}
                  >
                    {profileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card>
            <CardHeader
              title="Change Password"
              subheader="Update your password to keep your account secure"
            />
            <Divider />
            <CardContent>
              {passwordSuccess && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  icon={<CheckIcon />}
                  onClose={() => setPasswordSuccess("")}
                >
                  {passwordSuccess}
                </Alert>
              )}
              {passwordError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setPasswordError("")}
                >
                  {passwordError}
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <Controller
                  name="currentPassword"
                  control={passwordControl}
                  rules={{ required: "Current password is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Current Password"
                      type={showCurrentPassword ? "text" : "password"}
                      fullWidth
                      margin="normal"
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              edge="end"
                            >
                              {showCurrentPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Controller
                  name="newPassword"
                  control={passwordControl}
                  rules={{
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New Password"
                      type={showNewPassword ? "text" : "password"}
                      fullWidth
                      margin="normal"
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              edge="end"
                            >
                              {showNewPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={passwordControl}
                  rules={{
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === newPassword || "Passwords do not match",
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Confirm New Password"
                      type={showConfirmPassword ? "text" : "password"}
                      fullWidth
                      margin="normal"
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Box
                  sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={passwordMutation.isPending}
                  >
                    {passwordMutation.isPending
                      ? "Changing..."
                      : "Change Password"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
