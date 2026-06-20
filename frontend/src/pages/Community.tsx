import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, MessageSquare, Send, Trophy
} from 'lucide-react';

interface Comment {
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  likes: string[];
  comments: Comment[];
  created_at: string;
}

interface LeaderboardItem {
  rank: number;
  user_id: string;
  name: string;
  points: number;
  sustainability_score: number;
  badges_count: number;
  is_self: boolean;
}

const Community: React.FC = () => {
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  
  // Create Post State
  const [postContent, setPostContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  
  // Comment State Map
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const loadFeed = async () => {
    try {
      setFeedLoading(true);
      const res = await api.community.getPosts();
      setPosts(res);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const res = await api.community.getLeaderboard();
      setLeaderboard(res);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    loadLeaderboard();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      setPostSubmitting(true);
      const newPost = await api.community.createPost(postContent);
      setPosts(prev => [newPost, ...prev]);
      setPostContent('');
      // Reload leaderboard to sync points
      loadLeaderboard();
    } catch (err) {
      console.error(err);
      alert('Failed to share post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const updated = await api.community.likePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    try {
      const updated = await api.community.commentPost(postId, commentText);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
      alert('Failed to post comment.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Community & Leaderboard</h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Share sustainability advice, read tips, and climb the rankings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Community Feed column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Create Post Form */}
          {user && (
            <div className="glass-panel p-5 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800">
              <form onSubmit={handleCreatePost} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-eco-100 dark:bg-eco-950/30 text-eco-600 dark:text-eco-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <textarea
                    rows={2}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share an eco-friendly tip or achievement with the community..."
                    className="w-full bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-eco-500 transition-colors resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider">Posts earn +10 Eco Points</span>
                    <button
                      type="submit"
                      disabled={postSubmitting || !postContent.trim()}
                      className="eco-gradient text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-eco-600/10 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Posts List */}
          {feedLoading ? (
            <div className="text-sm text-slate-450 py-8">Loading Feed...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 font-bold text-slate-400">No posts in feed yet. Be the first!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => {
                const liked = user && post.likes.includes(user.id);
                return (
                  <div 
                    key={post.id}
                    className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex flex-col gap-4"
                  >
                    {/* Post Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                        {post.user_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{post.user_name}</h4>
                        <p className="text-2xs text-slate-400 font-semibold">{new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {post.content}
                    </p>

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 border-y border-slate-100 dark:border-slate-850/80 py-2.5 my-1">
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                          liked ? 'text-rose-600' : 'text-slate-450 hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                        <span>{post.likes.length} Likes</span>
                      </button>
                      
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-450">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments.length} Comments</span>
                      </span>
                    </div>

                    {/* Comments List */}
                    {post.comments.length > 0 && (
                      <div className="flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100/50 dark:border-slate-850">
                        {post.comments.map((comment, idx) => (
                          <div key={idx} className="flex gap-2 text-xs text-left">
                            <span className="font-extrabold text-slate-900 dark:text-white">{comment.user_name}:</span>
                            <span className="text-slate-600 dark:text-slate-400 font-semibold flex-1 leading-normal">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Form */}
                    {user && (
                      <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2.5">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={!(commentInputs[post.id] || '').trim()}
                          className="p-2 bg-eco-600 text-white rounded-xl shadow-md shadow-eco-600/10 hover:bg-eco-700 disabled:opacity-40"
                          aria-label="Send Comment"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Leaderboard column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/20" /> Top Eco-Warriors
          </h3>
          
          <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800 overflow-hidden shadow-sm">
            {leaderboardLoading ? (
              <div className="text-xs text-slate-450 py-8 text-center">Loading rankings...</div>
            ) : (
              <div className="flex flex-col">
                {leaderboard.map((item) => {
                  const isTop3 = item.rank <= 3;
                  return (
                    <div 
                      key={item.user_id}
                      className={`flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-850 last:border-none ${
                        item.is_self 
                          ? 'bg-eco-50/20 dark:bg-eco-950/20 font-bold border-l-4 border-l-eco-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 text-xs font-extrabold text-center ${
                          isTop3 ? 'text-amber-500 text-sm' : 'text-slate-400'
                        }`}>
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                            {item.name}
                          </p>
                          <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                            {item.badges_count} Badges
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-eco-600 dark:text-eco-400">
                          {item.points} pts
                        </span>
                        <p className="text-3xs font-bold text-slate-450 mt-0.5">Score: {item.sustainability_score}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Community;
