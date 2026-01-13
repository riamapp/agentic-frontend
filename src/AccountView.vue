<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useToast } from '@/composables/useToast'
import { useImages } from '@/composables/useImages'
import ConfirmModal from '@/components/ConfirmModal.vue'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { showError, showSuccess } = useToast()
const { uploadImage, fetchImageUrl, deleteImage } = useImages()
const displayNameInput = ref('')
const updatingDisplayName = ref(false)

// Display picture state
const pictureFile = ref(null)
const picturePreview = ref(null)
const pictureFileInputRef = ref(null)
const uploadingPicture = ref(false)
const currentPictureUrl = ref(null)
const showRemovePictureModal = ref(false)
const oauthPictureFailed = ref(false)

// Profile picture upload limits
const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const MAX_PROFILE_PICTURE_DIMENSIONS = 2000 // Max width or height in pixels

// Sync displayNameInput with store
// If displayName is null, the input will be empty, and effectiveDisplayName getter will handle fallback
watch(
  () => preferencesStore.displayName,
  (newValue) => {
    displayNameInput.value = newValue || ''
  },
  { immediate: true },
)

// Load current picture URL when displayPicture changes
watch(
  () => preferencesStore.displayPicture,
  async (newKey) => {
    if (newKey) {
      // Fetch presigned URL for the S3 key
      const url = await fetchImageUrl(newKey)
      currentPictureUrl.value = url
    } else {
      currentPictureUrl.value = null
    }
  },
  { immediate: true },
)

// Also watch for OAuth picture as fallback
watch(
  () => authStore.userPicture,
  (newPicture) => {
    if (!preferencesStore.displayPicture && newPicture) {
      // Reset failed flag when OAuth picture changes (new URL means new picture)
      oauthPictureFailed.value = false
      // Don't set currentPictureUrl for OAuth - let computed property handle it directly
      // This way if it fails, we can properly detect it
    } else if (!newPicture) {
      // OAuth picture was removed
      oauthPictureFailed.value = false
      if (!preferencesStore.displayPicture) {
        currentPictureUrl.value = null
      }
    }
  },
  { immediate: true },
)

// Computed effective picture URL
const effectivePictureUrl = computed(() => {
  if (picturePreview.value) {
    return picturePreview.value
  }
  if (currentPictureUrl.value) {
    return currentPictureUrl.value
  }
  // Only use OAuth picture if it hasn't failed to load
  if (!oauthPictureFailed.value && authStore.userPicture) {
    return authStore.userPicture
  }
  return null
})

// Fallback if the profile image fails to load (e.g., broken OAuth image)
const handlePictureError = (event) => {
  const failedUrl = event.target?.src
  if (!failedUrl) return

  // Check if the failed URL is the OAuth picture
  const isOAuthPicture = authStore.userPicture && failedUrl === authStore.userPicture
  // Check if it's in currentPictureUrl (could be OAuth or S3)
  const isCurrentPicture = currentPictureUrl.value === failedUrl

  if (isOAuthPicture) {
    oauthPictureFailed.value = true
    // Clear currentPictureUrl if it was set to the OAuth URL
    if (isCurrentPicture) {
      currentPictureUrl.value = null
    }
  } else if (isCurrentPicture) {
    // If it's a custom picture (S3) that failed, clear it
    currentPictureUrl.value = null
  }
}

const handleLogout = async () => {
  // logout() will redirect to Cognito and then back to home
  await authStore.logout()
}

const handleDisplayNameChange = async () => {
  if (preferencesStore.loading || updatingDisplayName.value) return

  updatingDisplayName.value = true
  try {
    await preferencesStore.updateDisplayName(displayNameInput.value.trim() || null)
    showSuccess('Display name updated successfully')
  } catch (err) {
    console.error('Failed to update display name:', err)
    showError('Failed to save display name')
    // Revert to stored value on error
    displayNameInput.value = preferencesStore.displayName || ''
  } finally {
    updatingDisplayName.value = false
  }
}

