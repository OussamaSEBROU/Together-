import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { PlayCircleIcon, PauseCircleIcon, PaperAirplaneIcon, UserPlusIcon, XCircleIcon, CheckCircleIcon, LinkIcon, VideoCameraIcon, UsersIcon } from '@heroicons/react/24/solid';

// Define the backend server URL.
// IMPORTANT: For deployment on Render, replace this with your actual backend service URL.
// During local development, it will typically be http://localhost:3001.
const SERVER_URL = process.env.NODE_ENV === 'production'
    ? 'YOUR_RENDER_BACKEND_URL' // Replace with your Render.com backend URL
    : 'http://localhost:3001';

// Global Socket.io instance to ensure it's managed correctly
// Use a ref to hold the socket instance across renders
let socket;

// Helper function to validate video URLs
const isValidVideoUrl = (url) => {
    try {
        const urlObj = new URL(url);
        // Basic check for common video file extensions
        return /\.(mp4|webm|ogg|mov|avi|flv|mkv)$/i.test(urlObj.pathname);
    } catch (e) {
        return false;
    }
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-inter flex flex-col items-center p-4">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/room/:roomId" element={<RoomPage />} />
                </Routes>
                <footer className="mt-auto py-4 text-center text-gray-400 text-sm">
                    Developed by Oussama SEBROU
                </footer>
            </div>
        </Router>
    );
}

