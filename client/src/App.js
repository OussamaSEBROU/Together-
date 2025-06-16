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
                            navigator.clipboard.writeText(roomLink).then(() => {
                                alert('Room link copied to clipboard!'); // Using alert for simplicity, consider a custom modal
                            }).catch(err => {
                                console.error('Failed to copy text: ', err);
                                alert('Failed to copy link. Please copy it manually.');
                            });
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
        }
    };

    if (showUsernameModal) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center space-y-6 max-w-sm w-full border border-gray-700">
                    <h2 className="text-3xl font-bold text-indigo-400">Enter Your Username</h2>
                    <input
                        type="text"
                        placeholder="Your Username"
                        className="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setStatusMessage(''); }}
                    />
                    <button
                        onClick={handleInitialUsernameSubmit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 ease-in-out transform hover:scale-105 shadow-md w-full"
                    >
                        Join Room
                    </button>
                    {statusMessage && (
                        <p className="text-red-400 text-sm">{statusMessage}</p>
                    )}
                </div>
            </div>
        );
    }

    if (statusMessage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] text-center animate-fade-in px-4">
                <p className="text-xl text-yellow-300 bg-gray-700 p-6 rounded-xl shadow-xl border border-gray-600">{statusMessage}</p>
                {statusMessage.includes('Redirecting') && (
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                    >
                        Go to Home
                    </button>
                )}
            </div>
        );
    }

    if (!videoUrl && !isHost) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] text-center animate-fade-in px-4">
                <p className="text-xl text-indigo-300 bg-gray-700 p-6 rounded-xl shadow-xl border border-gray-600">
                    Waiting for host to set a video URL or for host to approve your join request...
                </p>
            </div>
        );
    }
    if (!videoUrl && isHost) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] text-center animate-fade-in px-4">
                <p className="text-xl text-indigo-300 bg-gray-700 p-6 rounded-xl shadow-xl border border-gray-600 mb-6">
                    You are the host. Please set the video URL to start the session.
                </p>
                <button
                    onClick={handleSetVideoUrl}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                    <LinkIcon className="h-6 w-6" /> Set Video URL
                </button>
            </div>
        );
    }


    return (
        <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-8">
            {/* Video Player Section */}
            <div className="flex-1 flex flex-col items-center bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-300 mb-4">Room ID: <span className="text-indigo-400">{roomId}</span></h2>
                <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl aspect-video">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        controls={isHost} // Only host has controls
                        onPlay={() => { if (isHost) setIsPlaying(true); }}
                        onPause={() => { if (isHost) setIsPlaying(false); }}
                        onSeeked={() => { if (isHost) setIsPlaying(false); }} // Set to pause or send current state
                        onLoadedMetadata={() => {
                            if (isHost && videoRef.current) {
                                // Ensure host's video state matches initial server state if it's a new load
                                socket.emit('video_sync', {
                                    playing: isPlaying,
                                    currentTime: currentTime
                                });
                            }
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                    {isHost && (
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900 bg-opacity-70 p-3 rounded-full shadow-lg">
                            <button
                                onClick={() => videoRef.current.play()}
                                className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-200 transform hover:scale-110 shadow-lg"
                                title="Play"
                            >
                                <PlayCircleIcon className="h-8 w-8 text-white" />
                            </button>
                            <button
                                onClick={() => videoRef.current.pause()}
                                className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-200 transform hover:scale-110 shadow-lg"
                                title="Pause"
                            >
                                <PauseCircleIcon className="h-8 w-8 text-white" />
                            </button>
                            <button
                                onClick={handleSetVideoUrl}
                                className="p-3 bg-blue-600 rounded-full hover:bg-blue-700 transition duration-200 transform hover:scale-110 shadow-lg"
                                title="Change Video URL"
                            >
                                <LinkIcon className="h-8 w-8 text-white" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Host Controls (for join requests) */}
                {isHost && pendingRequests.length > 0 && (
                    <div className="mt-8 w-full max-w-xl bg-gray-700 p-5 rounded-2xl shadow-md border border-gray-600">
                        <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <UserPlusIcon className="h-6 w-6 text-yellow-400" /> Pending Join Requests
                        </h3>
                        <ul className="space-y-3">
                            {pendingRequests.map((request) => (
                                <li key={request.requesterSocketId} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg shadow-sm border border-gray-500">
                                    <span className="text-gray-100 font-medium">{request.username}</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleApproveJoin(request.requesterSocketId)}
                                            className="p-2 bg-green-500 rounded-full hover:bg-green-600 transition duration-200 transform hover:scale-110 shadow-md"
                                            title="Approve"
                                        >
                                            <CheckCircleIcon className="h-6 w-6 text-white" />
                                        </button>
                                        <button
                                            onClick={() => handleRejectJoin(request.requesterSocketId)}
                                            className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition duration-200 transform hover:scale-110 shadow-md"
                                            title="Reject"
                                        >
                                            <XCircleIcon className="h-6 w-6 text-white" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>

            {/* Chat and User List Section */}
            <div className="flex-1 flex flex-col bg-gray-800 rounded-2xl shadow-lg p-6 max-w-md w-full lg:max-w-none border border-gray-700">
                <h3 className="text-2xl font-semibold text-gray-300 mb-4">Chat</h3>
                <div className="flex-grow flex flex-col bg-gray-700 rounded-xl overflow-hidden mb-4 shadow-inner border border-gray-600">
                    <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                        {chatMessages.map((msg, index) => (
                            <div key={index} className="mb-2 text-sm">
                                <span className="font-bold text-indigo-300">{msg.username}:</span>{' '}
                                <span className="text-gray-200 break-words">{msg.message}</span>
                                <span className="text-gray-400 ml-2 text-xs">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                        <div ref={chatMessagesEndRef} /> {/* For auto-scrolling */}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 bg-gray-600 flex items-center gap-3 border-t border-gray-500">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-grow p-3 rounded-xl bg-gray-700 border border-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 placeholder-gray-400"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-200 transform hover:scale-110 shadow-md"
                            title="Send Message"
                        >
                            <PaperAirplaneIcon className="h-6 w-6 text-white" />
                        </button>
                    </form>
                </div>

                <h3 className="text-2xl font-semibold text-gray-300 mb-4">Users in Room ({usersInRoom.length})</h3>
                <ul className="bg-gray-700 rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar border border-gray-600 shadow-inner">
                    {usersInRoom.map((user, index) => (
                        <li key={index} className="flex items-center text-gray-200 mb-2 p-1">
                            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isHost && user.socketId === socket.id ? 'bg-indigo-400' : 'bg-green-400'}`}></span>
                            <span className="font-medium">{user.username}</span>
                            {user.socketId === socket.id && <span className="text-gray-400 ml-2 text-sm">(You)</span>}
                            {/* Find the host from usersInRoom based on socket.id if available, otherwise fallback */}
                            {usersInRoom.some(u => u.socketId === user.socketId && u.socketId === usersInRoom.find(hostUser => hostUser.socketId === socket?.id)?.socketId) && (
                                <span className="text-purple-400 ml-2 text-sm">(Host)</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;


