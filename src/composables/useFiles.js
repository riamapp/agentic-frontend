import { useAuthStore } from '@/stores/auth'
import { awsConfig } from '@/config/aws-config'

export function useFiles() {
  const authStore = useAuthStore()

  // Helper to make authenticated API requests to agent API gateway
  const authenticatedAgentFetch = async (endpoint, options = {}) => {
    // Check if Agent API Gateway URL is configured
    if (!awsConfig.agentApiGatewayUrl) {
      throw new Error(
        'Agent API Gateway URL is not configured. Please set VITE_AGENT_API_GATEWAY_URL in your .env file',
      )
    }

    // Ensure token is valid before making request
    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    const url = `${awsConfig.agentApiGatewayUrl}${endpoint}`
    console.log(`Making API request to: ${url}`)

    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  // Helper to make authenticated API requests to user API gateway
  const authenticatedUserFetch = async (endpoint, options = {}) => {
    // Check if API Gateway URL is configured
    if (!awsConfig.apiGatewayUrl) {
      throw new Error(
        'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
      )
    }

    // Ensure token is valid before making request
    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    const url = `${awsConfig.apiGatewayUrl}${endpoint}`
    console.log(`Making API request to: ${url}`)

    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  // Upload file to S3 via presigned URL, returns the key (same pattern as useImages.js)
  const uploadFile = async (file, studentId) => {
    if (!file) throw new Error('No file provided')
    if (!studentId) throw new Error('Student ID is required')

    try {
      // Step 1: ask backend for upload URL + key
      const urlResponse = await authenticatedAgentFetch('/feedback/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          student_id: studentId,
        }),
      })

      if (!urlResponse.ok) {
        const text = await urlResponse.text().catch(() => '')
        throw new Error(
          text || `Failed to get upload URL: ${urlResponse.status} ${urlResponse.statusText}`,
        )
      }

      const { uploadUrl, key } = await urlResponse.json()
      if (!uploadUrl || !key) {
        throw new Error('Invalid upload URL response')
      }

      // Step 2: PUT the file to S3 using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => '')
        throw new Error(
          text || `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`,
        )
      }

      return key
    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    }
  }

  // Get a presigned download URL for an S3 object key
  const fetchFileUrl = async (fileKey) => {
    if (!fileKey) return null

    try {
      const response = await authenticatedUserFetch(`/download-url/${encodeURIComponent(fileKey)}`)
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
      const response = await authenticatedUserFetch(`/delete-image/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Don't throw if file doesn't exist (404) - it's already deleted
        if (response.status === 404) {
          console.warn('File not found in S3, may have already been deleted:', fileKey)
          return true
        }
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (err) {
      console.error('Error deleting file:', err)
      throw err
    }
  }

  // Get feedback for a specific file
  const getFeedback = async (fileKey, studentId) => {
    if (!fileKey) throw new Error('No file key provided')
    if (!studentId) throw new Error('Student ID is required')

    try {
      // Use GET request with file key as path parameter
      // Encode the fileKey to handle special characters in the path
      const encodedFileKey = encodeURIComponent(fileKey)
      const response = await authenticatedAgentFetch(`/feedback/${encodedFileKey}`, {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // No feedback available yet
        }
        const text = await response.text().catch(() => '')
        throw new Error(
          text || `Failed to get feedback: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()
      
      // Check if the response contains a downloadUrl with a presigned URL
      const downloadUrl = data.downloadUrl || data.download_url || (data.feedback && data.feedback.downloadUrl) || (data.feedback && data.feedback.download_url)
      
      if (downloadUrl) {
        try {
          // Fetch the actual content from the presigned URL
          const contentResponse = await fetch(downloadUrl)
          if (!contentResponse.ok) {
            throw new Error(`Failed to fetch content from downloadUrl: ${contentResponse.status} ${contentResponse.statusText}`)
          }
          
          // Get the content as text
          const content = await contentResponse.text()
          
          // Try to parse as JSON if it looks like JSON
          try {
            return JSON.parse(content)
          } catch {
            // Not JSON, return as text
            return content
          }
        } catch (err) {
          console.error('Failed to fetch feedback content from downloadUrl:', err)
          throw new Error(`Failed to fetch feedback content: ${err.message}`)
        }
      }

      // If no downloadUrl found, return the data as-is
      return data.feedback || data
    } catch (err) {
      console.error('Error fetching feedback:', err)
      throw err
    }
  }

  // List user's uploaded files
  const listFiles = async (studentId) => {
    if (!studentId) throw new Error('Student ID is required')

    try {
      // Use GET request with query parameters
      const params = new URLSearchParams({
        student_id: studentId,
      })
      const response = await authenticatedAgentFetch(`/feedback?${params.toString()}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Failed to list files: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.files || data || []
    } catch (err) {
      console.error('Error listing files:', err)
      throw err
    }
  }

  // Download file content from S3 using presigned URL
  const downloadFileContent = async (fileKey, fileName = null) => {
    if (!fileKey) throw new Error('No file key provided')

    try {
      // Get presigned download URL
      const downloadUrl = await fetchFileUrl(fileKey)
      if (!downloadUrl) {
        throw new Error('Failed to get download URL')
      }

      // Fetch the file content
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }

      // Get the file as a blob
      const blob = await response.blob()

      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob)

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName || fileKey.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)

      return blob
    } catch (err) {
      console.error('Error downloading file content:', err)
      throw err
    }
  }

  // Get file content as text (for text-based files)
  const getFileContentAsText = async (fileKey) => {
    if (!fileKey) throw new Error('No file key provided')

    try {
      const downloadUrl = await fetchFileUrl(fileKey)
      if (!downloadUrl) {
        throw new Error('Failed to get download URL')
      }

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      return await response.text()
    } catch (err) {
      console.error('Error fetching file content as text:', err)
      throw err
    }
  }

  // Get file content as blob (for binary files, images, etc.)
  const getFileContentAsBlob = async (fileKey) => {
    if (!fileKey) throw new Error('No file key provided')

    try {
      const downloadUrl = await fetchFileUrl(fileKey)
      if (!downloadUrl) {
        throw new Error('Failed to get download URL')
      }

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      return await response.blob()
    } catch (err) {
      console.error('Error fetching file content as blob:', err)
      throw err
    }
  }

  return {
    uploadFile,
    fetchFileUrl,
    deleteFile,
    getFeedback,
    listFiles,
    downloadFileContent,
    getFileContentAsText,
    getFileContentAsBlob,
  }
}
