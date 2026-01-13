/**
 * Deployment configuration for S3 + CloudFront
 *
 * Copy this file to deploy.config.js and update with your values,
 * OR use environment variables (recommended for sensitive values).
 *
 * To use:
 * 1. Create an S3 bucket for your static site
 * 2. (Optional) Create a CloudFront distribution pointing to the S3 bucket
 * 3. Update the values below or set environment variables
 * 4. Run: npm run deploy
 */

export const deployConfig = {
  // S3 bucket name (without s3:// prefix)
  // Set via AWS_S3_BUCKET environment variable (recommended) or update default below
  bucketName: process.env.AWS_S3_BUCKET || 'your-app-name',

  // AWS region
  // Set via AWS_REGION environment variable (recommended) or update default below
  region: process.env.AWS_REGION || 'us-east-1',

  // AWS profile to use (optional - leave empty to use default profile)
  // Set via AWS_PROFILE environment variable (recommended) or update default below
  profile: process.env.AWS_PROFILE || '',

  // CloudFront distribution ID (optional - leave empty if not using CloudFront)
  // Set via AWS_CLOUDFRONT_DISTRIBUTION_ID environment variable (recommended)
  cloudFrontDistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',

  // CloudFront domain URL (required for production builds)
  // This will be used to set VITE_REDIRECT_URI and VITE_SIGN_OUT_URI in production
  // Set via AWS_CLOUDFRONT_URL environment variable (recommended) or update default below
  // Example: 'https://d1234567890.cloudfront.net'
  cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL || '',

  // Local directory to deploy (usually 'dist' for Vite)
  buildDir: 'dist',

  // Cache control for different file types (in seconds)
  cacheControl: {
    html: 'no-cache, no-store, must-revalidate', // Always check for updates
    assets: 'public, max-age=31536000, immutable', // 1 year for hashed assets
    default: 'public, max-age=3600', // 1 hour default
  },
}
