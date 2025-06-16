import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import ReactPlayer from 'react-player'; // <<< IMPORTANT: Make sure this is present
import { PlayCircleIcon, PauseCircleIcon, PaperAirplaneIcon, UserPlusIcon, XCircleIcon, CheckCircleIcon, LinkIcon, VideoCameraIcon, UsersIcon } from '@heroicons/react/24/solid';

// Define the backend server URL.
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

let socket;

// Helper function to validate video URLs using ReactPlayer's capabilities
const isValidVideoUrl = (url) => {
    return ReactPlayer.canPlay(url); // This will handle YouTube, Vimeo, MP4 etc.
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
            setError('Please enter a valid video link (e.g., YouTube, Vimeo, .mp4).'); // Updated message
            return;
        }

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
            setTimeout(() => setError(''), 3000);
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

        if (!socket) {
            socket = io(SERVER_URL);
        }

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
                        placeholder="Video Link (e.g., YouTube, Vimeo, .mp4)" // Updated placeholder
                        className="w-full p-4 mb-4 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400 text-lg"
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
                            const tempTextArea = document.createElement('textarea');
                            tempTextArea.value = roomLink;
                            document.body.appendChild(tempTextArea);
                            tempTextArea.select();
                            try {
                                const successful = document.execCommand('copy');
                                if (successful) {
                                    alert('Room link copied to clipboard!');
                                } else {
                                    throw new Error('Copy command failed.');
                                }
                            } catch (err) {
                                console.error('Failed to copy text: ', err);
                                alert('Failed to copy link. Please copy it manually.');
                            } finally {
                                document.body.removeChild(tempTextArea);
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
    const playerRef = useRef(null); // Ref for the ReactPlayer component
    const chatMessagesEndRef = useRef(null);

    const [username, setUsername] = useState(location.state?.username || '');
    const [isHost, setIsHost] = useState(location.state?.isHost || false);
    const [videoUrl, setVideoUrl] = useState(location.state?.videoUrl || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [showUsernameModal, setShowUsernameModal] = useState(false);


    // Effect to handle socket connection and events
    useEffect(() => {
        if (!username) {
            setShowUsernameModal(true);
            return;
        }

        if (!socket) {
            socket = io(SERVER_URL);
        }

        if (isHost) {
            if (!videoUrl) {
                setStatusMessage('Host needs a video URL to create a room. Please go back to home.');
                return;
            }
            socket.emit('create_room', { username, videoUrl });
        } else {
            socket.emit('join_request', { roomId, username });
        }

        // --- Socket Event Listeners ---
        socket.on('room_created', (id) => { console.log('Host: Room created with ID', id); });

        socket.on('join_approved', (data) => {
            console.log('Join approved!', data);
            setVideoUrl(data.videoUrl);
            setIsPlaying(data.videoState.playing);
            setCurrentTime(data.videoState.currentTime);
            setUsersInRoom(data.users);
            setStatusMessage('');
            // Manually seek player if it exists
            if (playerRef.current) {
                playerRef.current.seekTo(data.videoState.currentTime, 'seconds');
            }
        });

        socket.on('join_rejected', (reason) => {
            console.log('Join rejected:', reason);
            setStatusMessage(`Join rejected: ${reason}. Redirecting to home...`);
            socket.disconnect();
            setTimeout(() => navigate('/'), 3000);
        });

        socket.on('join_pending', (message) => { setStatusMessage(message); });

        socket.on('new_join_request', ({ requesterSocketId, username }) => {
            setPendingRequests(prev => [...prev, { requesterSocketId, username }]);
            console.log(`New join request from ${username} (${requesterSocketId})`);
        });

        socket.on('room_data_update', (data) => {
            if (data.users) setUsersInRoom(data.users);
            if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        });

        socket.on('video_sync', (state) => {
            if (playerRef.current && !isHost) { // Only non-hosts update based on sync
                const player = playerRef.current;
                const currentPlaybackTime = player.getCurrentTime();

                // Sync if time difference is significant or play/pause state is different
                if (Math.abs(currentPlaybackTime - state.currentTime) > 1 || player.getInternalPlayer().paused === state.playing) {
                    player.seekTo(state.currentTime, 'seconds');
                }

                if (state.playing && player.getInternalPlayer().paused) {
                    setIsPlaying(true); // Triggers play
                } else if (!state.playing && !player.getInternalPlayer().paused) {
                    setIsPlaying(false); // Triggers pause
                }
                setCurrentTime(state.currentTime);
            }
        });

        socket.on('video_url_updated', ({ videoUrl, videoState }) => {
            setVideoUrl(videoUrl);
            setIsPlaying(videoState.playing);
            setCurrentTime(videoState.currentTime);
            if (playerRef.current) {
                playerRef.current.seekTo(videoState.currentTime, 'seconds');
            }
        });

        socket.on('chat_message', (msg) => { setChatMessages(prev => [...prev, msg]); });

        socket.on('user_joined', ({ username, socketId }) => {
            setUsersInRoom(prev => [...prev, { username, socketId }]);
            setChatMessages(prev => [...prev, { username: 'System', message: `${username} joined the room.`, timestamp: Date.now() }]);
        });

        socket.on('user_left', ({ username }) => {
            setUsersInRoom(prev => prev.filter(u => u.username !== username));
            setChatMessages(prev => [...prev, { username: 'System', message: `${username} left the room.`, timestamp: Date.now() }]);
        });

        socket.on('room_closed', (message) => {
            setStatusMessage(`${message} Redirecting to home...`);
            socket.disconnect();
            setTimeout(() => navigate('/'), 3000);
        });

        socket.on('error_message', (msg) => { setStatusMessage(msg); setTimeout(() => setStatusMessage(''), 3000); });

        // Cleanup on unmount or dependency change
        return () => {
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
            }
        };
    }, [roomId, username, isHost, videoUrl, navigate]);

    // Effect for auto-scrolling chat
    useEffect(() => { chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);


    // Handlers for host actions, linked to ReactPlayer
    const handlePlayerProgress = useCallback((state) => {
        if (isHost && playerRef.current) {
            // Only send sync if playing to avoid excessive updates when paused
            // Also, only send if time has changed significantly to reduce network traffic
            if (isPlaying && Math.abs(state.playedSeconds - currentTime) > 0.5) { // Sync if playing and time difference > 0.5s
                socket.emit('video_sync', {
                    playing: isPlaying,
                    currentTime: state.playedSeconds
                });
            }
            setCurrentTime(state.playedSeconds);
        }
    }, [isHost, isPlaying, currentTime]);

    const handlePlayerPlay = useCallback(() => {
        if (isHost) {
            setIsPlaying(true);
            socket.emit('video_sync', {
                playing: true,
                currentTime: playerRef.current ? playerRef.current.getCurrentTime() : currentTime
            });
        }
    }, [isHost, currentTime]);

    const handlePlayerPause = useCallback(() => {
        if (isHost) {
            setIsPlaying(false);
            socket.emit('video_sync', {
                playing: false,
                currentTime: playerRef.current ? playerRef.current.getCurrentTime() : currentTime
            });
        }
    }, [isHost, currentTime]);

    const handlePlayerSeek = useCallback((newTime) => { // Changed 'e' to 'newTime' for clarity (expects seconds)
        if (isHost && playerRef.current) {
            playerRef.current.seekTo(newTime, 'seconds'); // Explicitly seek
            setIsPlaying(playerRef.current.props.playing); // Keep playing state as it was after seek
            socket.emit('video_sync', {
                playing: playerRef.current.props.playing,
                currentTime: newTime
            });
        }
    }, [isHost]); // No need for currentTime here if newTime is passed directly


    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('chat_message', newMessage.trim());
            setNewMessage('');
            setChatMessages(prev => [...prev, { username: username, message: newMessage.trim(), timestamp: Date.now() }]);
        }
    };

    const handleSetVideoUrl = () => {
        const newUrl = prompt("Enter new video URL (e.g., YouTube, Vimeo, .mp4, etc.):");
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
        } else {
            setStatusMessage('Please enter a username to join.');
        }
    };

    // New functions for handling join requests
    const handleApproveJoin = (requesterSocketId) => {
        if (socket && isHost) {
            socket.emit('approve_join', { roomId, requesterSocketId });
            setPendingRequests(prev => prev.filter(req => req.requesterSocketId !== requesterSocketId));
        }
    };

    const handleRejectJoin = (requesterSocketId) => {
        if (socket && isHost) {
            socket.emit('reject_join', { roomId, requesterSocketId });
            setPendingRequests(prev => prev.filter(req => req.requesterSocketId !== requesterSocketId));
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
                    <ReactPlayer
                        ref={playerRef}
                        url={videoUrl}
                        playing={isPlaying}
                        controls={isHost} // Only host sees native controls (ReactPlayer usually shows its own based on platform)
                        onPlay={handlePlayerPlay}
                        onPause={handlePlayerPause}
                        onProgress={handlePlayerProgress}
                        // onSeek callback for manual seek from native controls, react-player will call onProgress after seek
                        onEnded={() => setIsPlaying(false)} // Stop playing when video ends
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        config={{
                            youtube: {
                                playerVars: {
                                    controls: isHost ? 1 : 0, // Show YouTube's native controls only for host
                                    modestbranding: 1,
                                    showinfo: 0,
                                    rel: 0,
                                    autoplay: 0,
                                }
                            },
                            // Add other platforms if needed, e.g., vimeo, dailymotion
                            vimeo: {
                                playerOptions: {
                                    controls: isHost ? 1 : 0,
                                    // other Vimeo options
                                }
                            }
                        }}
                    />
                    {/* Custom controls for host overlaying the player, or just use native ones as configured above */}
                    {isHost && (
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900 bg-opacity-70 p-3 rounded-full shadow-lg z-10">
                            <button
                                onClick={handlePlayerPlay}
                                className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-200 transform hover:scale-110 shadow-lg"
                                title="Play"
                            >
                                <PlayCircleIcon className="h-8 w-8 text-white" />
                            </button>
                            <button
                                onClick={handlePlayerPause}
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
                            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isHost && user.socketId === socket?.id ? 'bg-indigo-400' : 'bg-green-400'}`}></span>
                            <span className="font-medium">{user.username}</span>
                            {/* Check if the current user (this client) is the host */}
                            {isHost && user.socketId === socket?.id && <span className="text-purple-400 ml-2 text-sm">(Host, You)</span>}
                            {/* Check if this is the current client (but not the host, as handled above) */}
                            {!isHost && user.socketId === socket?.id && <span className="text-gray-400 ml-2 text-sm">(You)</span>}
                            {/* If the current client is the host, mark the user in the list with matching socketId as (Host) */}
                            {isHost && user.socketId === usersInRoom.find
