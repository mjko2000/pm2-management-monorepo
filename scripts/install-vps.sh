#!/usr/bin/env bash
set -euo pipefail

# PM2 Dashboard — one-command VPS installer (Ubuntu/Debian)
# Usage: sudo bash scripts/install-vps.sh [--backend-port 3001] [--frontend-port 3000] [--server-ip 1.2.3.4] [--certbot-email admin@example.com]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[pm2-dashboard]${NC} $*"; }
warn() { echo -e "${YELLOW}[pm2-dashboard]${NC} $*"; }
err()  { echo -e "${RED}[pm2-dashboard]${NC} $*" >&2; }

have() { command -v "$1" >/dev/null 2>&1; }

die() {
  err "$*"
  exit 1
}

# ---------------------------------------------------------------------------
# Guard: must run as root (for apt/systemd/sudoers), but app runs as app user
# ---------------------------------------------------------------------------

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  die "Run as root: sudo bash scripts/install-vps.sh"
fi

if ! have apt-get; then
  die "This script supports Ubuntu/Debian only (apt-get required)."
fi

APP_USER="${SUDO_USER:-${USER:-root}}"
if [[ "$APP_USER" == "root" ]]; then
  die "Do not run directly as root. Use: sudo bash scripts/install-vps.sh"
fi

APP_HOME="$(getent passwd "$APP_USER" | cut -d: -f6)"
[[ -n "$APP_HOME" && -d "$APP_HOME" ]] || die "Could not resolve home directory for user: $APP_USER"

# Repo root = parent of scripts/
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

run_as_app_user() {
  sudo -u "$APP_USER" -H bash -lc "$*"
}

# ---------------------------------------------------------------------------
# Config (defaults + CLI args)
# ---------------------------------------------------------------------------

BACKEND_PORT="${BACKEND_PORT:-}"
FRONTEND_PORT="${FRONTEND_PORT:-}"
SERVER_IP="${SERVER_IP:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
WORKING_DIR="/opt/pm2-dashboard/repositories"
NON_INTERACTIVE=false

usage() {
  cat <<EOF
Usage: sudo bash scripts/install-vps.sh [OPTIONS]

Options:
  --backend-port PORT     Backend API port (default: 3001)
  --frontend-port PORT    Frontend UI port (default: 3000)
  --server-ip IP          Public server IP (auto-detected if omitted)
  --certbot-email EMAIL   Email for Let's Encrypt (optional)
  --non-interactive       Skip prompts; use defaults / provided flags
  -h, --help              Show this help

Environment variables (same names) are also accepted.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-port)   BACKEND_PORT="$2"; shift 2 ;;
    --frontend-port)  FRONTEND_PORT="$2"; shift 2 ;;
    --server-ip)      SERVER_IP="$2"; shift 2 ;;
    --certbot-email)  CERTBOT_EMAIL="$2"; shift 2 ;;
    --non-interactive) NON_INTERACTIVE=true; shift ;;
    -h|--help)        usage; exit 0 ;;
    *) die "Unknown option: $1 (use --help)" ;;
  esac
done

prompt_default() {
  local prompt="$1"
  local default="$2"
  local value

  if $NON_INTERACTIVE; then
    echo "$default"
    return
  fi

  read -r -p "$prompt [$default]: " value
  if [[ -z "$value" ]]; then
    echo "$default"
  else
    echo "$value"
  fi
}

detect_server_ip() {
  local ip=""
  if have curl; then
    ip="$(curl -fsSL --max-time 5 https://ifconfig.me 2>/dev/null || true)"
  fi
  if [[ -z "$ip" ]] && have curl; then
    ip="$(curl -fsSL --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  fi
  if [[ -z "$ip" ]]; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  echo "$ip"
}

[[ -z "$BACKEND_PORT" ]]  && BACKEND_PORT="$(prompt_default "Backend port" "3001")"
[[ -z "$FRONTEND_PORT" ]] && FRONTEND_PORT="$(prompt_default "Frontend port" "3000")"
[[ -z "$SERVER_IP" ]]     && SERVER_IP="$(prompt_default "Server IP" "$(detect_server_ip)")"
[[ -z "$CERTBOT_EMAIL" && ! $NON_INTERACTIVE ]] && CERTBOT_EMAIL="$(prompt_default "Certbot email (optional, press Enter to skip)" "")"

