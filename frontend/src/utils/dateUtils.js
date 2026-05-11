const parseDate = (dateString) => {
  if (!dateString) return null;
  let ds = dateString;
  // If it doesn't have a timezone indicator, assume UTC
  if (!ds.endsWith('Z') && ds.includes('T') && !ds.match(/[+-]\d{2}:\d{2}$/)) {
    ds = `${ds}Z`;
  } else if (!ds.includes('T') && ds.includes(' ')) {
    ds = `${ds.replace(' ', 'T')}Z`;
  }
  return new Date(ds);
};

export function formatDistanceToNow(dateString) {
  if (!dateString) return 'Unknown'

  const date = parseDate(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = parseDate(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(dateString) {
  if (!dateString) return 'N/A'
  const date = parseDate(dateString)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(dateString) {
  if (!dateString) return 'N/A'
  const date = parseDate(dateString)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}