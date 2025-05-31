import { Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ServiceStatus } from "@pm2-dashboard/shared";

interface ServiceActionsProps {
  status: string;
  processing: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onReload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ServiceActions({
  status,
  processing,
  onStart,
  onStop,
  onRestart,
  onReload,
  onEdit,
  onDelete,
}: ServiceActionsProps) {
  const isBuilding = status === ServiceStatus.BUILDING;
  const isOnline = status === ServiceStatus.ONLINE;

  return (
    <div>
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={onEdit}
        disabled={processing || isBuilding}
        sx={{ mr: 1 }}
      >
        Edit
      </Button>
      {!isOnline && (
        <Button
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon />}
          onClick={onStart}
          disabled={processing || isBuilding}
          sx={{ mr: 1 }}
        >
          Start
        </Button>
      )}

      {isOnline && (
        <>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRestart}
            disabled={processing || isBuilding}
            sx={{ mr: 1 }}
          >
            Restart
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SystemUpdateAltIcon />}
            onClick={onReload}
            disabled={processing || isBuilding}
            sx={{ mr: 1 }}
          >
            Reload
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={onStop}
            disabled={processing || isBuilding}
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
        disabled={processing || isBuilding}
      >
        Delete
      </Button>
    </div>
  );
}