[[ "$BACKEND_PORT" =~ ^[0-9]+$ ]]  || die "Invalid backend port: $BACKEND_PORT"
[[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || die "Invalid frontend port: $FRONTEND_PORT"
[[ -n "$SERVER_IP" ]]              || die "Server IP is required"

log "Configuration:"
log "  App user:       $APP_USER"
log "  Repo root:      $REPO_ROOT"
log "  Backend port:   $BACKEND_PORT"
log "  Frontend port:  $FRONTEND_PORT"
log "  Server IP:      $SERVER_IP"
log "  Working dir:    $WORKING_DIR"

# ---------------------------------------------------------------------------
# Prerequisite checks + install
# ---------------------------------------------------------------------------

apt_update_once() {
  if [[ "${APT_UPDATED:-0}" -eq 0 ]]; then
    log "Updating apt package index..."
    apt-get update -qq
    APT_UPDATED=1
  fi
}

install_git() {
  if have git; then
    log "git already installed ($(git --version))"
    return
  fi
  apt_update_once
  log "Installing git..."
  apt-get install -y -qq git
}

node_major_version() {
  if ! have node; then
    echo 0
    return
  fi
  node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0
}

install_node() {
  local major
  major="$(node_major_version)"
  if have node && [[ "$major" -ge 18 ]]; then
    log "Node.js already installed ($(node --version))"
    return
  fi

  apt_update_once
  log "Installing Node.js 20 LTS..."
  apt-get install -y -qq ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  log "Node.js installed: $(node --version), npm $(npm --version)"
}

install_nvm_for_user() {
  local nvm_dir="$APP_HOME/.nvm"
  if [[ -s "$nvm_dir/nvm.sh" ]]; then
    log "nvm already installed for $APP_USER"
    return
  fi

  log "Installing nvm for $APP_USER..."
  run_as_app_user 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash'

  local profile="$APP_HOME/.bashrc"
  if [[ -f "$APP_HOME/.profile" ]]; then
    profile="$APP_HOME/.profile"
  fi

  if ! grep -q 'NVM_DIR' "$profile" 2>/dev/null; then
    cat >> "$profile" <<'NVMEOF'

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
NVMEOF
  fi

  log "nvm installed for $APP_USER"
}

install_npm_global() {
  local pkg="$1"
  if run_as_app_user "command -v $pkg >/dev/null 2>&1"; then
    log "$pkg already installed for $APP_USER"
    return
  fi
  log "Installing global npm package: $pkg..."
  run_as_app_user "npm install -g $pkg"
}

install_mongodb() {
  if have mongod; then
    log "MongoDB already installed ($(mongod --version | head -1))"
    if ! systemctl is-active --quiet mongod 2>/dev/null; then
      systemctl enable --now mongod
    fi
    return
  fi

  apt_update_once
  log "Installing MongoDB 7.0..."

  apt-get install -y -qq gnupg curl

  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
    | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

  local codename
  codename="$(. /etc/os-release && echo "${VERSION_CODENAME:-}")"
  if [[ -z "$codename" ]]; then
    die "Could not detect Ubuntu/Debian codename for MongoDB repo."
  fi

  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${codename}/mongodb-org/7.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-7.0.list

  apt-get update -qq
  apt-get install -y -qq mongodb-org
  systemctl enable --now mongod
  log "MongoDB installed and started"
}

install_nginx() {
  if have nginx; then
    log "nginx already installed ($(nginx -v 2>&1))"
  else
    apt_update_once
    log "Installing nginx..."
    apt-get install -y -qq nginx
  fi
  systemctl enable --now nginx
}

install_certbot() {
  if have certbot; then
    log "certbot already installed ($(certbot --version 2>&1 | head -1))"
    return
  fi
  apt_update_once
  log "Installing certbot..."
  apt-get install -y -qq certbot python3-certbot-nginx
}

log "=== Checking and installing prerequisites ==="
install_git
install_node
install_nvm_for_user
install_npm_global pm2
install_npm_global serve
install_mongodb
install_nginx
install_certbot

# ---------------------------------------------------------------------------
# Working directory
# ---------------------------------------------------------------------------

log "=== Setting up working directory ==="
mkdir -p "$WORKING_DIR"
chown -R "$APP_USER:$APP_USER" /opt/pm2-dashboard
chmod 755 /opt/pm2-dashboard "$WORKING_DIR"

# ---------------------------------------------------------------------------
# Environment files (before build — frontend bakes VITE_API_URL)
# ---------------------------------------------------------------------------

log "=== Writing environment files ==="

BACKEND_ENV="$REPO_ROOT/apps/backend/.env"
FRONTEND_ENV="$REPO_ROOT/apps/frontend/.env"
JWT_SECRET="$(openssl rand -hex 64)"
MCP_SECRET="$(openssl rand -hex 64)"
APP_URL="http://${SERVER_IP}:${FRONTEND_PORT}"
API_URL="http://${SERVER_IP}:${BACKEND_PORT}"

if [[ -f "$BACKEND_ENV" ]]; then
  cp "$BACKEND_ENV" "${BACKEND_ENV}.bak.$(date +%Y%m%d%H%M%S)"
  warn "Backed up existing backend .env"
fi

if [[ -f "$FRONTEND_ENV" ]]; then
  cp "$FRONTEND_ENV" "${FRONTEND_ENV}.bak.$(date +%Y%m%d%H%M%S)"
  warn "Backed up existing frontend .env"
fi

cat > "$BACKEND_ENV" <<EOF
PORT=${BACKEND_PORT}
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/pm2-dashboard
WORKING_DIR=${WORKING_DIR}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=12h
MCP_SECRET=${MCP_SECRET}

ALLOWED_ORIGINS=${APP_URL}
APP_NAME=PM2 Dashboard
APP_URL=${APP_URL}

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="PM2 Dashboard" <noreply@example.com>

SERVER_IP=${SERVER_IP}
CERTBOT_EMAIL=${CERTBOT_EMAIL}
BACKEND_URL=${API_URL}
EOF

cat > "$FRONTEND_ENV" <<EOF
VITE_API_URL=${API_URL}
EOF

chown "$APP_USER:$APP_USER" "$BACKEND_ENV" "$FRONTEND_ENV"
log "Wrote $BACKEND_ENV"
log "Wrote $FRONTEND_ENV"

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

log "=== Installing dependencies and building ==="
run_as_app_user "cd '$REPO_ROOT' && npm install"
run_as_app_user "cd '$REPO_ROOT' && npm run build"

# Best-effort DB init (SystemConfig)
if run_as_app_user "cd '$REPO_ROOT/apps/backend' && npm run init:db" 2>/dev/null; then
  log "Database initialization completed"
else
  warn "init:db skipped or failed (default admin is still created on backend startup)"
fi

# ---------------------------------------------------------------------------
# PM2 start
# ---------------------------------------------------------------------------

log "=== Starting application under PM2 ==="

export FRONTEND_PORT
run_as_app_user "cd '$REPO_ROOT' && pm2 delete pm2-dashboard-backend pm2-dashboard-frontend 2>/dev/null || true"
run_as_app_user "cd '$REPO_ROOT' && FRONTEND_PORT='$FRONTEND_PORT' pm2 start ecosystem.config.js"
run_as_app_user "pm2 save"

STARTUP_CMD="$(run_as_app_user "pm2 startup systemd -u '$APP_USER' --hp '$APP_HOME'" | grep -E '^sudo env' || true)"
if [[ -n "$STARTUP_CMD" ]]; then
  log "Configuring PM2 startup on boot..."
  eval "$STARTUP_CMD"
else
  warn "Could not configure PM2 startup automatically. Run: pm2 startup"
fi

# ---------------------------------------------------------------------------
# Sudoers for domain/SSL management
# ---------------------------------------------------------------------------

log "=== Configuring sudoers for nginx/certbot ==="

SUDOERS_FILE="/etc/sudoers.d/pm2-dashboard"
cat > "$SUDOERS_FILE" <<EOF
# PM2 Dashboard — allow $APP_USER to manage nginx and certbot
${APP_USER} ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/nginx/sites-available/*
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/ln -sf /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/rm /etc/nginx/sites-available/*
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/rm /etc/nginx/sites-enabled/*
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/certbot --nginx -d * --non-interactive --agree-tos -m *
${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/certbot delete --cert-name * --non-interactive
EOF

chmod 440 "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE" >/dev/null
log "Sudoers configured at $SUDOERS_FILE"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  PM2 Dashboard installed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Frontend:  ${APP_URL}"
echo "  Backend:   ${API_URL}"
echo "  MCP:       ${API_URL}/mcp"
echo ""
echo "  MCP secret is in apps/backend/.env as MCP_SECRET (do not commit it)."
echo "  Cursor / Claude mcp.json:"
echo "    {"
echo "      \"mcpServers\": {"
echo "        \"pm2-dashboard\": {"
echo "          \"url\": \"${API_URL}/mcp\","
echo "          \"headers\": { \"Authorization\": \"Bearer <MCP_SECRET>\" }"
echo "        }"
echo "      }"
echo "    }"
echo ""
echo "  Default login:"
echo "    Username: admin"
echo "    Password: admin"
echo ""
echo "  You will be required to change the password and email on first login."
echo ""
echo "  Useful commands (as $APP_USER):"
echo "    pm2 status"
echo "    pm2 logs"
echo "    pm2 restart pm2-dashboard-backend pm2-dashboard-frontend"
echo ""
echo "  Ensure firewall allows ports ${FRONTEND_PORT} and ${BACKEND_PORT} if needed:"
echo "    sudo ufw allow ${FRONTEND_PORT}/tcp"
echo "    sudo ufw allow ${BACKEND_PORT}/tcp"
echo ""

run_as_app_user "pm2 status"
