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
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  Shield,
  ArrowBack,
} from "@mui/icons-material";
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

type LoginStep =
  | "credentials"
  | "method-select"
  | "email-otp"
  | "totp";

export default function Login() {
  const navigate = useNavigate();
  const { login, sendOtp, verifyTwoFactor, cancelChallenge, twoFactorChallenge } =
    useAuth();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: i,
        sx: generateParticleStyle(),
      })),
    []
  );

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(usernameOrEmail, password);

      if (result.stage === "FIRST_LOGIN_REQUIRED") {
        navigate("/profile?firstLogin=1");
        return;
      }

      if (result.stage === "TWO_FACTOR_REQUIRED") {
        // Use data from return value directly — context state may not have updated yet
        if (result.methods.length === 1) {
          if (result.methods[0] === "emailOtp") {
            await handleSendEmailOtp(result.challengeId);
            setStep("email-otp");
          } else {
            setStep("totp");
          }
        } else {
          setStep("method-select");
        }
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOtp = async (challengeId: string) => {
    try {
      await sendOtp(challengeId);
      setInfo("A 6-digit code was sent to your email address.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  const handleSelectMethod = async (method: "emailOtp" | "totp") => {
    setError("");
    if (method === "emailOtp") {
      setIsLoading(true);
      try {
        await handleSendEmailOtp(twoFactorChallenge!.challengeId);
        setStep("email-otp");
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep("totp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await verifyTwoFactor(
        twoFactorChallenge!.challengeId,
        step === "email-otp" ? "emailOtp" : "totp",
        otpCode
      );
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      await handleSendEmailOtp(twoFactorChallenge!.challengeId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    cancelChallenge();
    setStep("credentials");
    setOtpCode("");
    setError("");
    setInfo("");
  };

  return (
    <Box
      sx={{ ...pageContainerSx, ...centeredContainerSx, ...pulseBackgroundSx }}
    >
      <Box sx={particlesContainerSx}>
        {particles.map((particle) => (
          <Box key={particle.key} sx={particle.sx} />
        ))}
      </Box>

      <Card sx={{ ...glassCardSx, maxWidth: 420, width: "90%", zIndex: 1 }}>
        <CardContent sx={{ p: 5 }}>
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

          {/* ── Step: credentials ── */}
          {step === "credentials" && (
            <>
              <Typography
                sx={{ color: colors.text.muted, textAlign: "center", mb: 4, fontSize: "0.95rem" }}
              >
                Sign in to continue
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleCredentialsSubmit}>
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

              <Box sx={{ ...infoBoxSx, mt: 4 }}>
                <Typography sx={{ color: colors.text.muted, fontSize: "0.8rem", textAlign: "center" }}>
                  Default admin:{" "}
                  <strong style={{ color: "#a5b4fc" }}>admin</strong> /{" "}
                  <strong style={{ color: "#a5b4fc" }}>admin</strong>
                </Typography>
              </Box>

              <Typography sx={{ mt: 3, color: colors.text.disabled, fontSize: "0.75rem", textAlign: "center" }}>
                Contact your administrator to get an account
              </Typography>
            </>
          )}

          {/* ── Step: method-select ── */}
          {step === "method-select" && (
            <>
              <Typography sx={{ color: colors.text.muted, textAlign: "center", mb: 4, fontSize: "0.95rem" }}>
                Choose verification method
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Email />}
                onClick={() => handleSelectMethod("emailOtp")}
                disabled={isLoading}
                sx={{ mb: 2, py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={20} /> : "Send code to my email"}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Shield />}
                onClick={() => handleSelectMethod("totp")}
                disabled={isLoading}
                sx={{ mb: 3, py: 1.5 }}
              >
                Use authenticator app
              </Button>

              <Divider sx={{ mb: 2 }} />

              <Button
                fullWidth
                variant="text"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ color: colors.text.muted }}
              >
                Back to login
              </Button>
            </>
          )}

          {/* ── Step: email-otp ── */}
          {step === "email-otp" && (
            <>
              <Typography sx={{ color: colors.text.muted, textAlign: "center", mb: 1, fontSize: "0.95rem" }}>
                Email verification
              </Typography>

              {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <form onSubmit={handleVerifyOtp}>
                <TextField
                  fullWidth
                  label="6-digit code"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  inputProps={{ maxLength: 6, inputMode: "numeric" }}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: colors.text.disabled }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading || otpCode.length !== 6}
                  sx={{ py: 1.5, fontSize: "1rem", mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Verify Code"}
                </Button>
              </form>

              <Button
                fullWidth
                variant="text"
                onClick={handleResendOtp}
                disabled={isLoading}
                sx={{ color: colors.text.muted, mb: 1 }}
              >
                Resend code
              </Button>

              <Divider sx={{ mb: 1 }} />

              <Button
                fullWidth
                variant="text"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ color: colors.text.muted }}
              >
                Back to login
              </Button>
            </>
          )}

          {/* ── Step: totp ── */}
          {step === "totp" && (
            <>
              <Typography sx={{ color: colors.text.muted, textAlign: "center", mb: 1, fontSize: "0.95rem" }}>
                Authenticator app
              </Typography>
              <Typography sx={{ color: colors.text.disabled, textAlign: "center", mb: 3, fontSize: "0.85rem" }}>
                Enter the 6-digit code from your authenticator app.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <form onSubmit={handleVerifyOtp}>
                <TextField
                  fullWidth
                  label="6-digit code"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  inputProps={{ maxLength: 6, inputMode: "numeric" }}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Shield sx={{ color: colors.text.disabled }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading || otpCode.length !== 6}
                  sx={{ py: 1.5, fontSize: "1rem", mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Verify Code"}
                </Button>
              </form>

              <Divider sx={{ mb: 1 }} />

              <Button
                fullWidth
                variant="text"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ color: colors.text.muted }}
              >
                Back to login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
