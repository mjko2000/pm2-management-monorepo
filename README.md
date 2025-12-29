# PM2 Dashboard

<div align="center">

![PM2 Dashboard](https://img.shields.io/badge/PM2-Dashboard-6366f1?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

A modern, feature-rich web-based dashboard for managing PM2 processes with GitHub integration, user authentication, and comprehensive monitoring capabilities.

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-endpoints)

</div>

---

## ✨ Features

### 🔐 Authentication & User Management

- **JWT-based Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Admin and User roles with granular permissions
- **User Management**: Admin-only user creation with automatic password generation
- **Email Notifications**: Welcome emails sent automatically when users are created
- **Profile Management**: Users can update their profile and change passwords
- **Team Management**: Admin dashboard for managing all users

### 🎯 Service Management

- **Full CRUD Operations**: Create, read, update, and delete PM2 services
- **Service Visibility**: Private (owner-only) or Public (all users) service access
- **Permission-based Access**: Only owners, admins, or public service users can manage services
- **Multi-Environment Support**: Manage multiple environments (development, staging, production) per service
- **Zero-Downtime Deployments**: Reload services with latest code changes without downtime
- **Autostart Configuration**: Services can auto-start when the backend restarts

### 🔑 GitHub Token Management

- **User-managed Tokens**: Each user can create and manage their own GitHub tokens
- **Token Visibility**: Public tokens (accessible to all) or Private tokens (owner-only)
- **Token Selection**: Choose which token to use when creating services
- **Secure Storage**: Tokens are securely stored in the database
- **Token Validation**: Built-in validation to ensure token validity

### 📦 Repository & Deployment

- **Repository Selection**: Choose any GitHub repository and branch for deployment
- **Source Directory**: Specify custom source directories within repositories
- **Environment Variables**: Manage environment-specific variables through the UI
- **Automatic Dependency Management**: Automatic npm install and build processes
- **Branch Management**: Easy branch selection and switching

### ⚙️ Node.js & Process Management

- **Node Version Management**: Choose specific Node.js versions using NVM
- **npm Script Support**: Start services using npm scripts with custom arguments
- **Direct Script Execution**: Run Node.js scripts directly with custom arguments
- **Cluster Mode**: Scale applications horizontally with PM2 cluster mode (up to 16 instances)
- **Process Monitoring**: Real-time process metrics and status monitoring

### 📊 Dashboard & Monitoring

- **System Metrics**: Monitor CPU, memory, and system resources in real-time
- **Service Metrics**: Track individual service performance, uptime, and restarts
- **Real-time Updates**: Live dashboard updates with service status changes
- **Service Status Tracking**: Monitor online, stopped, building, and error states
- **Beautiful Dark Theme**: Modern, responsive UI with glassmorphism effects

### 🌐 Domain Management & SSL

