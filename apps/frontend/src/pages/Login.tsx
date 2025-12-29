import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import {
  colors,
  pageContainerSx,
  centeredContainerSx,
  glassCardSx,
  pulseBackgroundSx,
  particlesContainerSx,
  iconBoxSx,
  infoBoxSx,
  generateParticleStyle,
} from "../theme";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Memoize particle positions
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: i,
        sx: generateParticleStyle(),
      })),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{ ...pageContainerSx, ...centeredContainerSx, ...pulseBackgroundSx }}
    >
      {/* Floating particles */}
      <Box sx={particlesContainerSx}>
        {particles.map((particle) => (
          <Box key={particle.key} sx={particle.sx} />
        ))}
      </Box>

      <Card sx={{ ...glassCardSx, maxWidth: 420, width: "90%", zIndex: 1 }}>
        <CardContent sx={{ p: 5 }}>
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Box sx={iconBoxSx}>⚡</Box>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Space Grotesk', 'SF Mono', monospace",
              fontWeight: 700,
              color: colors.text.primary,
              textAlign: "center",
              mb: 1,
              letterSpacing: "-0.02em",
            }}
          >
            PM2 Dashboard
          </Typography>

          <Typography
            sx={{
              color: colors.text.muted,
              textAlign: "center",
              mb: 4,
              fontSize: "0.95rem",
            }}
          >
            Sign in to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username or Email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: colors.text.disabled }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: colors.text.disabled }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: colors.text.disabled }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ py: 1.5, fontSize: "1rem" }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Default credentials hint */}
          <Box sx={{ ...infoBoxSx, mt: 4 }}>
            <Typography
              sx={{
                color: colors.text.muted,
                fontSize: "0.8rem",
                textAlign: "center",
              }}
            >
              Default admin: <strong style={{ color: "#a5b4fc" }}>admin</strong>{" "}
              / <strong style={{ color: "#a5b4fc" }}>admin</strong>
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 3,
              color: colors.text.disabled,
              fontSize: "0.75rem",
              textAlign: "center",
            }}
          >
            Contact your administrator to get an account
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
