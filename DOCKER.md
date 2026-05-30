# Docker Setup Guide

This app is now containerized and ready to deploy on your home server via Portainer.

## Building the Docker Image

### 1. Build locally for testing
```bash
docker build -t readyset:latest .
```

### 2. Build and push to Docker Hub

First, tag your image with your Docker Hub username:
```bash
docker build -t yourusername/readyset:latest .
docker push yourusername/readyset:latest
```

Replace `yourusername` with your actual Docker Hub username.

## Running Locally with Docker Compose

Test the container setup locally before deploying:

```bash
docker-compose up
```

The app will be available at `http://localhost:3000`

To run in background:
```bash
docker-compose up -d
```

To stop:
```bash
docker-compose down
```

## Deploying with Portainer

1. **Log into Portainer** on your home server
2. **Add a new container**:
   - Image: `yourusername/readyset:latest`
   - Port mapping: 3000:3000
   - Environment variables (if needed):
     - `NODE_ENV=production`
     - `DATA_DIR=/app/data` (already set in Dockerfile)
   - Volumes: Create a named volume `readyset_data` mounted at `/app/data`
   - Restart policy: Unless stopped

3. **Or use Docker Compose in Portainer**:
   - Go to Stacks
   - Upload the `docker-compose.yml` file
   - Deploy

## Important Files

- **Dockerfile**: Multi-stage build for optimal image size
- **docker-compose.yml**: Configuration for local testing and Portainer deployment
- **.dockerignore**: Excludes unnecessary files from the image

## Environment Variables

The container automatically sets up the data directory. Add any additional environment variables in Portainer:
- `NODE_ENV=production` (for production deployments)
- Custom `.env` variables can be passed through Portainer's environment section

## Data Persistence

All data is stored in the `/app/data` directory, which is mounted as a volume. This ensures your data persists across container restarts.

## Checking Logs

In Portainer:
1. Go to your container
2. Click "Logs" to view real-time output
3. Check the "Inspect" tab for container details

## Tips for Docker Hub

1. Create a Docker Hub account at https://hub.docker.com (if you don't have one)
2. Create a repository named `readyset` (or your preferred name)
3. Use the repository name when tagging: `yourusername/readyset:latest`
4. Consider adding version tags: `yourusername/readyset:1.0.0`

```bash
# Example with version tagging
docker build -t yourusername/readyset:1.0.0 .
docker tag yourusername/readyset:1.0.0 yourusername/readyset:latest
docker push yourusername/readyset:1.0.0
docker push yourusername/readyset:latest
```
