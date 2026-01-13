# Authenticated Vue Boilerplate

A production-ready Vue 3 boilerplate with AWS Cognito authentication, designed to help you quickly get started building authenticated frontend applications.

## Features

- ✅ **AWS Cognito Authentication** - Complete OAuth2/OIDC authentication flow
- ✅ **Protected Routes** - Vue Router with authentication guards
- ✅ **State Management** - Pinia stores for auth and user preferences
- ✅ **User Account Management** - Profile picture upload, display name, theme preferences
- ✅ **Image Management** - S3 image upload and presigned URL utilities
- ✅ **Toast Notifications** - User-friendly notification system
- ✅ **Bootstrap 5 UI** - Modern, responsive design with dark mode support
- ✅ **AWS Deployment** - Automated deployment to S3 + CloudFront
- ✅ **TypeScript Ready** - Easy to migrate to TypeScript if needed

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js** - Version `^20.19.0` or `>=22.12.0` (see `package.json` engines)
- **npm** - Comes with Node.js
- **AWS CLI** - For deployment (install from [AWS CLI documentation](https://aws.amazon.com/cli/))

### AWS Services Setup

You'll need the following AWS services configured:

1. **AWS Cognito User Pool**
   - User Pool ID
   - App Client ID
   - Cognito Domain (for hosted UI)
   - Callback and sign-out URLs configured

2. **AWS API Gateway** (optional, for backend API)
   - API Gateway URL endpoint

3. **AWS S3 Bucket** (for deployment)
   - Bucket name
   - Region

4. **AWS CloudFront Distribution** (recommended for production)
   - Distribution ID
   - CloudFront domain URL

### AWS CLI Configuration

Configure your AWS credentials:

```bash
aws configure
```

You'll need credentials with permissions for:

- S3 (create bucket, upload files, set bucket policies)
- CloudFront (create distribution, create invalidations)
- IAM (if creating bucket policies)

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=your-app-name.auth.us-east-1.amazoncognito.com

# Redirect URIs (for development)
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_SIGN_OUT_URI=http://localhost:5173

# API Gateway (optional - for backend API)
VITE_USER_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# Agent API Gateway (for AI agent interactions)
VITE_AGENT_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com

# Jobs API Gateway (for long-running agent operations - avoids 30s timeout)
VITE_JOBS_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/jobs

# WebSocket API Endpoint (for real-time job progress updates)
VITE_WEBSOCKET_API_ENDPOINT=wss://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

### Environment Variables Explained

| Variable                    | Description                           | Required |
| --------------------------- | ------------------------------------- | -------- |
| `VITE_AWS_REGION`           | AWS region (e.g., `us-east-1`)        | Yes      |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID                  | Yes      |
| `VITE_COGNITO_CLIENT_ID`    | Cognito App Client ID                 | Yes      |
| `VITE_COGNITO_DOMAIN`       | Cognito domain (without `https://`)   | Yes      |
| `VITE_REDIRECT_URI`         | OAuth callback URL for development    | Yes      |
| `VITE_SIGN_OUT_URI`         | Sign-out redirect URL for development | Yes      |
| `VITE_USER_API_GATEWAY_URL`      | API Gateway endpoint URL              | Yes      |
| `VITE_AGENT_API_GATEWAY_URL`     | Agent API Gateway endpoint URL        | Yes      |
| `VITE_JOBS_API_GATEWAY_URL`      | Jobs API Gateway endpoint URL (for long-running operations) | Yes      |
| `VITE_WEBSOCKET_API_ENDPOINT`    | WebSocket API endpoint URL (for real-time job updates) | Yes      |

### Deployment Configuration

Create a `deploy.config.js` file (copy from `deploy.config.example.js`):

```javascript
export const deployConfig = {
  bucketName: process.env.AWS_S3_BUCKET || 'your-app-name',
  region: process.env.AWS_REGION || 'us-east-1',
  profile: process.env.AWS_PROFILE || '',
  cloudFrontDistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',
  cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL || '',
  buildDir: 'dist',
  cacheControl: {
    html: 'no-cache, no-store, must-revalidate',
    assets: 'public, max-age=31536000, immutable',
    default: 'public, max-age=3600',
  },
}
```

Or use environment variables:

```bash
export AWS_S3_BUCKET=your-app-name
export AWS_REGION=us-east-1
export AWS_PROFILE=production  # Optional
export AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
export AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

## Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Format Code

```bash
npm run format
```

## Deployment

### Initial Setup

1. **Create S3 Bucket:**

```bash
aws s3 mb s3://your-app-name --region us-east-1
```

2. **Create CloudFront Distribution** (recommended):
   - Go to AWS Console → CloudFront → Create distribution
   - Origin: Select your S3 bucket
   - Viewer protocol: Redirect HTTP to HTTPS
   - Error pages: Configure 403 and 404 to return `/index.html` with status 200
   - Default root object: `index.html`
   - Wait for deployment (5-15 minutes)

3. **Update Cognito Configuration:**
   - Add callback URL: `https://your-cloudfront-domain.cloudfront.net/auth/callback`
   - Add sign-out URL: `https://your-cloudfront-domain.cloudfront.net`

4. **Update `deploy.config.js`:**
   - Set `cloudFrontUrl` to your CloudFront domain
   - Set `cloudFrontDistributionId` for cache invalidation

### Deploy

**Deploy with build (recommended):**

```bash
npm run deploy:build
```

This will:

- Build your application with production environment variables
- Set correct redirect URIs for your CloudFront URL
- Upload files to S3
- Configure cache headers
- Invalidate CloudFront cache (if distribution ID is set)

**Deploy existing build:**

```bash
npm run deploy
```

### Future Deployments

Simply run:

```bash
npm run deploy:build
```

## Project Structure

```
src/
├── AccountView.vue          # User account management page
├── App.vue                   # Main app component with navigation
├── CallbackView.vue          # OAuth callback handler
├── HomeView.vue              # Home page
├── LoginView.vue             # Login page
├── components/
│   └── ConfirmModal.vue     # Reusable confirmation modal
├── composables/
│   ├── useAuth.js           # Authentication composable
│   ├── useImages.js         # Image upload/management utilities
│   └── useToast.js          # Toast notification system
├── config/
│   └── aws-config.js        # AWS configuration loader
├── router/
│   └── index.js             # Vue Router configuration
└── stores/
    ├── auth.js              # Authentication store (Pinia)
    └── preferences.js       # User preferences store (Pinia)
```

## Key Components

### Authentication Flow

1. User clicks login → Redirected to Cognito Hosted UI
2. User authenticates → Redirected to `/auth/callback`
3. `CallbackView` exchanges code for tokens
4. Tokens stored in Pinia auth store
5. Protected routes are accessible

### Protected Routes

Routes with `meta: { requiresAuth: true }` require authentication. Unauthenticated users are redirected to Cognito login.

### User Preferences

The `preferences` store manages:

- Display name (custom or OAuth name)
- Profile picture (custom upload or OAuth picture)
- Theme preference (light/dark/system)

## Troubleshooting

### Authentication Issues

- **Callback fails:** Verify callback URL in Cognito matches your domain
- **Redirects to localhost:** Ensure `cloudFrontUrl` is set in `deploy.config.js` for production builds
- **Token refresh fails:** Check Cognito domain and client ID configuration

### Deployment Issues

- **Vue Router 404s:** Ensure CloudFront error pages (403/404) return `/index.html` with status 200
- **Files not updating:** CloudFront cache may take a few minutes to invalidate
- **Permission errors:** Verify AWS credentials have S3 and CloudFront permissions

### Development Issues

- **Environment variables not loading:** Ensure variables start with `VITE_` prefix
- **API calls fail:** Check `VITE_USER_API_GATEWAY_URL` is set correctly
- **Image upload fails:** Verify API Gateway has `/upload-url` and `/download-url` endpoints

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use CloudFront** - Required for HTTPS (OAuth requires HTTPS)
3. **Set up CORS** - Configure API Gateway CORS properly
4. **Use IAM roles** - Prefer IAM roles over access keys when possible
5. **Enable CloudFront access logs** - For monitoring and security

## Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Vite Documentation](https://vite.dev/)

## Support

For issues and questions, please check:

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- AWS service documentation
- Vue.js community resources
