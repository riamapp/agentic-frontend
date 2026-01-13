#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { deployConfig } from '../deploy.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Helper to build AWS CLI command with profile if specified
function buildAWSCommand(baseCommand) {
  if (deployConfig.profile) {
    return baseCommand.replace('aws ', `aws --profile ${deployConfig.profile} `)
  }
  return baseCommand
}

// Check if AWS CLI is installed
function checkAWSCLI() {
  try {
    execSync('aws --version', { stdio: 'ignore' })
    return true
  } catch {
    console.error('❌ AWS CLI is not installed or not in PATH')
    console.error('   Install it from: https://aws.amazon.com/cli/')
    process.exit(1)
  }
}

// Build the application with production environment variables
function buildForProduction() {
  console.log('\n🔨 Building application for production...')

  // Check if .env file exists to preserve existing variables
  const envPath = join(projectRoot, '.env')
  const envExamplePath = join(projectRoot, '.env.example')
  let existingEnvVars = {}

  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        existingEnvVars[key] = value
      }
    })
  }

  // Build environment variables for production
  // Preserve all existing environment variables (including AWS credentials)
  const productionEnv = {
    ...process.env, // Preserve existing environment (includes AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)
    ...existingEnvVars, // Preserve .env file variables
  }

  // Preserve AWS credentials and profile if they exist
  // These are needed for AWS CLI commands, not for the build itself
  if (process.env.AWS_ACCESS_KEY_ID) {
    productionEnv.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
  }
  if (process.env.AWS_SECRET_ACCESS_KEY) {
    productionEnv.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
  }
  if (process.env.AWS_SESSION_TOKEN) {
    productionEnv.AWS_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN
  }
  if (process.env.AWS_PROFILE) {
    productionEnv.AWS_PROFILE = process.env.AWS_PROFILE
  }
  if (process.env.AWS_DEFAULT_REGION) {
    productionEnv.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION
  }

  // Override with production CloudFront URLs if configured
  if (deployConfig.cloudFrontUrl) {
    // Validate that it looks like a URL
    if (
      !deployConfig.cloudFrontUrl.startsWith('http://') &&
      !deployConfig.cloudFrontUrl.startsWith('https://')
    ) {
      console.error('❌ Invalid cloudFrontUrl format')
      console.error(`   Current value: ${deployConfig.cloudFrontUrl}`)
      console.error('   Expected format: https://d1234567890.cloudfront.net')
      console.error(
        '   Please set AWS_CLOUDFRONT_URL environment variable or update deploy.config.js',
      )
      process.exit(1)
    }
    const cloudFrontUrl = deployConfig.cloudFrontUrl.replace(/\/$/, '') // Remove trailing slash
    productionEnv.VITE_REDIRECT_URI = `${cloudFrontUrl}/auth/callback`
    productionEnv.VITE_SIGN_OUT_URI = cloudFrontUrl
    console.log(`   Setting VITE_REDIRECT_URI: ${productionEnv.VITE_REDIRECT_URI}`)
    console.log(`   Setting VITE_SIGN_OUT_URI: ${productionEnv.VITE_SIGN_OUT_URI}`)
  } else {
    console.warn('   ⚠️  CloudFront URL not set - redirect URIs will use defaults or .env values')
  }

  // Set NODE_ENV to production
  productionEnv.NODE_ENV = 'production'

  try {
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: projectRoot,
      env: productionEnv,
    })
    console.log('✅ Build completed successfully')
  } catch (error) {
    console.error('❌ Build failed')
    console.error(error.message)
    process.exit(1)
  }
}

// Check if build directory exists
function checkBuildDir() {
  const buildPath = join(projectRoot, deployConfig.buildDir)
  if (!existsSync(buildPath)) {
    console.error(`❌ Build directory '${deployConfig.buildDir}' does not exist`)
    console.error('   Run "npm run build" first or use "npm run deploy:build"')
    process.exit(1)
  }
  return buildPath
}

