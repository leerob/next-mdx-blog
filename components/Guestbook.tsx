import { useState, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import useSWR, { useSWRConfig } from 'swr';

import fetcher from 'lib/fetcher';
import {
  Form,
  FormState,
  GuestbookEntry,
  GUESTBOOK_MAX_LENGTH
} from 'lib/types';
import PromptBox from 'components/PromptBox';

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

// In UTC, so the server render and the browser agree whatever the
// visitor's time zone: "3 Nov 2026 at 4:05 PM"
function formatDate(date: Date) {
  const h = date.getUTCHours(),
    m = String(date.getUTCMinutes()).padStart(2, '0');
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()} at ${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

// A solid colour for each name, always the same one: its hue from a small
// string hash (FNV-1a), dark enough for the white initial
function avatarColor(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  }
  return `hsl(${(h >>> 0) % 360} 55% 45%)`;
}

function Entry({
  entry,
  user
}: {
  entry: GuestbookEntry;
  user?: { name?: string | null };
}) {
  const { mutate } = useSWRConfig();
  const [failed, setFailed] = useState(false);
  const name = entry.created_by || '?';
  const date = new Date(entry.updated_at);

  const remove = async () => {
    setFailed(false);
    try {
      const res = await fetch(`/api/guestbook/${entry.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setFailed(true);
    }
    mutate('/api/guestbook');
  };

  return (
    <div className="flex gap-3">
      {/* 40px, its top level with the top of the name's capitals */}
      <span
        aria-hidden="true"
        style={{ backgroundColor: avatarColor(name) }}
        className="flex-none grid place-items-center w-10 h-10 mt-1.5 rounded-[22%] text-base font-semibold text-white"
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="font-semibold text-ink">{name}</p>
          <time dateTime={date.toISOString()} className="text-sm text-muted-2">
            {formatDate(date)}
          </time>
          {user && entry.created_by === user.name && (
            <div className="ml-auto flex items-baseline gap-2">
              {failed && (
                <p role="alert" className="text-xs text-[color:var(--red)]">
                  Could not delete, try again
                </p>
              )}
              <button
                type="button"
                onClick={remove}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-fill-2 text-muted hover:text-[color:var(--red)] transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <p className="mt-1 text-ink-2 break-words whitespace-pre-line">
          {entry.body}
        </p>
      </div>
    </div>
  );
}

export default function Guestbook({
  fallbackData
}: {
  fallbackData: GuestbookEntry[];
}) {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState<FormState>({ state: Form.Initial });
  const fieldEl = useRef<HTMLTextAreaElement>(null);
  const { data: entries } = useSWR<GuestbookEntry[]>(
    '/api/guestbook',
    fetcher,
    { fallbackData }
  );

  const leaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = fieldEl.current?.value.trim();
    if (!body || form.state === Form.Loading) return;
    setForm({ state: Form.Loading });

    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setForm({
        state: Form.Error,
        message: 'Could not sign, try again'
      });
      return;
    }

    if (fieldEl.current) fieldEl.current.value = '';
    mutate('/api/guestbook');
    setForm({
      state: Form.Success,
      message: 'Signed. Thanks for stopping by!'
    });
  };

  return (
    <>
      <div className="surface w-full my-4 p-5 sm:p-6 rounded-[28px]">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Sign the Guestbook
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Share a message for a future visitor of my site.
        </p>
        {session?.user ? (
          <PromptBox
            fieldRef={fieldEl}
            state={form.state}
            message={form.message}
            limit={GUESTBOOK_MAX_LENGTH}
            placeholder="Leave a message"
            onSubmit={leaveEntry}
          />
        ) : (
          <div className="flex items-center gap-3 rounded-[24px] bg-fill-1 py-2.5 pr-2.5 pl-[18px]">
            <p className="flex-1 text-[15px] text-muted-2">
              Sign in to leave a message
            </p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/signin/github"
              onClick={(e) => {
                e.preventDefault();
                signIn('github');
              }}
              className="flex items-center gap-2 h-8 pl-3 pr-3.5 rounded-full bg-inverse text-on-inverse text-sm font-semibold active:scale-95 transition-transform"
            >
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in
            </a>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-2">
          Your information is only used to display your name and reply by email.
        </p>
      </div>
      <div className="mt-6 space-y-7 w-full">
        {entries?.map((entry) => (
          <Entry key={entry.id} entry={entry} user={session?.user} />
        ))}
      </div>
    </>
  );
}
