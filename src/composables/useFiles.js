import { useAuthStore } from '@/stores/auth'
import { awsConfig } from '@/config/aws-config'

export function useFiles() {
  // Upload file to S3 via presigned URL, returns the key
  const uploadFile = async (file, studentId) => {
    const authStore = useAuthStore()

    if (!file) throw new Error('No file provided')
    if (!studentId) throw new Error('Student ID is required')

    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    try {
      if (!awsConfig.apiGatewayUrl) {
        throw new Error(
          'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
        )
      }

      // Step 1: Request presigned URL from backend
      const url = `${awsConfig.agentApiGatewayUrl}/feedback/upload-url`
      const urlResponse = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          studentId: studentId,
        }),
      })

      if (!urlResponse.ok) {
        const errorText = await urlResponse.text().catch(() => '')
        const errorMessage = errorText || `HTTP ${urlResponse.status} ${urlResponse.statusText}`
        console.error('Failed to get upload URL:', urlResponse.status, errorMessage)
        throw new Error(`Failed to get upload URL: ${urlResponse.status} - ${errorMessage}`)
      }

      const { uploadUrl, key } = await urlResponse.json()
      if (!uploadUrl || !key) {
        throw new Error('Invalid upload URL response')
      }

      // Step 2: Upload file directly to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => '')
        const errorMessage = errorText || `HTTP ${uploadResponse.status} ${uploadResponse.statusText}`
        console.error('Failed to upload file to S3:', uploadResponse.status, errorMessage)
        throw new Error(`Failed to upload file to S3: ${uploadResponse.status} - ${errorMessage}`)
      }

      return key
    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    }
  }

  // Get a presigned download URL for an S3 object key
  const fetchFileUrl = async (fileKey) => {
    const authStore = useAuthStore()

    if (!fileKey) return null

    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    try {
      if (!awsConfig.apiGatewayUrl) {
        throw new Error(
          'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
        )
      }

      const url = `${awsConfig.apiGatewayUrl}/download-url/${encodeURIComponent(fileKey)}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
        console.error('Failed to get file URL:', response.status, errorMessage)
        throw new Error(`Failed to get file URL: ${response.status} - ${errorMessage}`)
      }

      const data = await response.json()
      return data.downloadUrl || data.url || null
    } catch (err) {
      console.error('Error fetching file URL:', err)
      return null
    }
  }

  // Delete file from S3
  const deleteFile = async (fileKey) => {
    const authStore = useAuthStore()

    if (!fileKey) return

    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    try {
      if (!awsConfig.apiGatewayUrl) {
        throw new Error(
          'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
        )
      }

      const url = `${awsConfig.apiGatewayUrl}/delete-image/${encodeURIComponent(fileKey)}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Don't throw if file doesn't exist (404) - it's already deleted
        if (response.status === 404) {
          console.warn('File not found in S3, may have already been deleted:', fileKey)
          return true
        }
        const errorText = await response.text().catch(() => '')
        const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
        console.error('Failed to delete file:', response.status, errorMessage)
        throw new Error(`Failed to delete file: ${response.status} - ${errorMessage}`)
      }

      return true
    } catch (err) {
      console.error('Error deleting file:', err)
      throw err
    }
  }

  // Get feedback for a file
  const getFeedback = async (fileKey, studentId) => {
    const authStore = useAuthStore()

    if (!fileKey) throw new Error('No file key provided')
    if (!studentId) throw new Error('Student ID is required')

    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    try {
      if (!awsConfig.apiGatewayUrl) {
        throw new Error(
          'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
        )
      }

      const url = `${awsConfig.apiGatewayUrl}/student/getFeedback`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey: fileKey,
          student_id: studentId,
        }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // No feedback available yet
        }
        const errorText = await response.text().catch(() => '')
        const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
        console.error('Failed to get feedback:', response.status, errorMessage)
        throw new Error(`Failed to get feedback: ${response.status} - ${errorMessage}`)
      }

      const data = await response.json()
      return data.feedback || data
    } catch (err) {
      console.error('Error fetching feedback:', err)
      throw err
    }
  }

  // List user's uploaded files
  const listFiles = async (studentId) => {
    const authStore = useAuthStore()

    if (!studentId) throw new Error('Student ID is required')

    const accessToken = await authStore.getAccessToken()

    if (!accessToken) {
      throw new Error('No access token available')
    }

    try {
      if (!awsConfig.apiGatewayUrl) {
        throw new Error(
          'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
        )
      }

      const url = `${awsConfig.apiGatewayUrl}/files`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
        console.error('Failed to list files:', response.status, errorMessage)
        throw new Error(`Failed to list files: ${response.status} - ${errorMessage}`)
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
