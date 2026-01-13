import { useAuthStore } from '@/stores/auth'
import { awsConfig } from '@/config/aws-config'

export function useImages() {
  const authStore = useAuthStore()
  const imageUrlCache = new Map()

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

    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  // Get a presigned download URL for an S3 object key
  const fetchImageUrl = async (imageKey) => {
    if (!imageKey) return null

    if (imageUrlCache.has(imageKey)) {
      return imageUrlCache.get(imageKey)
    }

    try {
      const response = await authenticatedFetch(`/download-url/${encodeURIComponent(imageKey)}`)
      if (!response.ok) {
        throw new Error(`Failed to get image URL: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      const url = data.downloadUrl || data.url || null
      if (url) {
        imageUrlCache.set(imageKey, url)
      }
      return url
    } catch (err) {
      console.warn('Image URL fetch failed for key:', imageKey, err)
      return null
    }
  }

  // Upload image to S3 via presigned URL, returns the key
  const uploadImage = async (file) => {
    if (!file) throw new Error('No file provided')
    if (!file.type.startsWith('image/')) throw new Error('Please select an image file')

    // Step 1: ask backend for upload URL + key
    const urlResponse = await authenticatedFetch('/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
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
  }

  // Delete image from S3
  const deleteImage = async (imageKey) => {
    if (!imageKey) return

    try {
      const response = await authenticatedFetch(`/delete-image/${encodeURIComponent(imageKey)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Don't throw if image doesn't exist (404) - it's already deleted
        if (response.status === 404) {
          console.warn('Image not found in S3, may have already been deleted:', imageKey)
          return
        }
        throw new Error(`Failed to delete image: ${response.status} ${response.statusText}`)
      }

      // Remove from cache if present
      if (imageUrlCache.has(imageKey)) {
        imageUrlCache.delete(imageKey)
      }

      return true
    } catch (err) {
      console.error('Error deleting image:', err)
      throw err
    }
  }

  return {
    fetchImageUrl,
    uploadImage,
    deleteImage,
  }
}
