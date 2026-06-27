// Fast-start strategy: play after just 1s buffered for instant feel
export const INITIAL_BUFFER_SECONDS = 1;
const FULL_BUFFER_TOLERANCE_SECONDS = 1.5;

export function getBufferedSegmentEnd(video: HTMLVideoElement, time = video.currentTime): number {
  for (let index = 0; index < video.buffered.length; index += 1) {
    const start = video.buffered.start(index);
    const end = video.buffered.end(index);
    if (start <= time && end >= time) return end;
  }
  return video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0;
}

export function getBufferedAhead(video: HTMLVideoElement, time = video.currentTime): number {
  return Math.max(0, getBufferedSegmentEnd(video, time) - time);
}

/**
 * Progressive buffer target: starts at 60s, doubles each time the user
 * catches up to the previous target.
 * Returns the number of seconds ahead we want buffered right now.
 */
export function getProgressiveTarget(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return INITIAL_BUFFER_SECONDS;

  // Build thresholds: 60, 180 (60+120), 420 (180+240), 900 (420+480) …
  let cumulative = 0;
  let chunk = INITIAL_BUFFER_SECONDS; // 60
  while (cumulative + chunk < duration) {
    const segmentEnd = cumulative + chunk;
    if (currentTime < segmentEnd) {
      // User hasn't reached this segment end yet → target is chunk ahead
      return Math.min(chunk, duration - currentTime);
    }
    cumulative = segmentEnd;
    chunk *= 2; // double for next segment
  }
  // Past all segments – just buffer to the end
  return Math.max(0, duration - currentTime);
}

/** Startup target is always 60s (or full duration if shorter) */
export function getStartupBufferTarget(duration = 0): number {
  if (!Number.isFinite(duration) || duration <= 0) return INITIAL_BUFFER_SECONDS;
  return Math.min(duration, INITIAL_BUFFER_SECONDS);
}

export function getBufferPercent(video: HTMLVideoElement, targetSeconds: number, time = video.currentTime): number {
  const bufferedAhead = getBufferedAhead(video, time);
  return Math.max(0, Math.min(100, Math.round((bufferedAhead / Math.max(targetSeconds, 1)) * 100)));
}

export function isMostlyBuffered(
  video: HTMLVideoElement,
  time = video.currentTime,
  targetSeconds = INITIAL_BUFFER_SECONDS,
): boolean {
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const end = getBufferedSegmentEnd(video, time);

  if (duration > 0 && end >= duration - FULL_BUFFER_TOLERANCE_SECONDS) return true;
  return end - time >= Math.max(1, targetSeconds);
}