// Get cache control header for a file
function getCacheControl(filePath) {
  if (filePath.endsWith('.html')) {
    return deployConfig.cacheControl.html
  }
  if (filePath.match(/\.(js|css|woff|woff2|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    return deployConfig.cacheControl.assets
  }
  return deployConfig.cacheControl.default
}

// Upload files to S3 with appropriate cache headers
function uploadToS3(buildPath) {
  console.log(`\n📦 Uploading files to S3 bucket: ${deployConfig.bucketName}`)

  // Use AWS CLI to sync with cache control metadata
  const syncCommand = [
    'aws s3 sync',
    buildPath,
    `s3://${deployConfig.bucketName}`,
    `--region ${deployConfig.region}`,
    '--delete', // Remove files in S3 that don't exist locally
    '--exact-timestamps', // Only upload if file has changed
    '--cache-control', // Apply cache control
  ].join(' ')

  try {
    // Sync HTML files with no-cache
    execSync(
      buildAWSCommand(
        `aws s3 sync ${buildPath} s3://${deployConfig.bucketName} --region ${deployConfig.region} --delete --exclude "*" --include "*.html" --cache-control "${deployConfig.cacheControl.html}" --content-type "text/html"`,
      ),
      { stdio: 'inherit', cwd: projectRoot },
    )

    // Sync assets with long cache
    execSync(
      buildAWSCommand(
        `aws s3 sync ${buildPath} s3://${deployConfig.bucketName} --region ${deployConfig.region} --exclude "*.html" --cache-control "${deployConfig.cacheControl.assets}"`,
      ),
      { stdio: 'inherit', cwd: projectRoot },
    )

    console.log('✅ Files uploaded successfully')
  } catch (error) {
    console.error('❌ Failed to upload files to S3')
    console.error(error.message)
    process.exit(1)
  }
}

// Configure S3 bucket for static website hosting
function configureS3Bucket() {
  // If using CloudFront, we don't need public bucket policies
  // CloudFront uses OAC/OAI to access the bucket privately
  if (deployConfig.cloudFrontDistributionId) {
    console.log(`\n⚙️  Skipping S3 public bucket policy configuration`)
    console.log(`   Using CloudFront with Origin Access Control (OAC)`)
    console.log(`   Bucket should have "Block all public access" enabled`)
    console.log(`   CloudFront will access the bucket privately via OAC`)
    return
  }

  console.log(`\n⚙️  Configuring S3 bucket for static website hosting...`)

  try {
    // Enable static website hosting
    execSync(
      buildAWSCommand(
        `aws s3 website s3://${deployConfig.bucketName} --index-document index.html --error-document index.html --region ${deployConfig.region}`,
      ),
      { stdio: 'inherit' },
    )

    // Set bucket policy to allow public read access (only if not using CloudFront)
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${deployConfig.bucketName}/*`,
        },
      ],
    }

    const policyFile = join(projectRoot, 'bucket-policy.json')
    writeFileSync(policyFile, JSON.stringify(bucketPolicy, null, 2))

    execSync(
      buildAWSCommand(
        `aws s3api put-bucket-policy --bucket ${deployConfig.bucketName} --policy file://${policyFile} --region ${deployConfig.region}`,
      ),
      { stdio: 'inherit' },
    )

    // Clean up temp file
    unlinkSync(policyFile)

    console.log('✅ S3 bucket configured for static website hosting')
    console.log(
      `\n🌐 Website URL: http://${deployConfig.bucketName}.s3-website-${deployConfig.region}.amazonaws.com`,
    )
  } catch (error) {
    console.warn('⚠️  Could not configure S3 bucket (it may already be configured)')
    console.warn('   Error:', error.message)
    if (error.message.includes('BlockPublicPolicy')) {
      console.warn('   Note: If using CloudFront with OAC, this is expected.')
      console.warn('   Your bucket should have "Block all public access" enabled.')
    }
  }
}

// Invalidate CloudFront cache
function invalidateCloudFront() {
  if (!deployConfig.cloudFrontDistributionId) {
    console.log('\n⚠️  CloudFront distribution ID not set, skipping cache invalidation')
    return
  }

  console.log(
    `\n🔄 Invalidating CloudFront cache for distribution: ${deployConfig.cloudFrontDistributionId}`,
  )

  try {
    execSync(
      buildAWSCommand(
        `aws cloudfront create-invalidation --distribution-id ${deployConfig.cloudFrontDistributionId} --paths "/*" --region ${deployConfig.region}`,
      ),
      { stdio: 'inherit' },
    )
    console.log('✅ CloudFront cache invalidation created')
  } catch (error) {
    console.error('❌ Failed to invalidate CloudFront cache')
    console.error(error.message)
    // Don't exit - deployment to S3 was successful
  }
}

// Main deployment function
function deploy() {
  const shouldBuild = process.argv.includes('--build')

  console.log('🚀 Starting deployment to AWS S3 + CloudFront\n')

  // Show which profile is being used
  if (deployConfig.profile) {
    console.log(`📋 Using AWS profile: ${deployConfig.profile}\n`)
  } else {
    console.log('📋 Using default AWS profile\n')
  }

  // Pre-flight checks
  checkAWSCLI()

  // Validate configuration
  if (deployConfig.bucketName === 'your-app-name') {
    console.error('❌ Please configure deploy.config.js with your S3 bucket name')
    console.error('   Or set AWS_S3_BUCKET environment variable')
    process.exit(1)
  }

  // Warn if CloudFront URL is not set (but don't fail - user might be deploying to S3 only)
  if (!deployConfig.cloudFrontUrl) {
    console.warn('⚠️  CloudFront URL not configured')
    console.warn('   Your Cognito redirect URIs will use defaults from .env or localhost')
    console.warn('   Set cloudFrontUrl in deploy.config.js or AWS_CLOUDFRONT_URL env var')
    console.warn('   This is required for authentication to work on CloudFront!\n')
  } else if (
    !deployConfig.cloudFrontUrl.startsWith('http://') &&
    !deployConfig.cloudFrontUrl.startsWith('https://')
  ) {
    console.error('❌ Invalid cloudFrontUrl format in deploy.config.js')
    console.error(`   Current value: ${deployConfig.cloudFrontUrl}`)
    console.error('   Expected format: https://d1234567890.cloudfront.net')
    console.error(
      '   Please update deploy.config.js or set AWS_CLOUDFRONT_URL environment variable',
    )
    process.exit(1)
  }

  // Check AWS credentials availability
  const hasAwsCredentials =
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    deployConfig.profile ||
    existsSync(join(process.env.HOME || '', '.aws', 'credentials'))

  if (!hasAwsCredentials) {
    console.warn('⚠️  AWS credentials not detected')
    console.warn('   Make sure you have:')
    console.warn('   - AWS credentials configured via "aws configure"')
    console.warn('   - Or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables')
    console.warn('   - Or AWS_PROFILE environment variable set')
    console.warn('')
  }

  // Build if requested or if build directory doesn't exist
  const buildPath = join(projectRoot, deployConfig.buildDir)
  if (shouldBuild || !existsSync(buildPath)) {
    if (shouldBuild) {
      console.log('📦 Rebuilding application for production...')
    } else {
      console.log('📦 Build directory not found, building application...')
    }
    buildForProduction()
  } else {
    console.log('📦 Using existing build directory')
    console.log('   💡 Tip: Run "npm run deploy:build" to rebuild with production settings')
  }

  // Deploy
  uploadToS3(buildPath)
  configureS3Bucket()
  invalidateCloudFront()

  console.log('\n✅ Deployment complete!')

  if (deployConfig.cloudFrontDistributionId) {
    console.log(`\n📝 Next steps:`)
    console.log(`   1. Wait for CloudFront invalidation to complete (usually 1-5 minutes)`)
  } else {
    console.log(`\n📝 Next steps:`)
    console.log(`   1. Create a CloudFront distribution for better performance and HTTPS`)
  }
}

// Run deployment
deploy()
