type Props = { href: string; index: number; length: string; title: string };

// A plain ruled row: number, title, then the length and a play icon, which
// drop under the title on phones.
export default function VideoCard({ href, index, length, title }: Props) {
  return (
    <a
      className="w-full border-b border-gray-200 dark:border-gray-700 py-3 transition-transform hover:scale-[1.01]"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline">
          <span className="text-gray-500 dark:text-gray-400 mr-6 tabular-nums">
            {String(index).padStart(2, '0')}
          </span>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">
            {title}
          </h4>
        </div>
        <div className="flex items-center justify-between mt-2 sm:mt-0 ml-10 sm:ml-4 shrink-0">
          <span className="text-gray-500 dark:text-gray-400 mr-2 tabular-nums">
            {length}
          </span>
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-gray-500 dark:text-gray-100"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
