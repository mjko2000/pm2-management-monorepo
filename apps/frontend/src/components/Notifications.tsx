import { Snackbar, Alert } from "@mui/material";

interface NotificationsProps {
  success: string | null;
  error: string | null;
  onCloseSuccess: () => void;
  onCloseError: () => void;
}

export default function Notifications({
  success,
  error,
  onCloseSuccess,
  onCloseError,
}: NotificationsProps) {
  return (
    <>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={onCloseSuccess}
      >
        <Alert severity="success" onClose={onCloseSuccess}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={onCloseError}>
        <Alert severity="error" onClose={onCloseError}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
