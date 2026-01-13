// Helper to normalize domain (remove protocol if present)
const normalizeDomain = (domain) => {
  if (!domain) return domain
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/**
 * Determine the frontend identifier based on the current URL.
 * This is used to route OAuth callbacks to the correct frontend URL.
 *
 * @returns {string} The frontend identifier (e.g., 'local', 'test', 'prod')
 */
export const getFrontendIdentifier = () => {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return 'local' // Default for SSR
  }

  const hostname = window.location.hostname
  const href = window.location.href

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return 'local'
  }

  // Check for test environment (could be a subdomain or specific domain)
  // You can customize this logic based on your deployment setup
  if (hostname.includes('d1dmh1twu37gjj')) {
    return 'test'
  }

  // Check for production (could be a specific domain or CloudFront URL)
  // Default to 'prod' for any other environment
  // You can add more specific checks here if needed
  if (hostname.includes('prod') || hostname.includes('production')) {
    return 'prod'
  }

  // If there's a VITE_FRONTEND_IDENTIFIER env var, use it (for explicit configuration)
  if (import.meta.env.VITE_FRONTEND_IDENTIFIER) {
    return import.meta.env.VITE_FRONTEND_IDENTIFIER
  }

  // Default fallback: try to infer from URL patterns
  // For CloudFront or custom domains, you might want to set VITE_FRONTEND_IDENTIFIER explicitly
  return 'local' // Default fallback
}

export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  domain: normalizeDomain(import.meta.env.VITE_COGNITO_DOMAIN),
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  signOutUri: import.meta.env.VITE_SIGN_OUT_URI || 'http://localhost:5173',
  apiGatewayUrl: import.meta.env.VITE_USER_API_GATEWAY_URL,
  agentApiGatewayUrl: import.meta.env.VITE_AGENT_API_GATEWAY_URL,
  jobsApiGatewayUrl: import.meta.env.VITE_JOBS_API_GATEWAY_URL,
  websocketApiEndpoint: import.meta.env.VITE_WEBSOCKET_API_ENDPOINT,
}

// Debug logging (remove in production)
if (import.meta.env.DEV) {
  console.log('Environment variables check:', {
    VITE_AWS_REGION: import.meta.env.VITE_AWS_REGION,
    VITE_COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID ? 'set' : 'NOT SET',
    VITE_COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID ? 'set' : 'NOT SET',
    VITE_COGNITO_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN ? 'set' : 'NOT SET',
    VITE_REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI,
    VITE_SIGN_OUT_URI: import.meta.env.VITE_SIGN_OUT_URI,
    VITE_USER_API_GATEWAY_URL: import.meta.env.VITE_USER_API_GATEWAY_URL ? 'set' : 'NOT SET',
    VITE_AGENT_API_GATEWAY_URL: import.meta.env.VITE_AGENT_API_GATEWAY_URL ? 'set' : 'NOT SET',
    VITE_JOBS_API_GATEWAY_URL: import.meta.env.VITE_JOBS_API_GATEWAY_URL ? 'set' : 'NOT SET',
    VITE_WEBSOCKET_API_ENDPOINT: import.meta.env.VITE_WEBSOCKET_API_ENDPOINT ? 'set' : 'NOT SET',
  })
  console.log('AWS Config loaded:', {
    region: awsConfig.region,
    domain: awsConfig.domain || 'NOT SET',
    clientId: awsConfig.clientId ? `${awsConfig.clientId.substring(0, 10)}...` : 'NOT SET',
    redirectUri: awsConfig.redirectUri,
  })
}