const handlePictureFileChange = async (event) => {
  const file = event.target.files?.[0] || null

  // Clean up previous preview URL
  if (picturePreview.value) {
    URL.revokeObjectURL(picturePreview.value)
    picturePreview.value = null
  }

  pictureFile.value = null

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showError('Please select an image file')
    if (pictureFileInputRef.value) {
      pictureFileInputRef.value.value = ''
    }
    return
  }

  // Validate file size
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    const sizeMB = (MAX_PROFILE_PICTURE_SIZE / (1024 * 1024)).toFixed(0)
    showError(`Image file is too large. Maximum size is ${sizeMB}MB.`)
    if (pictureFileInputRef.value) {
      pictureFileInputRef.value.value = ''
    }
    return
  }

  // Validate image dimensions (optional but recommended)
  try {
    const dimensions = await getImageDimensions(file)
    if (
      dimensions.width > MAX_PROFILE_PICTURE_DIMENSIONS ||
      dimensions.height > MAX_PROFILE_PICTURE_DIMENSIONS
    ) {
      showError(
        `Image dimensions are too large. Maximum size is ${MAX_PROFILE_PICTURE_DIMENSIONS}x${MAX_PROFILE_PICTURE_DIMENSIONS} pixels.`,
      )
      if (pictureFileInputRef.value) {
        pictureFileInputRef.value.value = ''
      }
      return
    }
  } catch (err) {
    console.warn('Could not validate image dimensions:', err)
    // Continue anyway - dimension validation is optional
  }

  // File is valid, set it and create preview
  pictureFile.value = file
  picturePreview.value = URL.createObjectURL(file)
}

// Helper function to get image dimensions
const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const handlePictureUpload = async () => {
  if (!pictureFile.value || uploadingPicture.value) return

  uploadingPicture.value = true
  try {
    // Upload image to S3
    const imageKey = await uploadImage(pictureFile.value)

    // Save the S3 key to preferences
    await preferencesStore.updateDisplayPicture(imageKey)

    // Clear file input and preview
    pictureFile.value = null
    if (picturePreview.value) {
      URL.revokeObjectURL(picturePreview.value)
      picturePreview.value = null
    }
    if (pictureFileInputRef.value) {
      pictureFileInputRef.value.value = ''
    }

    showSuccess('Profile picture updated successfully')
  } catch (err) {
    console.error('Failed to upload picture:', err)
    showError('Failed to upload profile picture')
  } finally {
    uploadingPicture.value = false
  }
}

const handlePictureRemoveClick = () => {
  if (uploadingPicture.value) return
  showRemovePictureModal.value = true
}

const handlePictureRemoveConfirm = async () => {
  uploadingPicture.value = true
  try {
    // Get the current S3 key before removing it from preferences
    const currentImageKey = preferencesStore.displayPicture

    // Update preferences first to clear the reference
    await preferencesStore.updateDisplayPicture(null)

    // Then delete the image from S3
    if (currentImageKey) {
      try {
        await deleteImage(currentImageKey)
      } catch (deleteErr) {
        // Log error but don't fail the operation - preference is already updated
        console.warn('Failed to delete image from S3, but preference was updated:', deleteErr)
      }
    }

    showSuccess('Profile picture removed')
  } catch (err) {
    console.error('Failed to remove picture:', err)
    showError('Failed to remove profile picture')
  } finally {
    uploadingPicture.value = false
  }
}

const handlePictureRemoveCancel = () => {
  // Modal will close automatically
}

const handleThemeChange = async (theme) => {
  if (preferencesStore.loading) return

  try {
    await preferencesStore.updateTheme(theme)
    const themeName = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'
    showSuccess(`Theme updated to ${themeName}`)
  } catch (err) {
    console.error('Failed to update theme:', err)
    showError('Failed to save theme preference')
  }
}

// Clean up preview URLs on unmount
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await preferencesStore.loadPreferences()
  }
})

// Cleanup preview URLs on unmount
onBeforeUnmount(() => {
  if (picturePreview.value) {
    URL.revokeObjectURL(picturePreview.value)
  }
})
</script>

