import { createTheme, alpha } from "@mui/material/styles";
import { SystemStyleObject, Theme } from "@mui/system";

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const colors = {
  // Primary colors
  primary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  // Background colors
  background: {
    default: "#0f0f23",
    paper: "rgba(17, 17, 27, 0.85)",
    subtle: "rgba(255, 255, 255, 0.03)",
    gradient: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1117 100%)",
  },
  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    muted: "rgba(255, 255, 255, 0.5)",
    disabled: "rgba(255, 255, 255, 0.3)",
  },
  // Border colors
  border: {
    default: "rgba(255, 255, 255, 0.1)",
    hover: "rgba(99, 102, 241, 0.5)",
    focus: "#6366f1",
  },
  // Status colors
  success: {
    main: "#10b981",
    light: "#34d399",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  error: {
    main: "#ef4444",
    light: "#fca5a5",
    bg: "rgba(239, 68, 68, 0.1)",
  },
  warning: {
    main: "#f59e0b",
    light: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  info: {
    main: "#3b82f6",
    light: "#60a5fa",
    bg: "rgba(59, 130, 246, 0.1)",
  },
} as const;

// ============================================================================
// THEME CONFIGURATION
// ============================================================================
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
    },
    secondary: {
      main: "#a855f7",
      light: "#c084fc",
      dark: "#7c3aed",
    },
    background: {
      default: colors.background.default,
      paper: "#11111b",
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
    },
    divider: colors.border.default,
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
    h1: {
      fontFamily: "'Space Grotesk', 'SF Mono', monospace",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: "'Space Grotesk', 'SF Mono', monospace",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: "'Space Grotesk', 'SF Mono', monospace",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontFamily: "'Space Grotesk', 'SF Mono', monospace",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: colors.background.gradient,
          minHeight: "100vh",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: colors.background.paper,
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.border.default}`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          background: colors.background.paper,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 20px",
          transition: "all 0.3s ease",
        },
        contained: {
          background: colors.primary.gradient,
          boxShadow: `0 10px 30px ${alpha(colors.primary.main, 0.3)}`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 15px 40px ${alpha(colors.primary.main, 0.4)}`,
          },
        },
        outlined: {
          borderColor: colors.border.hover,
          "&:hover": {
            borderColor: colors.primary.main,
            background: alpha(colors.primary.main, 0.1),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: colors.background.subtle,
            borderRadius: 8,
            "& fieldset": {
              borderColor: colors.border.default,
            },
            "&:hover fieldset": {
              borderColor: colors.border.hover,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.border.focus,
            },
          },
          "& .MuiInputLabel-root": {
            color: colors.text.muted,
          },
          "& .MuiInputBase-input": {
            color: colors.text.primary,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.border.default,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.border.hover,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.border.focus,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardError: {
          background: colors.error.bg,
          border: `1px solid ${alpha(colors.error.main, 0.3)}`,
          color: colors.error.light,
          "& .MuiAlert-icon": {
            color: colors.error.main,
          },
        },
        standardSuccess: {
          background: colors.success.bg,
          border: `1px solid ${alpha(colors.success.main, 0.3)}`,
          color: colors.success.light,
          "& .MuiAlert-icon": {
            color: colors.success.main,
          },
        },
        standardWarning: {
          background: colors.warning.bg,
          border: `1px solid ${alpha(colors.warning.main, 0.3)}`,
          color: colors.warning.light,
          "& .MuiAlert-icon": {
            color: colors.warning.main,
          },
        },
        standardInfo: {
          background: colors.info.bg,
          border: `1px solid ${alpha(colors.info.main, 0.3)}`,
          color: colors.info.light,
          "& .MuiAlert-icon": {
            color: colors.info.main,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: "transparent",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          background: "transparent",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: `${alpha(colors.primary.main, 0.15)} !important`,
          "& .MuiTableCell-root": {
            backgroundColor: "transparent !important",
            color: `${colors.text.secondary} !important`,
            fontWeight: 600,
            borderBottom: `1px solid ${colors.border.default}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          background: "transparent",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          background: "transparent",
          "&:hover": {
            background: `${alpha(colors.primary.main, 0.08)} !important`,
          },
          "&.Mui-selected": {
            background: `${alpha(colors.primary.main, 0.15)} !important`,
            "&:hover": {
              background: `${alpha(colors.primary.main, 0.2)} !important`,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.border.default,
          color: colors.text.primary,
          backgroundColor: "transparent",
        },
        head: {
          fontWeight: 600,
          color: `${colors.text.secondary} !important`,
          backgroundColor: `${alpha(colors.primary.main, 0.15)} !important`,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: colors.text.primary,
          backgroundColor: "transparent",
        },
        selectIcon: {
          color: colors.text.secondary,
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: alpha(colors.primary.main, 0.1),
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: alpha(colors.primary.main, 0.1),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(colors.primary.main, 0.15),
            "&:hover": {
              backgroundColor: alpha(colors.primary.main, 0.2),
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border.default,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: colors.background.paper,
          borderRight: `1px solid ${colors.border.default}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: colors.background.paper,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border.default}`,
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: colors.background.paper,
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.border.default}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: colors.background.paper,
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.border.default}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: "rgba(0, 0, 0, 0.9)",
          backdropFilter: "blur(10px)",
        },
      },
    },
  },
});

// ============================================================================
// REUSABLE STYLE UTILITIES
// ============================================================================

type SxObject = SystemStyleObject<Theme>;

/** Full-page background with gradient and animation */
export const pageContainerSx: SxObject = {
  minHeight: "100vh",
  background: colors.background.gradient,
  position: "relative",
  overflow: "hidden",
};

/** Centered content container */
export const centeredContainerSx: SxObject = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
};

/** Glass card effect with glow border */
export const glassCardSx: SxObject = {
  background: colors.background.paper,
  backdropFilter: "blur(20px)",
  border: `1px solid ${colors.border.default}`,
  borderRadius: 4,
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
  position: "relative",
  overflow: "visible",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-2px",
    left: "-2px",
    right: "-2px",
    bottom: "-2px",
    background: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.4)}, ${alpha("#a855f7", 0.2)}, ${alpha(colors.primary.main, 0.1)})`,
    borderRadius: "18px",
    zIndex: -1,
    filter: "blur(1px)",
  },
};

/** Subtle info box */
export const infoBoxSx: SxObject = {
  p: 2,
  background: alpha(colors.primary.main, 0.1),
  borderRadius: 2,
  border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
};

/** Gradient text effect */
export const gradientTextSx: SxObject = {
  background: colors.primary.gradient,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

/** Icon box with gradient background */
export const iconBoxSx: SxObject = {
  width: 72,
  height: 72,
  borderRadius: "20px",
  background: colors.primary.gradient,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `0 10px 40px ${alpha(colors.primary.main, 0.4)}`,
  fontSize: "2rem",
};

/** Animated background pulse */
export const pulseBackgroundSx: SxObject = {
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: `radial-gradient(circle, ${alpha(colors.primary.main, 0.1)} 0%, transparent 50%)`,
    animation: "pulse 15s ease-in-out infinite",
  },
  "@keyframes pulse": {
    "0%, 100%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.1)" },
  },
};

/** Floating particles animation container */
export const particlesContainerSx: SxObject = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  "& > div": {
    position: "absolute",
    width: "4px",
    height: "4px",
    background: alpha(colors.primary.main, 0.6),
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
};

/** Card hover effect */
export const hoverCardSx: SxObject = {
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
};

/** Generate particle style for floating animation */
export const generateParticleStyle = () => ({
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 20}s`,
  animationDuration: `${15 + Math.random() * 10}s`,
});

export default theme;
