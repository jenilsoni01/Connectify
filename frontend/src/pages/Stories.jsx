import { useEffect, useMemo, useState } from 'react'
import * as storyApi from '../api/story.api.js'
import { uploadStory } from '../api/upload.api.js'
import StoryBar from '../components/story/StoryBar.jsx'
import StoryViewer from '../components/story/StoryViewer.jsx'
import Button from '../components/common/Button.jsx'

const Stories = () => {
  const [stories, setStories] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [duration, setDuration] = useState(24)

  const load = async () => {
    const res = await storyApi.getFeed()
    setStories(res)
  }

  useEffect(() => {
    load()
  }, [])

  const groups = useMemo(() => {
    const map = new Map()
    stories.forEach((story) => {
      const user = story.userId
      const key = user._id
      if (!map.has(key)) map.set(key, { user, stories: [] })
      map.get(key).stories.push(story)
    })
    return Array.from(map.values())
  }, [stories])

  const submit = async () => {
    let mediaUrl = ''
    if (file) {
      const res = await uploadStory(file)
      mediaUrl = res.url
    }
    await storyApi.createStory({ contentText: text, mediaUrl, expiresInHours: duration })
    setText('')
    setFile(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stories</h2>
        <Button onClick={submit}>Post story</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <StoryBar groups={groups} onSelect={(group) => { setSelectedGroup(group); setOpen(true) }} />
          <div className="rounded-2xl bg-white/80 p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share a quick thought"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              rows={4}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm font-semibold">Story media</p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-3 w-full text-sm"
          />
          {file ? <p className="mt-2 text-xs text-[var(--muted)]">{file.name}</p> : null}
          
          <p className="mt-4 text-sm font-semibold">Duration</p>
          <select 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          >
            <option value={1}>1 hour</option>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours</option>
          </select>
        </div>
      </div>
      <StoryViewer open={open} onClose={() => { setOpen(false); load() }} group={selectedGroup} />
    </div>
  )
}

export default Stories
