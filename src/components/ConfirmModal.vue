<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirm',
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  variant: {
    type: String,
    default: 'danger', // 'danger', 'warning', 'primary', etc.
  },
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

const modalElement = ref(null)
let bsModal = null

const initializeModal = async () => {
  if (!modalElement.value) {
    await nextTick()
    if (!modalElement.value) return false
  }

  if (!bsModal) {
    try {
      bsModal = new Modal(modalElement.value, {
        backdrop: true,
        keyboard: true,
      })

      // Listen for hidden event to sync state
      modalElement.value.addEventListener('hidden.bs.modal', () => {
        emit('update:show', false)
      })
    } catch (error) {
      console.error('Error creating Bootstrap modal:', error)
      return false
    }
  }

  return true
}

onMounted(async () => {
  await nextTick()
  await initializeModal()

  // If modal should be shown on mount, show it
  if (props.show && bsModal) {
    bsModal.show()
  }
})

watch(
  () => props.show,
  async (newValue) => {
    // Ensure modal is initialized
    if (!bsModal) {
      const initialized = await initializeModal()
      if (!initialized) {
        console.error('Failed to initialize Bootstrap modal')
        return
      }
    }

    if (newValue) {
      bsModal.show()
    } else {
      bsModal.hide()
    }
  },
)

const handleConfirm = () => {
  emit('confirm')
  emit('update:show', false)
  if (bsModal) {
    bsModal.hide()
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
  if (bsModal) {
    bsModal.hide()
  }
}
</script>

<template>
  <div
    ref="modalElement"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-labelledby="confirmModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="confirmModalLabel">{{ title }}</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="handleCancel"></button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button type="button" :class="`btn btn-${variant}`" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
