import { ref, nextTick } from 'vue'

const toasts = ref([])

const removeToast = (id) => {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const showToast = async (message, type = 'danger', duration = 5000) => {
  const id = Date.now() + Math.random()
  const toast = {
    id,
    message,
    type, // 'success', 'danger', 'warning', 'info'
    duration,
  }

  console.log('Adding toast:', toast)
  toasts.value.push(toast)
  console.log('Toasts array length:', toasts.value.length)

  // Initialize Bootstrap toast after DOM update
  await nextTick()
  // Use requestAnimationFrame to ensure DOM is fully rendered (event-driven instead of timeout)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const toastElement = document.querySelector(`[data-toast-id="${id}"]`)
      if (!toastElement) {
        console.warn('Toast element not found in DOM for id:', id)
        return
      }

      // Bootstrap is available globally when imported as bundle
      // Try multiple ways to access Bootstrap
      let Bootstrap = null
      if (typeof window !== 'undefined') {
        Bootstrap = window.bootstrap
      }
      if (!Bootstrap && typeof bootstrap !== 'undefined') {
        Bootstrap = bootstrap
      }

      console.log(
        'Bootstrap available:',
        !!Bootstrap,
        'Toast available:',
        !!(Bootstrap && Bootstrap.Toast),
      )

      if (Bootstrap && Bootstrap.Toast) {
        try {
          const bsToast = new Bootstrap.Toast(toastElement, {
            autohide: true,
            delay: duration,
          })
          bsToast.show()
          console.log('Bootstrap toast shown')

          // Remove from our array when Bootstrap toast is hidden
          toastElement.addEventListener(
            'hidden.bs.toast',
            () => {
              removeToast(id)
            },
            { once: true },
          )
          return
        } catch (error) {
          console.error('Error initializing Bootstrap toast:', error)
        }
      }

      // Fallback: show manually with CSS classes
      console.log('Using fallback toast display')
      toastElement.classList.add('show')
      if (duration > 0) {
        setTimeout(() => {
          toastElement.classList.remove('show')
          setTimeout(() => removeToast(id), 300)
        }, duration)
      }
    })
  })

  return id
}

export function useToast() {
  const showSuccess = (message, duration) => showToast(message, 'success', duration)
  const showError = (message, duration) => showToast(message, 'danger', duration)
  const showWarning = (message, duration) => showToast(message, 'warning', duration)
  const showInfo = (message, duration) => showToast(message, 'info', duration)

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  }
}
