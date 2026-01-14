import { useAuthStore } from '@/stores/auth'
import { awsConfig } from '@/config/aws-config'

export function useFiles() {
  const authStore = useAuthStore()

  // Helper to make authenticated API requests
  const authenticatedFetch = async (endpoint, options = {}) => {
    // Check if API Gateway URL is configured
    if (!awsConfig.apiGatewayUrl) {
      throw new Error(
        'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
      )
    }

    // Ensure token is valid before making request
    const accessToken = await authStore.getAccessToken()

    const url = `${awsConfig.apiGatewayUrl}${endpoint}`
    console.log(`Making API request to: ${url}`)

    // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    }

    // Only set Content-Type to application/json if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  // Upload file to S3 via presigned URL, returns the key
  const uploadFile = async (file) => {
    if (!file) throw new Error('No file provided')

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)

    // Upload file directly to backend endpoint
    const uploadResponse = await authenticatedFetch('/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text().catch(() => '')
      throw new Error(
        text || `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`,
      )
    }

    const data = await uploadResponse.json()
    // Return the key from response (adjust based on your API response structure)
    return data.key || data.fileKey || data.id
  }

  // Get a presigned download URL for an S3 object key
  const fetchFileUrl = async (fileKey) => {
    if (!fileKey) return null

    try {
      const response = await authenticatedFetch(`/download-url/${encodeURIComponent(fileKey)}`)
      if (!response.ok) {
        throw new Error(`Failed to get file URL: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      return data.downloadUrl || data.url || null
    } catch (err) {
      console.warn('File URL fetch failed for key:', fileKey, err)
      return null
    }
  }

  // Delete file from S3
  const deleteFile = async (fileKey) => {
    if (!fileKey) return

    try {
      const response = await authenticatedFetch(`/delete-image/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Don't throw if file doesn't exist (404) - it's already deleted
        if (response.status === 404) {
          console.warn('File not found in S3, may have already been deleted:', fileKey)
          return
        }
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (err) {
      console.error('Error deleting file:', err)
      throw err
    }
  }

  // Get feedback for a file from S3
  const getFeedback = async (fileKey) => {
    if (!fileKey) throw new Error('No file key provided')

    try {
      const response = await authenticatedFetch(`/student/getFeedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey: fileKey,
        }),
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null // No feedback available yet
        }
        throw new Error(`Failed to get feedback: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.feedback || data
    } catch (err) {
      console.error('Error fetching feedback:', err)
      throw err
    }
  }

  // List user's uploaded files
  const listFiles = async () => {
    try {
      const response = await authenticatedFetch('/files')
      
      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.files || data || []
    } catch (err) {
      console.error('Error listing files:', err)
      throw err
    }
  }

  return {
    uploadFile,
    fetchFileUrl,
    deleteFile,
    getFeedback,
    listFiles,
  }
}
