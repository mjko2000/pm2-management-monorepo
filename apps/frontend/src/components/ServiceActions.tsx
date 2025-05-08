import { Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

interface ServiceActionsProps {
  status: string;
  processing: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ServiceActions({
  status,
  processing,
  onStart,
  onStop,
  onRestart,
  onEdit,
  onDelete,
}: ServiceActionsProps) {
  return (
    <div>
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={onEdit}
        disabled={processing}
        sx={{ mr: 1 }}
      >
        Edit
      </Button>
      {status !== "online" && (
        <Button
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon />}
          onClick={onStart}
          disabled={processing}
          sx={{ mr: 1 }}
        >
          Start
        </Button>
      )}

      {status === "online" && (
        <>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRestart}
            disabled={processing}
            sx={{ mr: 1 }}
          >
            Restart
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={onStop}
            disabled={processing}
            sx={{ mr: 1 }}
          >
            Stop
          </Button>
        </>
      )}

      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={onDelete}
        disabled={processing}
      >
        Delete
      </Button>
    </div>
  );
}
