# Deployment Guide: S3 + CloudFront

This guide walks you through deploying your Vue.js application to AWS S3 and CloudFront.

## Prerequisites

1. **AWS CLI installed and configured**

   ```bash
   aws --version
   aws configure
   ```

   You'll need AWS credentials with permissions for:
   - S3 (create bucket, upload files, set bucket policies)
   - CloudFront (create distribution, create invalidations)
   - IAM (if creating bucket policies)

2. **Build your application**
   ```bash
   npm run build
   ```

## Step 1: Create S3 Bucket

1. **Create the bucket via AWS CLI:**

   ```bash
   aws s3 mb s3://your-app-name --region us-east-1
   ```

   Replace `your-app-name` with your desired bucket name (must be globally unique).

2. **Or create via AWS Console:**
   - Go to S3 → Create bucket
   - Choose a unique bucket name
   - Select your region
   - **Important:** Uncheck "Block all public access" (or configure it later)
   - Create bucket

## Step 2: Configure Deployment

1. **Edit `deploy.config.js`:**

   ```javascript
   export const deployConfig = {
     bucketName: 'your-app-name', // Your S3 bucket name
     region: 'us-east-1', // Your AWS region
     profile: 'production', // AWS profile to use (optional - leave empty for default)
     cloudFrontDistributionId: '', // Leave empty for now
     cloudFrontUrl: 'https://d1234567890.cloudfront.net', // Your CloudFront domain URL (required for production)
     // ... rest stays the same
   }
   ```

   **Important:** The `cloudFrontUrl` is used to set the correct redirect URIs in your production build. Without this, Cognito will redirect to localhost and authentication will fail.

2. **Or use environment variables:**

   ```bash
   export AWS_S3_BUCKET=your-app-name
   export AWS_REGION=us-east-1
   export AWS_PROFILE=production  # Optional: specify AWS profile
   export AWS_CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
   export AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net  # Required for production
   ```

   **Note:** If you have multiple AWS profiles configured (e.g., `production`, `staging`, `dev`), you can specify which one to use via the `profile` config option or `AWS_PROFILE` environment variable. This is useful when deploying to different AWS accounts or regions.

## Step 3: Deploy to S3

**Important:** Before deploying, make sure you've set the `cloudFrontUrl` in `deploy.config.js` or via the `AWS_CLOUDFRONT_URL` environment variable. This ensures your production build uses the correct redirect URIs for Cognito authentication.

Run the deployment script:

```bash
npm run deploy
```

This will use the existing build in the `dist/` folder. If you want to rebuild with production settings (recommended):

```bash
npm run deploy:build
```

This will:

- ✅ Build your application with production environment variables (if using `deploy:build`)
- ✅ Set `VITE_REDIRECT_URI` and `VITE_SIGN_OUT_URI` to your CloudFront URL
- ✅ Upload all files from `dist/` to your S3 bucket
- ✅ Set appropriate cache headers (no-cache for HTML, long cache for assets)
- ✅ Configure S3 for static website hosting
- ✅ Set bucket policy for public read access

## Step 4: Create CloudFront Distribution (Recommended)

CloudFront provides:

- **HTTPS/SSL** (required for OAuth callbacks)
- **CDN** (faster global access)
- **Custom domain** support

### Via AWS Console:

1. Go to **CloudFront** → **Create distribution**

2. **Origin settings:**
   - Origin domain: Select your S3 bucket (not the website endpoint)
   - Origin access: Choose "S3 bucket access" or "Public"
   - Name: Auto-filled

3. **Default cache behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS** (important for OAuth)
   - Allowed HTTP methods: **GET, HEAD, OPTIONS**
   - Cache policy: **CachingOptimized** (or create custom)

4. **Error pages (Critical for Vue Router):**
   - Create custom error response:
     - HTTP error code: **403**
     - Response page path: `/index.html`
     - HTTP response code: **200**
   - Create another for **404** → `/index.html` → **200**

5. **Settings:**
   - Default root object: `index.html`
   - Price class: Choose based on your needs
   - Create distribution

6. **Wait for deployment** (5-15 minutes)

7. **Update `deploy.config.js`** with your CloudFront details:

   ```javascript
   cloudFrontDistributionId: 'E1234567890ABC', // For cache invalidation
   cloudFrontUrl: 'https://d1234567890.cloudfront.net', // For production build URLs
   ```

   **Important:** The `cloudFrontUrl` is required for your production build to have the correct Cognito redirect URIs.

## Step 5: Update Cognito Configuration

1. **Get your CloudFront domain:**
   - CloudFront distribution → Domain name (e.g., `d1234567890.cloudfront.net`)
   - Copy the full URL: `https://d1234567890.cloudfront.net`

2. **Update `deploy.config.js` with CloudFront URL:**

   ```javascript
   cloudFrontUrl: 'https://d1234567890.cloudfront.net',
   ```

3. **Update Cognito App Client:**
   - Go to Cognito → User Pools → Your pool → App integration
   - Edit your app client
   - Add callback URL: `https://d1234567890.cloudfront.net/auth/callback`
   - Add sign-out URL: `https://d1234567890.cloudfront.net`
   - Save changes

4. **Rebuild and redeploy with correct URLs:**

   ```bash
   npm run deploy:build
   ```

   This will rebuild your app with the correct CloudFront URLs baked into the build, so Cognito will redirect to the right place.

## Step 6: Test Deployment

1. Visit your CloudFront domain or S3 website endpoint
2. Test authentication flow
3. Test all routes (Vue Router should work with the error page configuration)

## Future Deployments

Simply run:

```bash
npm run deploy:build
```

This will:

- Build your app
- Upload to S3
- Invalidate CloudFront cache (if distribution ID is configured)

## Troubleshooting

### Vue Router routes return 404

- Ensure CloudFront error pages are configured (403/404 → `/index.html` → 200)
- Check S3 static website hosting is enabled with error document: `index.html`

### OAuth callback fails

- Verify callback URL in Cognito matches your CloudFront domain
- Ensure CloudFront uses "Redirect HTTP to HTTPS"
- Check browser console for CORS errors

### Files not updating

- CloudFront cache may take a few minutes to invalidate
- Check cache invalidation status in CloudFront console
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Permission errors

- Ensure your AWS credentials have S3 and CloudFront permissions
- Check bucket policy allows public read access
- Verify IAM user/role has necessary permissions

## Security Best Practices

1. **Use CloudFront** instead of direct S3 website hosting (HTTPS required)
2. **Enable CloudFront access logs** for monitoring
3. **Set up WAF** (Web Application Firewall) if needed
4. **Use IAM roles** instead of access keys when possible
5. **Enable S3 bucket versioning** for rollback capability
6. **Set up CloudFront custom domain** with SSL certificate

## Cost Optimization

- **S3 storage:** ~$0.023 per GB/month
- **S3 requests:** ~$0.0004 per 1,000 requests
- **CloudFront:** ~$0.085 per GB (first 10TB)
- **CloudFront requests:** ~$0.0075 per 10,000 requests

For a small app, expect **<$1/month** for typical traffic.
