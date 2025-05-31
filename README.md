# PM2 Dashboard

A modern web-based dashboard for managing PM2 processes with GitHub integration, built with React, Node.js, and MongoDB.

## 🚀 Features

### Service Management
- **Create, Edit, Delete Services**: Full CRUD operations for PM2 services
- **GitHub Integration**: Deploy services directly from GitHub repositories using personal access tokens
- **Multi-Environment Support**: Manage multiple environments (development, staging, production) per service
- **Zero-Downtime Deployments**: Reload services with latest code changes without downtime
  
### Repository & Deployment Configuration
- **Repository Selection**: Choose any GitHub repository and branch for deployment
- **Source Directory**: Specify custom source directories within repositories
- **Environment Variables**: Manage environment-specific variables through the UI
- **Automatic Dependency Management**: Automatic npm install and build processes

### Node.js & Process Management
- **Node Version Management**: Choose specific Node.js versions using NVM
- **npm Script Support**: Start services using npm scripts with custom arguments
- **Cluster Mode**: Scale applications horizontally with PM2 cluster mode
- **Process Monitoring**: Real-time process metrics and status monitoring

### Dashboard & Monitoring
- **System Metrics**: Monitor CPU, memory, and system resources
- **Service Metrics**: Track individual service performance, uptime, and restarts
- **Real-time Updates**: Live dashboard updates with service status changes
- **Service Status Tracking**: Monitor online, stopped, building, and error states

### Logging & Debugging
- **Service Logs**: View real-time logs for individual services
- **System Logs**: Monitor system-level events and errors
- **Log Streaming**: Live log updates in the web interface
- **Error Tracking**: Comprehensive error reporting and status management

