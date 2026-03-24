import { useEffect, useRef, useState } from 'react'

function useVoiceSearch({ onTranscript, onUnsupported, onError, lang = 'en-IN' }) {
  const recognitionRef = useRef(null)
  const transcriptHandlerRef = useRef(onTranscript)
  const unsupportedHandlerRef = useRef(onUnsupported)
  const errorHandlerRef = useRef(onError)
  const [isListening, setIsListening] = useState(false)
  const isSupported =
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    transcriptHandlerRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    unsupportedHandlerRef.current = onUnsupported
  }, [onUnsupported])

  useEffect(() => {
    errorHandlerRef.current = onError
  }, [onError])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const VoiceRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!VoiceRecognition) {
      recognitionRef.current = null
      return undefined
    }

    const recognition = new VoiceRecognition()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim()

      if (transcript) {
        transcriptHandlerRef.current?.(transcript)
      }
    }
    recognition.onerror = (event) => {
      setIsListening(false)
      errorHandlerRef.current?.(event.error)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [lang])

  const startListening = () => {
    if (!recognitionRef.current) {
      unsupportedHandlerRef.current?.()
      return
    }

    try {
      recognitionRef.current.start()
    } catch {
      errorHandlerRef.current?.('busy')
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  }
}

export default useVoiceSearch