// --- HomePage Component ---
function HomePage() {
    const [username, setUsername] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }
        if (!isValidVideoUrl(videoUrl)) {
            setError('Please enter a valid direct video link (e.g., .mp4).');
            return;
        }

        // Initialize socket if not already initialized
        if (!socket) {
            socket = io(SERVER_URL);
        }

        socket.emit('create_room', { username, videoUrl });

        socket.on('room_created', (roomId) => {
            console.log(`Room created: ${roomId}`);
            setSuccessMessage(`Room created! Share this link: ${window.location.origin}/room/${roomId}`);
            navigate(`/room/${roomId}`, { state: { username: username, videoUrl: videoUrl, isHost: true } });
        });

        socket.on('error_message', (msg) => {
            setError(msg);
            setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
        });
    };

    const handleJoinRoom = () => {
        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }
        if (!joinRoomId.trim()) {
            setError('Please enter a room ID.');
            return;
        }

        // Initialize socket if not already initialized
        if (!socket) {
            socket = io(SERVER_URL);
        }

        // Navigate immediately to the room, where the join request will be made
        navigate(`/room/${joinRoomId}`, { state: { username: username, isHost: false } });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] w-full py-8 px-4">
            <header className="text-center mb-12 animate-fade-in-down">
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 mb-4 tracking-tight">
                    Together
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                    Watch videos synchronously with friends, share moments, and chat in real-time.
                </p>
            </header>

            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
                {/* Create Room Section */}
                <div className="flex-1 bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 hover:border-indigo-600 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.01]">
                    <h2 className="text-3xl font-bold text-indigo-400 mb-6 flex items-center gap-3">
                        <VideoCameraIcon className="h-8 w-8" /> Create a New Room
                    </h2>
                    <input
                        type="text"
                        placeholder="Your Username"
                        className="w-full p-4 mb-4 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); setSuccessMessage(''); }}
                    />
                    <input
                        type="text"
                        placeholder="Direct Video Link (.mp4, .webm, etc.)"
                        className="w-full p-4 mb-6 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={videoUrl}
                        onChange={(e) => { setVideoUrl(e.target.value); setError(''); setSuccessMessage(''); }}
                    />
                    <button
                        onClick={handleCreateRoom}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 text-xl"
                    >
                        <PlayCircleIcon className="h-7 w-7" /> Start Watching
                    </button>
                </div>

                {/* Join Room Section */}
                <div className="flex-1 bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 hover:border-green-600 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.01]">
                    <h2 className="text-3xl font-bold text-green-400 mb-6 flex items-center gap-3">
                        <UsersIcon className="h-8 w-8" /> Join Existing Room
                    </h2>
                    <input
                        type="text"
                        placeholder="Your Username"
                        className="w-full p-4 mb-4 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); setSuccessMessage(''); }}
                    />
                    <input
                        type="text"
                        placeholder="Room ID (e.g., abcd123)"
                        className="w-full p-4 mb-6 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={joinRoomId}
                        onChange={(e) => { setJoinRoomId(e.target.value); setError(''); setSuccessMessage(''); }}
                    />
                    <button
                        onClick={handleJoinRoom}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 text-xl"
                    >
                        <LinkIcon className="h-7 w-7" /> Join Room
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-red-400 mt-8 text-center p-4 bg-red-900 bg-opacity-70 rounded-xl animate-fade-in max-w-xl w-full shadow-lg">
                    {error}
                </p>
            )}
            {successMessage && (
                <div className="text-green-400 mt-8 text-center p-4 bg-green-900 bg-opacity-70 rounded-xl animate-fade-in flex flex-col items-center max-w-xl w-full shadow-lg">
                    <p className="mb-3 text-lg font-medium">{successMessage}</p>
                    <button
                        onClick={() => {
                            const roomLink = `${window.location.origin}/room/${successMessage.split(': ').pop()}`;
                            document.execCommand('copy'); // Using document.execCommand for clipboard copy
                            if (document.execCommand('copy')) {
                                alert('Room link copied to clipboard!'); // Using alert for simplicity, consider a custom modal
                            } else {
                                console.error('Failed to copy text.');
                                alert('Failed to copy link. Please copy it manually.');
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg flex items-center gap-2 text-base transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <LinkIcon className="h-5 w-5" /> Copy Room Link
                    </button>
                </div>
            )}
        </div>
    );
}

// --- RoomPage Component ---
function RoomPage() {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const chatMessagesEndRef = useRef(null); // Ref for auto-scrolling chat

    const [username, setUsername] = useState(location.state?.username || '');
    const [isHost, setIsHost] = useState(location.state?.isHost || false);
    const [videoUrl, setVideoUrl] = useState(location.state?.videoUrl || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [usersInRoom, setUsersInRoom] = useState([]); // { socketId, username }
    const [pendingRequests, setPendingRequests] = useState([]); // { requesterSocketId, username }
    const [statusMessage, setStatusMessage] = useState(''); // Messages like "Join request pending" or "Room closed"
    const [showUsernameModal, setShowUsernameModal] = useState(false); // For users who navigated directly

    // Effect to handle socket connection and events
    useEffect(() => {
        if (!username) {
            setShowUsernameModal(true);
            return;
        }

        // Initialize socket if not already initialized
        if (!socket) {
            socket = io(SERVER_URL);
        }

        // Emit join request or create room if host
        if (isHost) {
            if (!videoUrl) { // If host navigated back to room without videoUrl state
                setStatusMessage('Host needs a video URL to create a room. Please go back to home.');
                return;
            }
            socket.emit('create_room', { username, videoUrl });
        } else {
            socket.emit('join_request', { roomId, username });
        }

        // --- Socket Event Listeners ---

        socket.on('room_created', (id) => {
            console.log('Host: Room created with ID', id);
            // navigate will handle updating the URL in HomePage
        });

        socket.on('join_approved', (data) => {
            console.log('Join approved!', data);
            setVideoUrl(data.videoUrl);
            setIsPlaying(data.videoState.playing);
            setCurrentTime(data.videoState.currentTime);
            setUsersInRoom(data.users);
            setStatusMessage(''); // Clear any pending message
        });

        socket.on('join_rejected', (reason) => {
            console.log('Join rejected:', reason);
            setStatusMessage(`Join rejected: ${reason}. Redirecting to home...`);
            socket.disconnect();
            setTimeout(() => navigate('/'), 3000);
        });

        socket.on('join_pending', (message) => {
            setStatusMessage(message);
        });

        socket.on('new_join_request', ({ requesterSocketId, username }) => {
            setPendingRequests(prev => [...prev, { requesterSocketId, username }]);
            console.log(`New join request from ${username} (${requesterSocketId})`);
        });

        socket.on('room_data_update', (data) => {
            // Update specific parts of room data (e.g., users, pending requests)
            if (data.users) setUsersInRoom(data.users);
            if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        });

        socket.on('video_sync', (state) => {
            if (videoRef.current && !isHost) { // Only non-hosts update based on sync
                const video = videoRef.current;
                if (Math.abs(video.currentTime - state.currentTime) > 1 || // Sync if time difference > 1 second
                    video.paused === state.playing) { // Sync if play/pause state is different
                    video.currentTime = state.currentTime;
                }
                if (state.playing) {
                    video.play().catch(e => console.error("Error playing video:", e));
                } else {
                    video.pause();
                }
                setIsPlaying(state.playing);
                setCurrentTime(state.currentTime);
            }
        });

        socket.on('video_url_updated', ({ videoUrl, videoState }) => {
            setVideoUrl(videoUrl);
            setIsPlaying(videoState.playing);
            setCurrentTime(videoState.currentTime);
            if (videoRef.current) {
                videoRef.current.load(); // Reload video with new URL
                videoRef.current.currentTime = videoState.currentTime;
                if (videoState.playing) {
                    videoRef.current.play().catch(e => console.error("Error playing video:", e));
                } else {
                    videoRef.current.pause();
                }
            }
        });

        socket.on('chat_message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        socket.on('user_joined', ({ username, socketId }) => {
            setUsersInRoom(prev => [...prev, { username, socketId }]);
            setChatMessages(prev => [...prev, { username: 'System', message: `${username} joined the room.`, timestamp: Date.now() }]);
        });

        socket.on('user_left', ({ username }) => {
            setUsersInRoom(prev => prev.filter(u => u.username !== username)); // Filter by username as socketId might be old
            setChatMessages(prev => [...prev, { username: 'System', message: `${username} left the room.`, timestamp: Date.now() }]);
        });

        socket.on('room_closed', (message) => {
            setStatusMessage(`${message} Redirecting to home...`);
            socket.disconnect(); // Ensure socket is disconnected
            setTimeout(() => navigate('/'), 3000);
        });

        socket.on('error_message', (msg) => {
            setStatusMessage(msg);
            setTimeout(() => setStatusMessage(''), 3000); // Clear error after 3 seconds
        });

        // Cleanup on unmount or dependency change
        return () => {
            console.log('Cleaning up socket listeners and disconnecting...');
            if (socket) {
                socket.off('room_created');
                socket.off('join_approved');
                socket.off('join_rejected');
                socket.off('join_pending');
                socket.off('new_join_request');
                socket.off('room_data_update');
                socket.off('video_sync');
                socket.off('video_url_updated');
                socket.off('chat_message');
                socket.off('user_joined');
                socket.off('user_left');
                socket.off('room_closed');
                socket.off('error_message');
                // Do NOT disconnect socket here if you want to reuse it.
                // Let the 'disconnect' event on the server handle if the browser tab closes.
                // For manual leaving, we might disconnect.
            }
        };
    }, [roomId, username, isHost, videoUrl, navigate]); // Rerun if these initial states change

    // Effect for auto-scrolling chat
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Effect for video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isHost) return; // Only host sends sync events

        const sendSync = () => {
            socket.emit('video_sync', {
                playing: !video.paused,
                currentTime: video.currentTime
            });
        };

        // Attach listeners for host's video actions
        video.addEventListener('play', sendSync);
        video.addEventListener('pause', sendSync);
        video.addEventListener('seeked', sendSync);

        // Cleanup listeners
        return () => {
            video.removeEventListener('play', sendSync);
            video.removeEventListener('pause', sendSync);
            video.removeEventListener('seeked', sendSync);
        };
    }, [isHost]); // Re-attach if host status changes

    // Handlers for host actions
    const handleApproveJoin = (requesterSocketId) => {
        if (socket) {
            socket.emit('approve_join', { roomId, requesterSocketId });
            setPendingRequests(prev => prev.filter(req => req.requesterSocketId !== requesterSocketId)); // Optimistic UI update
        }
    };

    const handleRejectJoin = (requesterSocketId) => {
        if (socket) {
            socket.emit('reject_join', { roomId, requesterSocketId });
            setPendingRequests(prev => prev.filter(req => req.requesterSocketId !== requesterSocketId)); // Optimistic UI update
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('chat_message', newMessage.trim());
            setNewMessage('');
            // Optimistic UI update for chat
            setChatMessages(prev => [...prev, { username: username, message: newMessage.trim(), timestamp: Date.now() }]);
        }
    };

    const handleSetVideoUrl = () => {
        const newUrl = prompt("Enter new direct video URL:");
        if (newUrl && isValidVideoUrl(newUrl)) {
            if (socket) {
                socket.emit('set_video_url', { roomId, videoUrl: newUrl });
            }
        } else if (newUrl) {
            setStatusMessage('Invalid video URL provided.');
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    const handleInitialUsernameSubmit = () => {
        if (username.trim()) {
            setShowUsernameModal(false);
            // Re-trigger the main useEffect to connect socket and join
            // This is a bit of a hack; ideally, you'd have a more robust initial connection flow
            // For now, it will work because the dependencies (username) will change.
        } else {
            setStatusMessage('Please enter a username to join.');
   
