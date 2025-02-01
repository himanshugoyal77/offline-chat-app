"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function MainContent() {
  const [isRecording, setIsRecording] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
  })

  return (
    <main className="flex-1 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">Upload or Record Audio</h1>

        <div className="flex justify-center">
          <Button
            size="lg"
            className={`w-24 h-24 rounded-full ${isRecording ? "bg-red-500 hover:bg-red-600" : ""}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            <Mic size={32} />
          </Button>
        </div>

        <Card
          {...getRootProps()}
          className={`p-12 text-center border-2 border-dashed cursor-pointer ${
            isDragActive ? "border-primary" : "border-muted"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the audio files here...</p>
          ) : (
            <p>Drag and drop audio files here, or click to select files</p>
          )}
        </Card>

        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
            {files.map((file, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted">
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

