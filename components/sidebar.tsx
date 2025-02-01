import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Library, FolderGit2, MessageCircle, Plus } from "lucide-react"

export function Sidebar() {
  const chats = ["Audio Transcription", "Meeting Notes", "Voice Memo", "Interview Recording", "Lecture Notes"]

  return (
    <div className="w-64 border-r bg-background">
      <div className="p-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <nav className="grid gap-1 px-4">
        <Button variant="ghost" className="justify-start gap-2">
          <MessageSquare size={16} />
          Community
        </Button>
        <Button variant="ghost" className="justify-start gap-2">
          <Library size={16} />
          Library
        </Button>
        <Button variant="ghost" className="justify-start gap-2">
          <FolderGit2 size={16} />
          Projects
        </Button>
        <Button variant="ghost" className="justify-start gap-2">
          <MessageCircle size={16} />
          Feedback
        </Button>
      </nav>

      <div className="px-4 py-2 mt-4">
        <h2 className="mb-2 text-sm font-semibold">Recent Chats</h2>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="grid gap-1">
            {chats.map((chat) => (
              <Button key={chat} variant="ghost" className="w-full justify-start font-normal">
                {chat}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

