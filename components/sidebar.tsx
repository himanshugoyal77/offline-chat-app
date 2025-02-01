import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Library, MessageCircle, Plus, History, Settings } from "lucide-react"

export function Sidebar() {
  const recentTranscriptions = [
    { id: 1, name: "Team Meeting Recording", date: "2024-02-01" },
    { id: 2, name: "Interview with Client", date: "2024-02-01" },
    { id: 3, name: "Voice Memo - Project Ideas", date: "2024-01-31" },
    { id: 4, name: "Conference Call Notes", date: "2024-01-31" },
    { id: 5, name: "Lecture Recording", date: "2024-01-30" },
  ]

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus size={16} />
          New Transcription
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <nav className="grid gap-1">
            <Button variant="ghost" className="justify-start gap-2">
              <History size={16} />
              Recent
            </Button>
            <Button variant="ghost" className="justify-start gap-2">
              <Library size={16} />
              Library
            </Button>
            <Button variant="ghost" className="justify-start gap-2">
              <Settings size={16} />
              Settings
            </Button>
          </nav>

          <div className="pt-4 border-t">
            <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">RECENT TRANSCRIPTIONS</h2>
            <div className="grid gap-1">
              {recentTranscriptions.map((item) => (
                <Button key={item.id} variant="ghost" className="w-full justify-start text-sm font-normal">
                  <div className="flex flex-col items-start">
                    <span className="truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <MessageCircle size={16} />
          Feedback
        </Button>
      </div>
    </div>
  )
}

