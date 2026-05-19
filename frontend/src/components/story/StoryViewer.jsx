import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import * as storyApi from '../../api/story.api.js'

const StoryViewer = ({ open, onClose, group }) => {
  const { user } = useAuth()
  const [index, setIndex] = useState(0)
  const [localStories, setLocalStories] = useState([])
  const [showViewers, setShowViewers] = useState(false)

  useEffect(() => {
    setIndex(0)
    if (group) {
      setLocalStories(group.stories)
    }
  }, [group])

  const story = localStories[index]

  useEffect(() => {
    if (story && open && String(story.userId._id || story.userId) !== String(user._id)) {
      storyApi.viewStory(story._id).catch(() => {})
    }
  }, [story, open, user._id])

  if (!group || !story) return null

  const isMine = String(group.user._id) === String(user._id)
  const isLiked = story.likes?.some((l) => String(l._id || l) === String(user._id))

  const prev = () => {
    if (index > 0) setIndex(index - 1)
  }

  const next = () => {
    if (index < localStories.length - 1) setIndex(index + 1)
    else onClose()
  }

  const handleDelete = async () => {
    const ok = window.confirm('Delete this story?')
    if (!ok) return
    await storyApi.deleteStory(story._id)
    if (localStories.length === 1) {
      onClose()
    } else {
      setLocalStories((prev) => prev.filter((s) => s._id !== story._id))
      setIndex((i) => (i > 0 ? i - 1 : 0))
    }
  }

  const toggleLike = async () => {
    try {
      if (isLiked) {
        const updated = await storyApi.unlikeStory(story._id)
        setLocalStories((prev) => prev.map((s) => s._id === story._id ? updated : s))
      } else {
        const updated = await storyApi.likeStory(story._id)
        setLocalStories((prev) => prev.map((s) => s._id === story._id ? updated : s))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${group.user.name}'s story`}>
      <div className="space-y-4 relative">
        {/* Story content */}
        <div className="relative">
          {story.mediaUrl ? (
            <img src={story.mediaUrl} alt="" className="max-h-[60vh] w-full rounded-xl object-cover" />
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center rounded-xl bg-black/5 p-6 text-center text-lg font-semibold">
              {story.contentText}
            </div>
          )}

          {/* Delete button (only for owner) */}
          {isMine && (
            <button
              onClick={handleDelete}
              className="absolute right-2 top-2 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 transition"
              title="Delete Story"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Story actions / info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLike}
              className="flex items-center gap-1 text-sm font-semibold hover:text-[var(--accent)] transition"
            >
              <span className={isLiked ? 'text-[var(--accent)]' : ''}>
                {isLiked ? '❤️' : '🤍'}
              </span>
              <span>{story.likes?.length || 0}</span>
            </button>
            
            {isMine && (
              <button
                onClick={() => setShowViewers(!showViewers)}
                className="flex items-center gap-1 text-sm font-semibold text-[var(--muted)] hover:text-black transition"
              >
                <span>👁️</span>
                <span>{story.viewers?.length || 0}</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-[var(--muted)] mr-2">
              {index + 1} of {localStories.length}
            </p>
            <Button
              variant="soft"
              onClick={prev}
              disabled={index === 0}
              className={index === 0 ? 'opacity-40 cursor-not-allowed' : ''}
            >
              Prev
            </Button>
            <Button onClick={next}>Next</Button>
          </div>
        </div>

        {/* Viewers panel (only for owner) */}
        {isMine && showViewers && (
          <div className="mt-4 rounded-xl border border-black/10 bg-black/5 p-4">
            <h4 className="mb-2 text-xs font-semibold text-[var(--muted)]">Viewed by</h4>
            {story.viewers?.length === 0 ? (
              <p className="text-xs text-black/40">No views yet</p>
            ) : (
              <div className="max-h-32 space-y-2 overflow-y-auto">
                {story.viewers?.map((v) => (
                  <div key={v._id} className="flex items-center gap-2">
                    <div className="h-6 w-6 overflow-hidden rounded-full bg-black/10">
                      {v.profilePic ? (
                        <img src={v.profilePic} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <span className="text-xs">{v.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default StoryViewer
