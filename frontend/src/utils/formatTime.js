import { format, formatDistanceToNowStrict } from 'date-fns'

export const formatTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'HH:mm')
}

export const formatRelative = (date) => {
  if (!date) return ''
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true })
}
