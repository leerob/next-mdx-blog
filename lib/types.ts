import { MDXRemoteSerializeResult } from 'next-mdx-remote';

export type Post = {
  _id: string;
  slug: string;
  content: MDXRemoteSerializeResult;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  readingTime: string;
  tweets: any[];
};

export type Snippet = {
  _id: string;
  slug: string;
  content: MDXRemoteSerializeResult;
  title: string;
  description: string;
  logo: string;
};

export enum Form {
  Initial,
  Loading,
  Success,
  Error
}

export type FormState = {
  state: Form;
  message?: string;
};

export type Views = {
  total: number;
};

export type Song = {
  songUrl: string;
  artist: string;
  title: string;
};

export type NowPlayingSong = {
  album: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
  songUrl: string;
  title: string;
};

export type TopTracks = {
  tracks: Song[];
};

export type YouTube = {
  subscriberCount: number;
  viewCount: number;
};

export type VideoStats = {
  views: number;
  likes: number | null;
};

export type GitHub = {
  stars: number;
};

export type Unsplash = {
  downloads: number;
  views: number;
};

export type Author = {
  paperCount: number | null;
  citationCount: number | null;
};

export type GuestbookEntry = {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

// Max characters in a guestbook message (same convention as a tweet).
export const GUESTBOOK_MAX_LENGTH = 280;
