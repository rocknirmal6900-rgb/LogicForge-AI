import React, { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon, Trash2, ArrowRight, Code2, BookOpen, MessageSquare } from 'lucide-react';
import apiClient from '../services/api';
import { BookmarkItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface BookmarksProps {
  onNavigateLesson: () => void;
  onNavigateProblem: (problemId: number) => void;
}

export const Bookmarks: React.FC<BookmarksProps> = ({
  onNavigateLesson,
  onNavigateProblem,
}) => {
  const { isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, [isAuthenticated]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const res = await apiClient.get<BookmarkItem[]>('/bookmarks/');
        setBookmarks(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookmarks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await apiClient.delete(`/bookmarks/${id}`);
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error deleting bookmark', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-border pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <BookmarkIcon className="h-6 w-6 text-brand-400" />
          Saved Bookmarks
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quickly access your pinned concept notes, tricky practice problems, and mentor explanations.
        </p>
      </div>

      <div className="space-y-3">
        {bookmarks.length > 0 ? (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="flex items-center justify-between rounded-2xl bg-surface-card p-4 border border-surface-border hover:border-brand-500/40 transition-all shadow-md"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                  {bm.item_type === 'problem' ? (
                    <Code2 className="h-5 w-5" />
                  ) : bm.item_type === 'lesson' ? (
                    <BookOpen className="h-5 w-5" />
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{bm.title}</span>
                    <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-slate-400 capitalize">
                      {bm.item_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{bm.subtitle || 'Bookmarked item'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (bm.item_type === 'problem') {
                      onNavigateProblem(Number(bm.target_id));
                    } else {
                      onNavigateLesson();
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-glow-brand hover:bg-brand-500 transition-all cursor-pointer"
                >
                  <span>Open</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(bm.id)}
                  className="rounded-xl p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove Bookmark"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-card p-12 text-center border border-surface-border">
            <BookmarkIcon className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-white">No Bookmarks Saved Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Bookmark tricky DSA problems or core concept dry runs to review them before coding interviews and exams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
