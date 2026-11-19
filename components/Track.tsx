// A plain ranked row with a rule under it, as before the cards.
export default function Track(track) {
  return (
    <div className="flex flex-row items-baseline border-b border-gray-200 dark:border-gray-800 w-full min-w-0 mt-8">
      <p className="text-sm font-bold text-gray-400 dark:text-gray-600">
        {track.ranking}
      </p>
      <div className="flex flex-col pl-3 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {track.title}
        </p>
        <p className="text-gray-500 mb-4 truncate">{track.artist}</p>
      </div>
    </div>
  );
}
