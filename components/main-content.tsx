"use client"
import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Mic, Upload, Languages, X } from "lucide-react"

const SUPPORTED_LANGUAGES = [
  { code: "hi-IN", name: "Hindi", sttCode: "hi" },
  { code: "ta-IN", name: "Tamil", sttCode: "ta" },
  { code: "te-IN", name: "Telugu", sttCode: "te" },
  { code: "kn-IN", name: "Kannada", sttCode: "kn" },
  { code: "ml-IN", name: "Malayalam", sttCode: "ml" },
  { code: "mr-IN", name: "Marathi", sttCode: "mr" },
  { code: "gu-IN", name: "Gujarati", sttCode: "gu" },
  { code: "bn-IN", name: "Bengali", sttCode: "bn" },
  { code: "pa-IN", name: "Punjabi", sttCode: "pa" },
  { code: "or-IN", name: "Odia", sttCode: "or" },
]

export function MainContent() {
  const [isRecording, setIsRecording] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [transcription, setTranscription] = useState("")
  const [translation, setTranslation] = useState(null)
  const [inputLanguage, setInputLanguage] = useState("en-IN")
  const [targetLanguage, setTargetLanguage] = useState(SUPPORTED_LANGUAGES[0].code)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
    handleTranscription(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" })
        const audioFile = new File([audioBlob], "recorded-audio.wav", { type: "audio/wav" })
        setFiles((prev) => [...prev, audioFile])
        handleTranscription(audioFile)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      // setError("Error accessing microphone. Please check your permissions.")
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  const handleTranscription = async (audioFile: File) => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      const form = new FormData()
      form.append("model", "saarika:v2")
      form.append("language_code", inputLanguage)
      form.append("with_timestamps", "false")
      form.append("with_diarization", "false")
      form.append("file", audioFile)

      const response = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": "05fb22a5-db3f-478a-8669-de63cf46fda5",
        },
        body: form,
      })

      if (!response.ok) {
        console.log("transcription failed")
        // throw new Error(`Transcription failed: ${response.statusText}`)
      }

      setProgress(50)
      const data = await response.json()
      setTranscription(data.transcript)
      await translateResponse(data.transcript)
      setProgress(100)
    } catch (error: any) {
      // setError(`Error: ${error.message}`)
      console.error("Transcription error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const translateResponse = async (input: string) => {
    try {
      const response = await fetch("https://api.sarvam.ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": "609361f5-3167-4583-bcc3-f2c0e4a6f7bd",
        },
        body: JSON.stringify({
          input,
          source_language_code: "en-IN",
          target_language_code: targetLanguage,
          speaker_gender: "Male",
          mode: "formal",
          model: "mayura:v1",
          enable_preprocessing: true,
        }),
      })

      if (!response.ok) {
        console.log("translation failed")
        // throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      setTranslation(data.translated_text)

      // Now trigger text-to-speech for the translated text
      textToSpeech(data.translated_text)

    } catch (error: any) {
      // setError(`Translation error: ${error.message}`)
      console.error("Translation error:", error)
    }
  }
  const textToSpeech = async (text: string) => {
    try {
      const options = {
        method: 'POST',
        headers: {
          'api-subscription-key': '609361f5-3167-4583-bcc3-f2c0e4a6f7bd',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: targetLanguage,
          speaker: "meera",
          pitch: 0,
          pace: 1.65,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: false,
          model: "bulbul:v1"
        })
      };
  
      const response = await fetch('https://api.sarvam.ai/text-to-speech', options);
  
      if (!response.ok) {
        console.log(' Api error for text to speech')
        // throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
  
      if (data?.audios?.length > 0) {
        let base64Audio = data.audios[0]; // Correct access
  
        if (base64Audio.startsWith("data:audio")) {
          base64Audio = base64Audio.split(",")[1];
        }
  
        const audioBlob = base64ToBlob(base64Audio, "audio/wav");
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        console.error('Failed to get audio from text-to-speech service');
        // throw new Error('Failed to get audio from text-to-speech service');
      }
    } catch (error) {
      console.error("Text-to-Speech error:", error);
    }
  };
  
  // Utility function to convert Base64 to Blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
  
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
  
    return new Blob(byteArrays, { type: mimeType });
  };
  
  const clearResults = () => {
    setTranscription("")
    setTranslation(null)
    setFiles([])
    setError(null)
    setProgress(0)
  }

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Audio Transcription & Translation</h1>
          <p className="text-gray-600 dark:text-gray-400">Record or upload audio to transcribe and translate</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <button
              className={`w-20 h-20 rounded-full relative focus:outline-none ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
            >
              {isRecording && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />}
              <Mic className="w-8 h-8 text-white mx-auto" />
            </button>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Languages className="hidden sm:block w-6 h-6" />
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-48 p-2 border rounded-md bg-white dark:bg-gray-700"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} (Output)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer">
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Drag and drop audio files here, or click to select files
            </p>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-600 h-2 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400">Processing...</p>
            </div>
          )}

          <div className="space-y-4">
            {transcription && (
              <div>
                <h2 className="text-xl font-semibold">Transcription</h2>
                <p>{transcription}</p>
              </div>
            )}

            {translation && (
              <div>
                <h2 className="text-xl font-semibold">Translation</h2>
                <p>{translation}</p>
              </div>
            )}
          </div>

          {(transcription || translation) && (
            <button
              className="w-full bg-gray-500 text-white p-2 rounded-md mt-4 hover:bg-gray-600"
              onClick={clearResults}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
