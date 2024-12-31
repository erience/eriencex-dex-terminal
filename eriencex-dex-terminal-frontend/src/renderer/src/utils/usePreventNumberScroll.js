import { useEffect } from 'react'

const usePreventNumberInputScroll = () => {
  useEffect(() => {
    const handleWheel = (event) => {
      const target = event.target

      if (target && target.tagName === 'INPUT') {
        const inputType = target.getAttribute('type')
        if (inputType === 'number') {
          if (document.activeElement === target) {
            event.preventDefault()
          }
        }
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      document.removeEventListener('wheel', handleWheel, { passive: false })
    }
  }, [])
}

export default usePreventNumberInputScroll
