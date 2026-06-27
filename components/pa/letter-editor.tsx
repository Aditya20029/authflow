"use client"

import * as React from "react"
import { Loader2, Sparkles, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { saveLetter } from "@/lib/actions/pa"

export function LetterEditor({
  paId,
  initialLetter,
}: {
  paId: string
  initialLetter: string
}) {
  const [text, setText] = React.useState(initialLetter)
  const [generating, setGenerating] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  async function generate() {
    setGenerating(true)
    setText("")
    try {
      const res = await fetch("/api/loms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paId }),
      })
      if (!res.ok || !res.body) throw new Error("generation failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setText(acc)
      }
      toast.success("Letter generated")
    } catch {
      toast.error("Could not generate the letter. You can write one manually.")
    } finally {
      setGenerating(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await saveLetter(paId, text)
      toast.success("Letter saved")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "The letter could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }

  const busy = generating || saving

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={generate} disabled={busy}>
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate letter
        </Button>
        <Button onClick={save} disabled={busy || text.trim().length === 0}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save letter
        </Button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        aria-label="Letter of medical necessity"
        placeholder="Generate a draft from the chart, or write the letter here."
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-sans text-sm leading-relaxed text-foreground shadow-soft placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <p className="text-xs text-muted-foreground">
        Draft for clinician review. AI-generated letters must be reviewed and
        signed by the treating clinician before submission. They are never
        submitted automatically.
      </p>
    </div>
  )
}