- **Custom Domains**: Attach custom domains to your services
- **Nginx Integration**: Automatic Nginx reverse proxy configuration
- **SSL Certificates**: Automatic SSL certificate provisioning via Certbot (Let's Encrypt)
- **DNS Verification**: Built-in DNS verification with Cloudflare proxy detection
- **Domain Lifecycle**: Full domain management (create, verify, activate, delete)
- **Auto-cleanup**: Domains and Nginx configs are automatically removed when services are deleted

### 📝 Logging & Debugging

- **Service Logs**: View real-time logs for individual services
- **System Logs**: Monitor system-level events and errors
- **Log Streaming**: Live log updates in the web interface
- **Error Tracking**: Comprehensive error reporting and status management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PM2** (Process Manager)
- **NVM** (Node Version Manager)
- **Git** (Version Control)
- **MongoDB** (v6.0 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/pm2-dashboard.git
cd pm2-dashboard

# Install dependencies
npm install

# Set up environment variables (see Configuration section)
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Start MongoDB
sudo systemctl start mongod  # Linux
# or
brew services start mongodb-community  # macOS

# Start the application
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api

**Default Admin Credentials:**

- Username: `admin`
- Password: `admin` (change immediately after first login)

---

## 📋 Prerequisites

### Required Software

| Software | Version | Purpose                 |
| -------- | ------- | ----------------------- |
| Node.js  | v18+    | Runtime environment     |
| PM2      | Latest  | Process manager         |
| NVM      | Latest  | Node version management |
| Git      | Latest  | Version control         |
| MongoDB  | v6.0+   | Database                |
| Nginx    | Latest  | Reverse proxy (domains) |
| Certbot  | Latest  | SSL certificates        |

### Installation Commands

<details>
<summary><b>Ubuntu/Debian</b></summary>

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install PM2 globally
npm install -g pm2

# Install Git
sudo apt-get install git

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx

# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx
```

</details>

<details>
<summary><b>macOS</b></summary>

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc

# Install PM2 globally
npm install -g pm2

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Install Nginx
brew install nginx
brew services start nginx

# Install Certbot
brew install certbot
```

</details>

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in `apps/backend/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/pm2-dashboard

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Working Directory (where repositories will be cloned)
WORKING_DIR=/opt/pm2-dashboard/repositories

# Email Configuration (for user welcome emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="PM2 Dashboard" <noreply@example.com>
APP_NAME=PM2 Dashboard
APP_URL=http://localhost:5173

# Domain Management (for Nginx/SSL)
SERVER_IP=your.server.ip.address
```

### Frontend Environment Variables

Create a `.env` file in `apps/frontend/`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
```

### Email Setup (Gmail)

1. Enable 2-Step Verification in your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use the 16-character password as `SMTP_PASS`

### Working Directory Setup

```bash
# Create working directory
sudo mkdir -p /opt/pm2-dashboard/repositories
sudo chown -R $USER:$USER /opt/pm2-dashboard
chmod 755 /opt/pm2-dashboard
```

### NVM Configuration

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

### Nginx & Certbot Sudoers Setup

The PM2 Dashboard backend needs permission to run Nginx and Certbot commands. Configure sudoers for the user running the backend:

```bash
# Create sudoers file for PM2 Dashboard
sudo visudo -f /etc/sudoers.d/pm2-dashboard
```

Add the following content (replace `youruser` with your actual username):

```
# PM2 Dashboard - Nginx commands
youruser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
youruser ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
youruser ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/nginx/sites-available/*
youruser ALL=(ALL) NOPASSWD: /usr/bin/ln -sf /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*
youruser ALL=(ALL) NOPASSWD: /usr/bin/rm /etc/nginx/sites-available/*
youruser ALL=(ALL) NOPASSWD: /usr/bin/rm /etc/nginx/sites-enabled/*

# PM2 Dashboard - Certbot commands
youruser ALL=(ALL) NOPASSWD: /usr/bin/certbot --nginx -d * --non-interactive --agree-tos -m *
youruser ALL=(ALL) NOPASSWD: /usr/bin/certbot delete --cert-name * --non-interactive
```

Verify the configuration:

```bash
# Test sudo permissions
sudo nginx -t
sudo systemctl reload nginx
```

**Security Note**: Only grant these specific permissions. Never run the Node.js application as root.

---

## 📱 Usage Guide

### First Time Setup

1. **Login**: Use default admin credentials (`admin`/`admin`)
2. **Change Password**: Go to Profile page and update your password
3. **Add GitHub Token**: Navigate to GitHub Tokens and add your first token
4. **Create Service**: Go to Services and create your first service

### Creating a Service

1. Navigate to **Services** page
2. Click **"Add Service"**
3. Fill in the service details:
   - **Name**: Unique service identifier
   - **GitHub Token**: Select a token from your available tokens
   - **Repository**: Choose from your GitHub repositories
   - **Branch**: Select the target branch
   - **Source Directory**: Optional subdirectory within the repo
   - **Node Version**: Select from available NVM versions
   - **Visibility**: Private (only you) or Public (all users)
   - **Execution Method**: npm script or direct script
   - **Cluster Mode**: Enable for horizontal scaling (1-16 instances)
   - **Autostart**: Enable to auto-start on backend restart

### Managing GitHub Tokens

1. Navigate to **GitHub Tokens** page
2. Click **"Add Token"**
3. Enter token details:
   - **Name**: Descriptive name for the token
   - **Token**: Your GitHub personal access token
   - **Visibility**: Public (all users) or Private (only you)
4. Click **"Validate"** to verify the token
5. Use the token when creating services

### Managing Users (Admin Only)

1. Navigate to **Team** page
2. Click **"Add User"**
3. Fill in user details:
   - **Username**: 3-20 characters, alphanumeric with underscores
   - **Email**: Valid email address
   - **Password**: Leave empty to auto-generate (sent via email)
   - **Role**: Admin or User
4. User will receive welcome email with credentials

### Service Operations

| Operation   | Description                             | Access                             |
| ----------- | --------------------------------------- | ---------------------------------- |
| **Start**   | Deploy and start the service            | Owner, Admin, Public service users |
| **Stop**    | Stop the running service                | Owner, Admin, Public service users |
| **Restart** | Restart the service                     | Owner, Admin, Public service users |
| **Reload**  | Update with latest code (zero-downtime) | Owner, Admin, Public service users |
| **Delete**  | Remove service and clean up files       | Owner, Admin only                  |
| **Edit**    | Modify service configuration            | Owner, Admin, Public service users |

### Managing Environments

1. Open a service details page
2. Navigate to the **Environments** section
3. Click **"Add Environment"**
4. Configure environment variables
5. Set the **active environment** for deployment

### Service Visibility

- **Private Services**: Only the creator can view and manage
- **Public Services**: All authenticated users can view and manage
- **Admin Access**: Admins can see and manage all services (private and public)

### Managing Custom Domains

The PM2 Dashboard allows you to attach custom domains to your services with automatic SSL certificates.

#### Adding a Domain

1. Open a **service details** page
2. Navigate to the **Domains** section
3. Click **"Add Domain"**
4. Enter:
   - **Domain**: Your domain name (e.g., `api.example.com`)
   - **Port**: The internal port your service listens on
5. Click **"Add"**

#### Configuring DNS

After adding a domain, you'll see a DNS configuration guide:

1. Go to your **DNS provider** (Cloudflare, Namecheap, Route53, etc.)
2. Add an **A record**:
   - **Type**: A
   - **Name**: Your subdomain (e.g., `api`) or `@` for root
   - **Value**: Your server IP (shown in the guide)
   - **TTL**: Auto or 300
3. Wait for DNS propagation (5-15 minutes)

#### Verifying DNS

1. Click **"Verify DNS"** to check if your domain points to the server
2. If using **Cloudflare** (proxy enabled), click **"Skip Verification"** instead
   - Cloudflare proxies traffic through their servers, so DNS verification won't work normally
   - Make sure your Cloudflare SSL mode is set to "Full" or "Full (Strict)"

#### Activating Domain (SSL)

Once verified:

1. Click **"Activate Domain with SSL"**
2. The system will:
   - Create Nginx reverse proxy configuration
   - Obtain SSL certificate via Certbot (Let's Encrypt)
   - Enable HTTPS for your domain
3. Your domain is now active with SSL! 🎉

#### Domain Status

| Status       | Description                                |
| ------------ | ------------------------------------------ |
| **Pending**  | Domain added, awaiting DNS verification    |
| **Verified** | DNS verified, ready for activation         |
| **Active**   | Domain is live with Nginx config and SSL   |
| **Error**    | Something went wrong (check error message) |

#### Deleting Domains

- Domains can be deleted individually from the service details page
- When a **service is deleted**, all associated domains and Nginx configs are automatically removed
- SSL certificates are also cleaned up via Certbot

---

## 🏗️ Architecture

```
pm2-dashboard/
├── apps/
│   ├── backend/              # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/         # Authentication & authorization
│   │   │   ├── domain/       # Domain management (Nginx/SSL)
│   │   │   ├── email/        # Email service (nodemailer)
│   │   │   ├── github/       # GitHub integration
│   │   │   ├── pm2/          # PM2 service management
│   │   │   ├── environment/  # Environment management
│   │   │   ├── logger/       # Logging service
│   │   │   ├── config/       # Configuration
│   │   │   └── schemas/      # MongoDB schemas
│   │   └── package.json
│   └── frontend/             # React dashboard
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── pages/        # Page components
│       │   ├── api/          # API client functions
│       │   ├── contexts/     # React contexts (Auth)
│       │   ├── layouts/      # Layout components
│       │   └── theme.ts      # MUI theme configuration
│       └── package.json
├── packages/
│   └── shared/               # Shared TypeScript types
│       └── src/
│           └── types/
└── package.json              # Monorepo root
```

### Technology Stack

**Backend:**

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- [Passport.js](http://www.passportjs.org/) - Authentication
- [JWT](https://jwt.io/) - Token-based auth
- [Nodemailer](https://nodemailer.com/) - Email service
- [Octokit](https://github.com/octokit/rest.js) - GitHub API client
- [PM2](https://pm2.keymetrics.io/) - Process manager

**Frontend:**

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Material-UI (MUI)](https://mui.com/) - Component library
- [React Router](https://reactrouter.com/) - Routing
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [React Hook Form](https://react-hook-form.com/) - Form management
- [Vite](https://vitejs.dev/) - Build tool

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                | Description      | Auth     |
| ------ | ----------------------- | ---------------- | -------- |
| `POST` | `/auth/login`           | User login       | Public   |
| `GET`  | `/auth/me`              | Get current user | Required |
| `PUT`  | `/auth/profile`         | Update profile   | Required |
| `POST` | `/auth/change-password` | Change password  | Required |

### User Management (Admin Only)

| Method   | Endpoint          | Description     |
| -------- | ----------------- | --------------- |
| `GET`    | `/auth/users`     | List all users  |
| `POST`   | `/auth/users`     | Create new user |
| `PUT`    | `/auth/users/:id` | Update user     |
| `DELETE` | `/auth/users/:id` | Delete user     |

### Services

| Method   | Endpoint        | Description         | Access                 |
| -------- | --------------- | ------------------- | ---------------------- |
| `GET`    | `/services`     | List services       | Filtered by visibility |
| `POST`   | `/services`     | Create service      | Required               |
| `GET`    | `/services/:id` | Get service details | Permission-based       |
| `PUT`    | `/services/:id` | Update service      | Owner/Admin/Public     |
| `DELETE` | `/services/:id` | Delete service      | Owner/Admin only       |

### Service Operations

| Method | Endpoint                | Description                    |
| ------ | ----------------------- | ------------------------------ |
| `POST` | `/services/:id/start`   | Start service                  |
| `POST` | `/services/:id/stop`    | Stop service                   |
| `POST` | `/services/:id/restart` | Restart service                |
| `POST` | `/services/:id/reload`  | Reload service (zero-downtime) |

### GitHub Tokens

| Method   | Endpoint                      | Description           |
| -------- | ----------------------------- | --------------------- |
| `GET`    | `/github/tokens`              | List available tokens |
| `POST`   | `/github/tokens`              | Create new token      |
| `PUT`    | `/github/tokens/:id`          | Update token          |
| `DELETE` | `/github/tokens/:id`          | Delete token          |
| `POST`   | `/github/tokens/:id/validate` | Validate token        |

### GitHub Integration

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| `GET`  | `/github/repositories` | List repositories              |
| `GET`  | `/github/branches`     | List branches for a repository |

### Metrics & Monitoring

| Method | Endpoint                   | Description     |
| ------ | -------------------------- | --------------- |
| `GET`  | `/services/metrics/system` | System metrics  |
| `GET`  | `/services/:id/metrics`    | Service metrics |
| `GET`  | `/services/:id/logs`       | Service logs    |

### Environments

| Method   | Endpoint                                    | Description            |
| -------- | ------------------------------------------- | ---------------------- |
| `POST`   | `/services/:id/environments`                | Add environment        |
| `PUT`    | `/services/:id/environments/:name`          | Update environment     |
| `DELETE` | `/services/:id/environments/:name`          | Delete environment     |
| `POST`   | `/services/:id/environments/:name/activate` | Set active environment |

### Domains

| Method   | Endpoint                        | Description                              |
| -------- | ------------------------------- | ---------------------------------------- |
| `GET`    | `/domains/server-ip`            | Get server IP for DNS configuration      |
| `GET`    | `/domains/service/:serviceId`   | List domains for a service               |
| `GET`    | `/domains/:id`                  | Get domain details                       |
| `POST`   | `/domains`                      | Create new domain                        |
| `POST`   | `/domains/:id/verify`           | Verify DNS configuration                 |
| `POST`   | `/domains/:id/verify?skip=true` | Skip DNS verification (Cloudflare/proxy) |
| `POST`   | `/domains/:id/activate`         | Activate domain (create Nginx + SSL)     |
| `DELETE` | `/domains/:id`                  | Delete domain and cleanup Nginx/SSL      |

**Note**: All endpoints except `/auth/login` require JWT authentication via Bearer token.

---

## 🛠️ Development

### Project Structure

This is a monorepo using npm workspaces with:

- **Backend**: NestJS with TypeScript
- **Frontend**: React with TypeScript and Vite
- **Shared**: Common types and utilities

### Available Scripts

```bash
# Development
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend in development mode
npm run dev:frontend     # Start frontend in development mode

# Building
npm run build            # Build entire application
npm run build:backend    # Build backend
npm run build:frontend   # Build frontend

# Testing
npm run test             # Run all tests
npm run test:backend     # Run backend tests
npm run test:frontend    # Run frontend tests

# Linting
npm run lint             # Lint all packages
npm run lint:fix         # Fix linting issues

# Database
npm run init:db          # Initialize database (create default admin)
```

### Development Workflow

1. **Start MongoDB**: `sudo systemctl start mongod`
2. **Start Backend**: `npm run dev:backend`
3. **Start Frontend**: `npm run dev:frontend` (in another terminal)
4. **Access**: http://localhost:5173

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and NestJS
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

---

## 🔒 Security Considerations

### Authentication & Authorization

- ✅ JWT-based authentication with secure token storage
- ✅ Password hashing using bcrypt (10 rounds)
- ✅ Role-based access control (Admin/User)
- ✅ Service-level permissions (Private/Public)
- ✅ Protected API endpoints with guards

### Best Practices

- 🔐 Store sensitive data in environment variables
- 🔐 Use strong JWT secrets in production
- 🔐 Enable HTTPS in production
- 🔐 Regularly update dependencies
- 🔐 Implement rate limiting for API endpoints
- 🔐 Use secure SMTP credentials for email
- 🔐 Validate all user inputs
- 🔐 Sanitize GitHub tokens before storage

### Production Checklist

- [ ] Change default admin password
- [ ] Set strong `JWT_SECRET`
- [ ] Configure HTTPS/SSL
- [ ] Set up proper MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Enable CORS restrictions
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Review and update dependencies

---

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><b>MongoDB Connection Issues</b></summary>

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo journalctl -u mongod -n 50

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

</details>

<details>
<summary><b>NVM Not Found</b></summary>

```bash
# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc

# Verify NVM installation
nvm --version

# Install Node.js version
nvm install 18
nvm use 18
```

</details>

<details>
<summary><b>PM2 Permission Issues</b></summary>

```bash
# Reset PM2
pm2 kill
pm2 resurrect

# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs
```

</details>

<details>
<summary><b>Email Not Sending</b></summary>

- Verify SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Check SMTP port (587 for STARTTLS, 465 for SSL)
- Verify firewall allows SMTP connections
- Check backend logs for email errors
</details>

<details>
<summary><b>GitHub API Rate Limits</b></summary>

- Ensure personal access tokens are valid
- Check GitHub API rate limit status
- Use different tokens for different users
- Implement token rotation for high-volume usage
</details>

<details>
<summary><b>Service Won't Start</b></summary>

- Check Node.js version compatibility
- Verify repository is accessible
- Check environment variables are set
- Review service logs in the dashboard
- Ensure working directory has write permissions
</details>

<details>
<summary><b>Domain/Nginx Issues</b></summary>

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# List active Nginx sites
ls -la /etc/nginx/sites-enabled/

# Check if domain config exists
cat /etc/nginx/sites-available/yourdomain.com.conf

# Manually reload Nginx
sudo systemctl reload nginx
```

</details>

<details>
<summary><b>SSL Certificate Issues</b></summary>

```bash
# List all certificates
sudo certbot certificates

# Test certificate renewal
sudo certbot renew --dry-run

# Manually renew a certificate
sudo certbot renew --cert-name yourdomain.com

# Delete a certificate
sudo certbot delete --cert-name yourdomain.com

# View Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

**Common SSL Issues:**

- Domain not pointing to server IP
- Port 80 blocked by firewall
- Rate limit exceeded (5 certificates per domain per week)
- Wildcard domains require DNS validation

</details>

<details>
<summary><b>Cloudflare Proxy Issues</b></summary>

When using Cloudflare with proxy enabled (orange cloud):

1. **DNS Verification fails**: Use "Skip Verification" button
2. **SSL Errors**: Set Cloudflare SSL mode to "Full" or "Full (Strict)"
3. **Mixed Content**: Ensure your app serves all resources over HTTPS
4. **Origin Certificate**: Consider using Cloudflare Origin Certificates for enhanced security

</details>

<details>
<summary><b>Sudoers Permission Denied</b></summary>

If domain operations fail with permission errors:

```bash
# Verify sudoers file syntax
sudo visudo -c -f /etc/sudoers.d/pm2-dashboard

# Check current user
whoami

# Test sudo permissions
sudo -l

# Ensure file has correct permissions
sudo chmod 440 /etc/sudoers.d/pm2-dashboard
```

</details>

---

## 📸 Screenshots

![Dashboard](https://github.com/user-attachments/assets/2873363d-dc0f-48de-81bc-2429b0e9cfe1)
_Main Dashboard View_

![Services](https://github.com/user-attachments/assets/96449477-9bed-453e-af8b-1f1944e1fe7c)
_Service Management_

![Service Details](https://github.com/user-attachments/assets/d05a4674-d529-449b-a6eb-0f776176ce66)
![Service Details](https://github.com/user-attachments/assets/96b612e5-c1c8-41bb-bc2b-b7c485b557f9)
_Service Details & Metrics_

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues and questions:

- 📧 Create an issue in the [GitHub repository](https://github.com/your-username/pm2-dashboard/issues)
- 📖 Check the [Troubleshooting](#-troubleshooting) section
- 📚 Review the [API Documentation](#-api-endpoints)
- 💬 Join our [Discussions](https://github.com/your-username/pm2-dashboard/discussions)

---

## 🎯 Roadmap

- [x] Custom domain management with Nginx
- [x] Automatic SSL certificates (Let's Encrypt)
- [x] Cloudflare proxy support
- [ ] WebSocket support for real-time updates
- [ ] Docker containerization
- [ ] Kubernetes integration
- [ ] Advanced monitoring and alerting
- [ ] Service templates
- [ ] Deployment history and rollback
- [ ] Multi-server support
- [ ] API rate limiting
- [ ] Audit logs
- [ ] Two-factor authentication

---

<div align="center">

**Made with ❤️ by the PM2 Dashboard Team**

⭐ Star us on GitHub if you find this project useful!

</div>
