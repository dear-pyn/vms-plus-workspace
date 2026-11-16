/** Thai display timestamp dd/mm/yyyy (B.E.) HH:mm, compared numerically. */
export function progressTime(text) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/.exec(text);
  if (!m) return null;
  const [, day, month, year, hour = '0', minute = '0'] = m;
  const y = Number(year) - 543, mo = Number(month) - 1, d = Number(day), h = Number(hour), mi = Number(minute);
  const date = new Date(Date.UTC(y, mo, d, h, mi));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo && date.getUTCDate() === d && h < 24 && mi < 60 ? date.getTime() : null;
}
/** Sort a copy before pagination. Equal values use newest timestamp then latest insertion. */
export function sortProgress(log, key = 'at', direction = -1) {
  return log.map((entry, index) => ({ entry, index, time: progressTime(entry.at) }))
    .sort((a, b) => {
      if (key === 'percent') {
        const diff = (a.entry.percent - b.entry.percent) * direction;
        if (diff) return diff;
      }
      if (a.time === null && b.time !== null) return 1;
      if (b.time === null && a.time !== null) return -1;
      const diff = ((a.time ?? 0) - (b.time ?? 0)) * (key === 'at' ? direction : -1);
      return diff || b.index - a.index;
    }).map(({ entry }) => entry);
}
