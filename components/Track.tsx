// Same row as the video list (Expand Card rows): a surface with the title,
// a muted second line, and the ranking on the right.
export default function Track(track) {
  return (
    <a
      href={track.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="surface flex items-center gap-4 w-full h-[72px] px-4 rounded-[20px] transition-transform active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-5 truncate text-ink">{track.title}</p>
        <p className="text-sm leading-[18px] truncate text-muted">
          {track.artist}
        </p>
      </div>
      <span className="font-bold tabular-nums text-muted-2">
        {String(track.ranking).padStart(2, '0')}
      </span>
    </a>
  );
}
