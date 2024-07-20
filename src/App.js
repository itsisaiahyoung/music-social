import React, { useState, useEffect } from 'react';
import { Flame, ThumbsDown, UserPlus, Home, User, PlusSquare, X, MessageCircle, Map as MapIcon, Image as ImageIcon, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const FLAME_THRESHOLD = 5;
const DOWNVOTE_THRESHOLD = -3;

const Post = ({ id, artist, content, mediaUrl, musicUrl, onConnect, onFlame, onDownvote, onViewProfile, comments = [], onAddComment }) => {
  const [flameCount, setFlameCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [isFlaming, setIsFlaming] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (flameCount >= FLAME_THRESHOLD) setIsFlaming(true);
    if (downvoteCount <= DOWNVOTE_THRESHOLD) {
      // Handle downvote threshold reached
      console.log("Downvote threshold reached for post:", id);
    }
  }, [flameCount, downvoteCount, id]);

  const handleFlame = () => {
    setFlameCount(prev => prev + 1);
    onFlame(id);
    setIsFlaming(true);
    setTimeout(() => setIsFlaming(false), 1500); // Flame effect lasts for 1.5 seconds
  };

  const handleDownvote = () => {
    setDownvoteCount(prev => prev - 1);
    onDownvote(id);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <motion.div
      className="h-screen w-full flex-shrink-0 relative overflow-hidden"
      animate={isFlaming ? { 
        boxShadow: ['0 0 0px rgba(255,69,0,0)', '0 0 20px rgba(255,69,0,0.7)', '0 0 0px rgba(255,69,0,0)'],
      } : {}}
      transition={{ duration: 1.5 }}
    >
      {mediaUrl && <img src={mediaUrl} alt={content} className="w-full h-full object-cover" />}
      <AnimatePresence>
        {isFlaming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("https://ugokawaii.com/wp-content/uploads/2023/09/fire.gif")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent text-white">
        <h3 className="font-bold text-xl mb-2">{artist}</h3>
        <p className="mb-4">{content}</p>
        {musicUrl && (
          <audio controls className="w-full mb-4">
            <source src={musicUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
      <div className="absolute right-4 bottom-20 flex flex-col space-y-4">
        <button onClick={() => onConnect(id)} className="bg-blue-500 rounded-full p-3 text-white transform transition-transform active:scale-90">
          <UserPlus size={30} />
        </button>
        <motion.button
          onClick={handleFlame}
          className="bg-orange-500 rounded-full p-3 text-white transform transition-transform active:scale-90"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          <Flame size={30} />
        </motion.button>
        <button onClick={handleDownvote} className="bg-red-500 rounded-full p-3 text-white transform transition-transform active:scale-90">
          <ThumbsDown size={30} />
        </button>
        <button onClick={toggleComments} className="bg-purple-500 rounded-full p-3 text-white transform transition-transform active:scale-90">
          <MessageCircle size={30} />
        </button>
      </div>
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-lg shadow-lg" style={{maxHeight: '50%', overflowY: 'auto'}}>
          <CommentSection postId={id} comments={comments} onAddComment={onAddComment} />
        </div>
      )}
    </motion.div>
  );
};

const MapView = ({ onClose, posts }) => {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  return (
    <div className="h-screen bg-gray-100 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Nearby Artists & Posts</h2>
        <button onClick={onClose} className="text-gray-500">
          <X size={24} />
        </button>
      </div>
      {userLocation ? (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <p>Your approximate location:</p>
          <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here (approximately)</Popup>
            </Marker>
            {posts.map(post => (
              <Marker key={post.id} position={[post.lat, post.lng]}>
                <Popup>{post.artist}: {post.content}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <p>Loading your location...</p>
      )}
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold">{post.artist}</h3>
            <p className="text-gray-600">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Feed = ({ posts, onConnect, onFlame, onDownvote, onViewProfile, onAddComment }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const feedRef = React.useRef(null);

  const handleScroll = (event) => {
    const delta = event.deltaY;
    const postHeight = feedRef.current.clientHeight;
    const scrollPosition = feedRef.current.scrollTop;
    const threshold = postHeight / 2;

    if (delta > 0 && scrollPosition % postHeight >= threshold && currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (delta < 0 && scrollPosition % postHeight < threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  React.useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: currentIndex * feedRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <div ref={feedRef} className="h-screen overflow-y-scroll snap-y snap-mandatory" onWheel={handleScroll}>
      {posts.map((post, index) => (
        <div key={post.id} className="snap-start">
          <Post 
            {...post} 
            onConnect={onConnect} 
            onFlame={onFlame} 
            onDownvote={onDownvote} 
            onViewProfile={onViewProfile}
            onAddComment={onAddComment}
          />
        </div>
      ))}
    </div>
  );
};

const CreatePostComponent = ({ onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [musicUrl, setMusicUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onPostCreated({
      id: Date.now(),
      artist: 'Current User',
      content,
      mediaUrl,
      musicUrl,
    });
    onClose();
  };

  const handleFileUpload = (e, setUrl) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen bg-gray-100 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Create Post</h2>
        <button onClick={onClose} className="text-gray-500">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-2 border rounded mb-2 h-40"
        />
        <div className="flex items-center space-x-2">
          <label htmlFor="image-upload" className="cursor-pointer bg-blue-500 text-white p-2 rounded flex items-center">
            <ImageIcon size={20} className="mr-2" />
            Upload Image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, setMediaUrl)}
            className="hidden"
          />
          {mediaUrl && <img src={mediaUrl} alt="Uploaded" className="h-10 w-10 object-cover rounded" />}
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="music-upload" className="cursor-pointer bg-green-500 text-white p-2 rounded flex items-center">
            <Music size={20} className="mr-2" />
            Upload Music
          </label>
          <input
            id="music-upload"
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileUpload(e, setMusicUrl)}
            className="hidden"
          />
          {musicUrl && <p className="text-green-500">Music uploaded</p>}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Post</button>
      </form>
    </div>
  );
};


const Profile = ({ onClose, userId = null }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Simulated profile fetch
    setProfile({
      id: userId || 'current',
      name: userId ? 'Other User' : 'Music Maestro',
      bio: 'Passionate about creating electronic beats and melodies. Always looking for new collaborations and inspirations.',
      followers: 250,
      following: 100,
      posts: 50,
      recentPosts: [
        { id: 1, content: 'New track preview!', createdAt: '2 days ago' },
        { id: 2, content: 'Looking for vocalists', createdAt: '1 week ago' },
      ]
    });
  }, [userId]);

  if (!profile) return null;

  return (
    <div className="h-screen bg-gray-100 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Profile</h2>
        <button onClick={onClose} className="text-gray-500">
          <X size={24} />
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="relative mb-4">
          <User size={64} className="mx-auto text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-center mb-2">{profile.name}</h3>
        <p className="text-gray-600 text-center mb-4">Electronic Music Producer</p>
        <div className="flex justify-center space-x-4 mb-4">
          <div className="text-center">
            <p className="font-bold">{profile.followers}</p>
            <p className="text-gray-600">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{profile.following}</p>
            <p className="text-gray-600">Following</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{profile.posts}</p>
            <p className="text-gray-600">Posts</p>
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-bold mb-2">About Me</h4>
          <p className="text-gray-600">{profile.bio}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="font-bold mb-4">Recent Posts</h4>
        <div className="space-y-4">
          {profile.recentPosts.map(post => (
            <div key={post.id} className="border-b pb-2">
              <p className="font-semibold">{post.content}</p>
              <p className="text-gray-600 text-sm">Posted {post.createdAt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ postId, comments = [], onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        user: 'Current User',
        content: newComment,
        timestamp: new Date().toISOString(),
      };
      onAddComment(postId, comment);
      setNewComment('');
    }
  };

  return (
    <div className="mt-4">
      <h4 className="font-bold mb-2">Comments</h4>
      {comments.map((comment) => (
        <div key={comment.id} className="mb-2 p-2 bg-gray-100 rounded">
          <p className="font-semibold">{comment.user}</p>
          <p>{comment.content}</p>
          <p className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="mt-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="mt-2 bg-blue-500 text-white p-2 rounded w-full">
          Post Comment
        </button>
      </form>
    </div>
  );
};

const App = () => {
  const [currentTab, setCurrentTab] = useState('feed');
  const [posts, setPosts] = useState([
    { 
      id: 1, 
      artist: "DJ Harmony", 
      content: "New EDM track drop! Who's ready to dance?", 
      mediaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
      musicUrl: "https://example.com/sample-music.mp3",
      comments: [],
      lat: 40.7128,
      lng: -74.0060
    },
    { 
      id: 1, 
      artist: "DJ Harmony", 
      content: "New EDM track drop! Who's ready to dance?", 
      mediaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
      musicUrl: "https://example.com/sample-music.mp3",
      comments: [],
      lat: 40.7128,
      lng: -74.0060
    },
    { 
      id: 1, 
      artist: "DJ Harmony", 
      content: "New EDM track drop! Who's ready to dance?", 
      mediaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
      musicUrl: "https://example.com/sample-music.mp3",
      comments: [],
      lat: 40.7128,
      lng: -74.0060
    }
  ]);
  const [viewingUserId, setViewingUserId] = useState(null);

  const handleConnect = (id) => console.log(`Connected with post ${id}`);
  const handleFlame = (id) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === id ? { ...post, flameCount: (post.flameCount || 0) + 1 } : post
      )
    );
    console.log(`Flamed post ${id}`);
  };
  const handleDownvote = (id) => console.log(`Downvoted post ${id}`);

  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [{ ...newPost, comments: [], lat: 40.7128, lng: -74.0060 }, ...prevPosts]);
  };

  const handleViewProfile = (userId) => {
    setViewingUserId(userId);
    setCurrentTab('profile');
  };

  const handleAddComment = (postId, comment) => {
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...(post.comments || []), comment] }
        : post
    ));
  };

  return (
    <div className="h-screen overflow-hidden">
      {currentTab === 'feed' && 
        <Feed 
          posts={posts} 
          onConnect={handleConnect} 
          onFlame={handleFlame} 
          onDownvote={handleDownvote} 
          onViewProfile={handleViewProfile}
          onAddComment={handleAddComment}
        />
      }
      {currentTab === 'create' && <CreatePostComponent onClose={() => setCurrentTab('feed')} onPostCreated={handlePostCreated} />}
      {currentTab === 'profile' && <Profile onClose={() => { setCurrentTab('feed'); setViewingUserId(null); }} userId={viewingUserId} />}
      {currentTab === 'map' && <MapView onClose={() => setCurrentTab('feed')} posts={posts} />}
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
        <div className="flex justify-around p-4">
          <motion.button 
            onClick={() => setCurrentTab('feed')} 
            className={`${currentTab === 'feed' ? 'text-blue-500' : 'text-gray-500'}`}
            whileTap={{ scale: 0.9 }}
          >
            <Home size={24} />
          </motion.button>
          <motion.button 
            onClick={() => setCurrentTab('create')} 
            className={`${currentTab === 'create' ? 'text-blue-500' : 'text-gray-500'}`}
            whileTap={{ scale: 0.9 }}
          >
            <PlusSquare size={24} />
          </motion.button>
          <motion.button 
            onClick={() => setCurrentTab('map')} 
            className={`${currentTab === 'map' ? 'text-blue-500' : 'text-gray-500'}`}
            whileTap={{ scale: 0.9 }}
          >
            <MapIcon size={24} />
          </motion.button>
          <motion.button 
            onClick={() => { setCurrentTab('profile'); setViewingUserId(null); }} 
            className={`${currentTab === 'profile' ? 'text-blue-500' : 'text-gray-500'}`}
            whileTap={{ scale: 0.9 }}
          >
            <User size={24} />
          </motion.button>
        </div>
      </nav>
    </div>
  );
};

export default App;