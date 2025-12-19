import { useState } from "react";
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

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1117 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 50%)",
          animation: "pulse 15s ease-in-out infinite",
        },
        "@keyframes pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
      }}
    >
      {/* Floating particles effect */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          "& > div": {
            position: "absolute",
            width: "4px",
            height: "4px",
            background: "rgba(99, 102, 241, 0.6)",
            borderRadius: "50%",
            animation: "float 20s ease-in-out infinite",
          },
          "@keyframes float": {
            "0%, 100%": {
              transform: "translateY(100vh) rotate(0deg)",
              opacity: 0,
            },
            "10%": { opacity: 1 },
            "90%": { opacity: 1 },
            "100%": {
              transform: "translateY(-100vh) rotate(720deg)",
              opacity: 0,
            },
          },
        }}
      >
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            sx={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </Box>

      <Card
        sx={{
          maxWidth: 420,
          width: "90%",
          background: "rgba(17, 17, 27, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: 4,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          position: "relative",
          zIndex: 1,
          overflow: "visible",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-2px",
            left: "-2px",
            right: "-2px",
            bottom: "-2px",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.1))",
            borderRadius: "18px",
            zIndex: -1,
            filter: "blur(1px)",
          },
        }}
      >
        <CardContent sx={{ p: 5 }}>
          {/* Logo/Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "20px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 40px rgba(99, 102, 241, 0.4)",
                fontSize: "2rem",
              }}
            >
              ⚡
            </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Space Grotesk', 'SF Mono', monospace",
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              mb: 1,
              letterSpacing: "-0.02em",
            }}
          >
            PM2 Dashboard
          </Typography>

          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.5)",
              textAlign: "center",
              mb: 4,
              fontSize: "0.95rem",
            }}
          >
            Sign in to continue
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                "& .MuiAlert-icon": {
                  color: "#ef4444",
                },
              }}
            >
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
              sx={{
                mb: 2.5,
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(99, 102, 241, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.5)",
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "rgba(255, 255, 255, 0.4)" }} />
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
              sx={{
                mb: 4,
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(99, 102, 241, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.5)",
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "rgba(255, 255, 255, 0.4)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "rgba(255, 255, 255, 0.4)" }}
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
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 15px 40px rgba(99, 102, 241, 0.4)",
                },
                "&:disabled": {
                  background: "rgba(99, 102, 241, 0.5)",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Default credentials hint */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              background: "rgba(99, 102, 241, 0.1)",
              borderRadius: 2,
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "0.8rem",
                textAlign: "center",
              }}
            >
              Default admin:{" "}
              <strong style={{ color: "#a5b4fc" }}>admin</strong> /{" "}
              <strong style={{ color: "#a5b4fc" }}>admin</strong>
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 3,
              color: "rgba(255, 255, 255, 0.4)",
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