![Screenshot 2025-05-31 at 16 23 59](https://github.com/user-attachments/assets/2d3b5f81-2e8b-41f3-8b65-1e574e58250f)
![Screenshot 2025-05-31 at 16 24 51](https://github.com/user-attachments/assets/f01f4b49-8a02-4589-9030-a1aca41ab667)
![Screenshot 2025-05-31 at 16 23 24](https://github.com/user-attachments/assets/bca66e51-c4f4-40a1-bb70-c4b54047f428)


## 📋 Prerequisites

Before setting up the PM2 Dashboard, ensure your system has the following installed:

### Required Software
- **Node.js** (v16 or higher)
- **PM2** (Process Manager)
- **NVM** (Node Version Manager)
- **Git** (Version Control)
- **MongoDB** (Database)

### Installation Commands

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install PM2 globally
npm install -g pm2

# Install Git
sudo apt-get install git

# Install MongoDB (Ubuntu/Debian)
sudo apt-get install -y mongodb
# or for MongoDB Community Edition
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pm2-dashboard.git
cd pm2-dashboard
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ../..
```

### 3. Environment Configuration

#### Backend Configuration
Create a `.env` file in `apps/backend/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/pm2-dashboard

# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token

# Server Configuration
PORT=3000
NODE_ENV=development

# Working Directory (where repositories will be cloned)
WORKING_DIR=/path/to/your/working/directory

# JWT Secret (for authentication if implemented)
JWT_SECRET=your_jwt_secret_key
```

#### Frontend Configuration
Create a `.env` file in `apps/frontend/`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
```

### 4. Database Setup

Start MongoDB service:

```bash
# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# Verify MongoDB is running
mongo --eval "db.adminCommand('ismaster')"
```

### 5. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with the following permissions:
   - `repo` (Full control of private repositories)
   - `read:user` (Read user profile data)
3. Copy the token and add it to your backend `.env` file

### 6. Start the Application

#### Development Mode

```bash
# Start backend (from root directory)
npm run dev:backend

# In a new terminal, start frontend
npm run dev:frontend
```

#### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

The application will be available at:
- **Frontend**: http://localhost:5173 (development) or http://localhost:3000 (production)
- **Backend API**: http://localhost:3000/api

## 🔧 Configuration

### Working Directory Setup
Create and configure the working directory where repositories will be cloned:

```bash
# Create working directory
sudo mkdir -p /opt/pm2-dashboard/repositories
sudo chown -R $USER:$USER /opt/pm2-dashboard
chmod 755 /opt/pm2-dashboard

# Update your backend .env file
WORKING_DIR=/opt/pm2-dashboard/repositories
```

### NVM Configuration
Ensure NVM is properly configured for the user running the dashboard:

```bash
# Add to ~/.bashrc or ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

## 📱 Usage

### Creating a Service

1. Navigate to the Services page
2. Click "Add Service"
3. Fill in the service details:
   - **Name**: Service identifier
   - **Repository URL**: GitHub repository URL
   - **Branch**: Target branch (default: main)
   - **Source Directory**: Optional subdirectory
   - **Node Version**: Select from available NVM versions
   - **Execution Method**: Choose npm script or direct script
   - **Cluster Mode**: Enable for horizontal scaling

### Managing Environments

1. Open a service details page
2. Navigate to the Environments section
3. Add environment-specific variables
4. Set the active environment for deployment

### Service Operations

- **Start**: Deploy and start the service
- **Stop**: Stop the running service
- **Restart**: Restart the service
- **Reload**: Update with latest code and reload (zero-downtime)
- **Delete**: Remove service and clean up files

## 🏗️ Architecture

```
pm2-dashboard/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── modules/
│   │   └── package.json
│   └── frontend/         # React dashboard
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── api/
│       │   └── types/
│       └── package.json
├── packages/
│   └── shared/           # Shared types and utilities
└── package.json
```

## 🔌 API Endpoints

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create a new service
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Service Operations
- `POST /api/services/:id/start` - Start service
- `POST /api/services/:id/stop` - Stop service
- `POST /api/services/:id/restart` - Restart service
- `POST /api/services/:id/reload` - Reload service

### Metrics & Monitoring
- `GET /api/services/metrics/system` - System metrics
- `GET /api/services/:id/metrics` - Service metrics
- `GET /api/services/:id/logs` - Service logs

### Environments
- `POST /api/services/:id/environments` - Add environment
- `PUT /api/services/:id/environments/:name` - Update environment
- `DELETE /api/services/:id/environments/:name` - Delete environment
- `PUT /api/services/:id/environments/:name/activate` - Set active environment

## 🛠️ Development

### Project Structure
This is a monorepo using npm workspaces with:
- **Backend**: NestJS with TypeScript
- **Frontend**: React with TypeScript and Vite
- **Shared**: Common types and utilities

### Available Scripts

```bash
# Development
npm run dev:backend     # Start backend in development mode
npm run dev:frontend    # Start frontend in development mode
npm run dev             # Start both backend and frontend

# Building
npm run build:backend   # Build backend
npm run build:frontend  # Build frontend
npm run build           # Build entire application

# Testing
npm run test:backend    # Run backend tests
npm run test:frontend   # Run frontend tests
npm run test            # Run all tests

# Linting
npm run lint            # Lint all packages
npm run lint:fix        # Fix linting issues
```

## 🔒 Security Considerations

- Store GitHub personal access tokens securely
- Use environment variables for sensitive configuration
- Implement proper access controls for production deployments
- Regularly update dependencies for security patches
- Consider implementing authentication for multi-user environments

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **NVM Not Found**
   ```bash
   # Reload shell configuration
   source ~/.bashrc
   
   # Verify NVM installation
   nvm --version
   ```

3. **PM2 Permission Issues**
   ```bash
   # Reset PM2
   pm2 kill
   pm2 resurrect
   ```

4. **GitHub API Rate Limits**
   - Ensure your personal access token is valid
   - Check GitHub API rate limit status
   - Consider implementing token rotation for high-volume usage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

---

**Note**: This dashboard is designed for development and staging environments. For production use, implement additional security measures, authentication, and monitoring. 
