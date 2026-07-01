import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { MessageSquare, ThumbsUp, Trash2, CornerDownRight, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

// Simple markdown formatter for comments (supports bold, italic, code)
const formatCommentText = (text = '') => {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Format **bold**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Format *italic*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Format \`inline code\`
  html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-rose-500">$1</code>');
  // Format newlines
  html = html.replace(/\n/g, '<br />');

  return { __html: html };
};

export const CommentSection = ({ articleId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [replyToId, setReplyToId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { register: mainRegister, handleSubmit: handleMainSubmit, reset: resetMain } = useForm();
  const { register: replyRegister, handleSubmit: handleReplySubmit, reset: resetReply } = useForm();

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${articleId}`);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const onAddComment = async (data) => {
    if (!user) {
      toast.error('Please log in to participate in the discussion');
      return;
    }
    try {
      const { data: resData } = await api.post(`/comments/${articleId}`, {
        content: data.content,
        parentComment: null
      });
      if (resData.success) {
        toast.success('Comment posted!');
        resetMain();
        fetchComments();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not post comment');
    }
  };

  const onAddReply = async (data) => {
    if (!user) {
      toast.error('Please log in to reply');
      return;
    }
    try {
      const { data: resData } = await api.post(`/comments/${articleId}`, {
        content: data.content,
        parentComment: replyToId
      });
      if (resData.success) {
        toast.success('Reply posted!');
        setReplyToId(null);
        resetReply();
        fetchComments();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not post reply');
    }
  };

  const handleLike = async (id) => {
    if (!user) {
      toast.error('Please log in to like comments');
      return;
    }
    try {
      const { data } = await api.post(`/comments/${id}/like`);
      if (data.success) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { data } = await api.delete(`/comments/${id}`);
      if (data.success) {
        toast.success('Comment deleted');
        fetchComments();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment');
    }
  };

  // Recursive component to render replies
  const CommentItem = ({ comment, depth = 0 }) => {
    const isAuthor = user && comment.author?._id === user._id;
    const isStaff = user && (user.role === 'Admin' || user.role === 'Moderator');
    const isLiked = user && comment.likes?.includes(user._id);

    return (
      <div className={`space-y-3 ${depth > 0 ? 'ml-6 sm:ml-10 border-l border-gray-150 pl-4 dark:border-slate-800' : ''}`}>
        
        {/* Comment Card */}
        <div className="p-4 rounded-xl border border-gray-150 bg-white dark:border-slate-800 dark:bg-slate-950/40">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img
                src={comment.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.author?.name || 'Deleted')}`}
                alt={comment.author?.name || 'User'}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                {comment.author?.name || '[Deleted]'}
              </span>
              {comment.author?.role && comment.author.role !== 'Student' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-iitgn-maroon dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
                  {comment.author.role}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Body Text */}
          <div 
            className="text-sm text-gray-700 dark:text-slate-300 wiki-comment-body"
            dangerouslySetInnerHTML={formatCommentText(comment.content)}
          />

          {/* Actions Bar */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100 dark:border-slate-800/60 text-xs text-gray-500">
              {/* Like Button */}
              <button
                onClick={() => handleLike(comment._id)}
                className={`flex items-center gap-1.5 hover:text-iitgn-maroon dark:hover:text-red-400 transition-colors
                  ${isLiked ? 'text-iitgn-maroon dark:text-red-400 font-semibold' : ''}
                `}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{comment.likes?.length || 0}</span>
              </button>

              {/* Reply Button (up to depth 3) */}
              {user && depth < 3 && (
                <button
                  onClick={() => setReplyToId(replyToId === comment._id ? null : comment._id)}
                  className="hover:text-iitgn-maroon dark:hover:text-red-400 transition-colors"
                >
                  Reply
                </button>
              )}

              {/* Delete Button */}
              {user && (isAuthor || isStaff) && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="ml-auto text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Inline Reply Textbox */}
        {replyToId === comment._id && (
          <div className="flex items-start gap-2 ml-4">
            <CornerDownRight className="h-5 w-5 text-gray-400 mt-2" />
            <form onSubmit={handleReplySubmit(onAddReply)} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply... (markdown supported: *italic*, **bold**, `code`)"
                {...replyRegister('content', { required: true })}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm outline-none focus:border-iitgn-maroon focus:bg-white dark:border-slate-850 dark:bg-slate-900 dark:text-white dark:focus:border-red-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white p-2"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Render child replies */}
        {comment.replies && comment.replies.map((reply) => (
          <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
        ))}

      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
        <MessageSquare className="h-5 w-5 text-iitgn-maroon dark:text-red-400" />
        <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white">
          Discussion Board (Talk Page)
        </h2>
      </div>

      {/* Main Comment Textbox */}
      {user ? (
        <form onSubmit={handleMainSubmit(onAddComment)} className="space-y-3">
          <textarea
            rows="3"
            placeholder="Write a comment... Markdown supported: **bold**, *italic*, `code`"
            {...mainRegister('content', { required: true })}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm outline-none focus:border-iitgn-maroon focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-red-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-4 py-2 text-sm font-semibold transition-all"
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-gray-50 text-center text-sm text-gray-500 dark:bg-slate-900/50">
          Please <a href="/login" className="text-iitgn-maroon hover:underline font-semibold dark:text-red-400">login</a> to participate in the article's discussion board.
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 dark:bg-slate-850 rounded animate-pulse"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((c) => (
            <CommentItem key={c._id} comment={c} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 italic py-6">No discussions yet on this page. Be the first to start the thread!</p>
      )}

    </div>
  );
};

export default CommentSection;