<template>
  <div class="card bg-body-tertiary">
    <div class="card-body">
      <h1 class="card-title">Account</h1>

      <div v-if="authStore.isAuthenticated">
        <p v-if="authStore.userEmail"><strong>Email:</strong> {{ authStore.userEmail }}</p>

        <div class="mb-3 mt-4">
          <label for="display-name" class="form-label d-block mb-2"
            ><strong>Display Name</strong></label
          >
          <div class="input-group">
            <input
              id="display-name"
              type="text"
              class="form-control"
              v-model="displayNameInput"
              @blur="handleDisplayNameChange"
              @keyup.enter="handleDisplayNameChange"
              :placeholder="authStore.userOAuthName || 'Enter your display name'"
              :disabled="preferencesStore.loading || updatingDisplayName"
            />
            <button
              class="btn btn-secondary"
              type="button"
              @click="handleDisplayNameChange"
              :disabled="preferencesStore.loading || updatingDisplayName"
            >
              <span
                v-if="updatingDisplayName"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span v-else>Save</span>
            </button>
          </div>
          <small class="form-text text-muted d-block mt-1">
            <span v-if="preferencesStore.effectiveDisplayName">
              Currently displaying: <strong>{{ preferencesStore.effectiveDisplayName }}</strong>
            </span>
            <span v-else-if="authStore.userOAuthName"
              >Leave empty to use your OAuth name ({{ authStore.userOAuthName }})</span
            >
            <span v-else>Enter a display name to customize how your name appears</span>
          </small>
          <small
            v-if="authStore.userOAuthName && !preferencesStore.displayName"
            class="form-text text-muted d-block mt-1"
          >
            <i class="bi bi-info-circle"></i> Using name from your OAuth provider ({{
              authStore.userOAuthName
            }}). You can customize it above.
          </small>
        </div>

        <div class="mb-3 mt-4">
          <label class="form-label d-block mb-2"><strong>Profile Picture</strong></label>
          <div class="d-flex align-items-center gap-3 mb-3">
            <div
              class="d-flex align-items-center justify-content-center flex-shrink-0"
              style="width: 100px; height: 100px"
            >
              <img
                v-if="effectivePictureUrl"
                :src="effectivePictureUrl"
                alt="Profile picture"
                class="rounded-circle border border-2 border-secondary"
                style="width: 100px; height: 100px; object-fit: cover"
                @error="handlePictureError"
              />
              <i v-else class="bi bi-person-circle" style="font-size: 100px; color: #6c757d"></i>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-2">
                <input
                  id="display-picture"
                  name="display-picture"
                  ref="pictureFileInputRef"
                  type="file"
                  accept="image/*"
                  class="form-control form-control-sm"
                  @change="handlePictureFileChange"
                  :disabled="preferencesStore.loading || uploadingPicture"
                />
                <button
                  v-if="pictureFile"
                  class="btn btn-sm btn-primary"
                  type="button"
                  @click="handlePictureUpload"
                  :disabled="preferencesStore.loading || uploadingPicture"
                >
                  <span
                    v-if="uploadingPicture"
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span v-else>Upload</span>
                </button>
                <button
                  v-if="preferencesStore.displayPicture"
                  class="btn btn-sm btn-danger"
                  type="button"
                  @click="handlePictureRemoveClick"
                  :disabled="preferencesStore.loading || uploadingPicture"
                >
                  Remove
                </button>
              </div>
              <small class="form-text text-muted d-block">
                <span v-if="preferencesStore.displayPicture"
                  >Using your custom profile picture</span
                >
                <span v-else-if="authStore.userPicture"
                  >Using picture from your OAuth provider. Upload a custom picture above.</span
                >
                <span v-else>Upload a custom profile picture</span>
              </small>
            </div>
          </div>
        </div>

        <div class="mb-3 mt-4">
          <label class="form-label d-block mb-2"><strong>Theme</strong></label>
          <div class="btn-group" role="group" aria-label="Theme selection">
            <input
              type="radio"
              class="btn-check"
              name="theme"
              id="theme-light"
              value="light"
              :checked="(preferencesStore.theme || 'system') === 'light'"
              @change="handleThemeChange('light')"
              :disabled="preferencesStore.loading"
            />
            <label class="btn btn-secondary" for="theme-light">
              <i class="bi bi-sun"></i> Light
            </label>

            <input
              type="radio"
              class="btn-check"
              name="theme"
              id="theme-dark"
              value="dark"
              :checked="(preferencesStore.theme || 'system') === 'dark'"
              @change="handleThemeChange('dark')"
              :disabled="preferencesStore.loading"
            />
            <label class="btn btn-secondary" for="theme-dark">
              <i class="bi bi-moon"></i> Dark
            </label>

            <input
              type="radio"
              class="btn-check"
              name="theme"
              id="theme-system"
              value="system"
              :checked="(preferencesStore.theme || 'system') === 'system'"
              @change="handleThemeChange('system')"
              :disabled="preferencesStore.loading"
            />
            <label class="btn btn-secondary" for="theme-system">
              <i class="bi bi-circle-half"></i> System
            </label>
          </div>
          <small class="form-text text-muted d-block mt-2"
            >System follows your operating system's theme preference</small
          >
        </div>

        <button @click="handleLogout" class="btn btn-danger mt-3 d-block ms-auto">Logout</button>
      </div>
      <div v-else>
        <p>Not authenticated</p>
      </div>
    </div>
  </div>

  <!-- Remove Picture Confirmation Modal -->
  <ConfirmModal
    :show="showRemovePictureModal"
    @update:show="showRemovePictureModal = $event"
    title="Remove Profile Picture"
    message="Are you sure you want to remove your custom profile picture? This will delete the image and revert to your OAuth provider picture."
    confirm-text="Remove"
    cancel-text="Cancel"
    variant="danger"
    @confirm="handlePictureRemoveConfirm"
    @cancel="handlePictureRemoveCancel"
  />
</template>

<style scoped></style>
