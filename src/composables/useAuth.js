import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { awsConfig } from '@/config/aws-config'

const client = new CognitoIdentityProviderClient({
  region: awsConfig.region,
})

/**
 * Composable for authentication operations with AWS Cognito
 */
export function useAuth() {
  // Helper to normalize domain (remove protocol if present)
  const normalizeDomain = (domain) => {
    if (!domain) return domain
    return domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  // Generate the hosted UI login URL
  const getLoginUrl = () => {
    const domain = normalizeDomain(awsConfig.domain)

    if (!domain) {
      console.error('VITE_COGNITO_DOMAIN is not set in environment variables')
      throw new Error(
        'Cognito domain is not configured. Please set VITE_COGNITO_DOMAIN in your .env file',
      )
    }

    if (!awsConfig.clientId) {
      console.error('VITE_COGNITO_CLIENT_ID is not set in environment variables')
      throw new Error(
        'Cognito client ID is not configured. Please set VITE_COGNITO_CLIENT_ID in your .env file',
      )
    }

    const params = new URLSearchParams({
      client_id: awsConfig.clientId,
      response_type: 'code',
      scope: 'openid email profile aws.cognito.signin.user.admin',
      redirect_uri: awsConfig.redirectUri,
    })

    const url = `https://${domain}/oauth2/authorize?${params.toString()}`
    console.log('Login URL:', url) // Debug log
    return url
  }

  // Generate the hosted UI logout URL
  const getLogoutUrl = () => {
    const domain = normalizeDomain(awsConfig.domain)

    if (!domain) {
      console.error('VITE_COGNITO_DOMAIN is not set in environment variables')
      throw new Error(
        'Cognito domain is not configured. Please set VITE_COGNITO_DOMAIN in your .env file',
      )
    }

    if (!awsConfig.clientId) {
      console.error('VITE_COGNITO_CLIENT_ID is not set in environment variables')
      throw new Error(
        'Cognito client ID is not configured. Please set VITE_COGNITO_CLIENT_ID in your .env file',
      )
    }

    // Build logout URL - URLSearchParams automatically URL-encodes values
    const params = new URLSearchParams({
      client_id: awsConfig.clientId,
      logout_uri: awsConfig.signOutUri,
    })

    const url = `https://${domain}/logout?${params.toString()}`
    console.log('Logout URL:', url) // Debug log
    console.log('Sign-out URI:', awsConfig.signOutUri) // Debug log
    return url
  }

  // Exchange authorization code for tokens
  const exchangeCodeForTokens = async (code) => {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: awsConfig.clientId,
        code: code,
        redirect_uri: awsConfig.redirectUri,
      })

      const domain = normalizeDomain(awsConfig.domain)

      const tokenUrl = `https://${domain}/oauth2/token`
      console.log('Token exchange URL:', tokenUrl)
      console.log('Redirect URI:', awsConfig.redirectUri)

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token exchange failed:', response.status, errorText)
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return {
        accessToken: data.access_token,
        idToken: data.id_token,
        refreshToken: data.refresh_token,
      }
    } catch (error) {
      console.error('Token exchange error:', error)
      throw new Error(error.message || 'Token exchange failed')
    }
  }

  // Refresh access and ID tokens using refresh token
  const refreshTokens = async (refreshToken) => {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: awsConfig.clientId,
        refresh_token: refreshToken,
      })

      const domain = normalizeDomain(awsConfig.domain)

      const tokenUrl = `https://${domain}/oauth2/token`
      console.log('Refreshing tokens...')

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token refresh failed:', response.status, errorText)
        throw new Error(`Failed to refresh tokens: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return {
        accessToken: data.access_token,
        idToken: data.id_token,
        refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      throw new Error(error.message || 'Token refresh failed')
    }
  }

  // Parse user attributes
  const parseAttributes = (attributes) => {
    const parsed = {}
    attributes?.forEach((attr) => {
      parsed[attr.Name] = attr.Value
    })
    return parsed
  }

  // Get user info using access token
  const getUser = async (accessToken) => {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      })
      const response = await client.send(command)

      return {
        username: response.Username,
        attributes: parseAttributes(response.UserAttributes),
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to get user')
    }
  }

  // Logout (call Cognito logout endpoint, then sign out from client)
  const logout = async (accessToken) => {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      })
      await client.send(command)
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with local logout even if API call fails
    }
  }

  // Decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      return null
    }
  }

  return {
    getLoginUrl,
    getLogoutUrl,
    exchangeCodeForTokens,
    refreshTokens,
    getUser,
    logout,
    decodeToken,
  }
}
