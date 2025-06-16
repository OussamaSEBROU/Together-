import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';
import { PlayCircleIcon, PauseCircleIcon, PaperAirplaneIcon, UserPlusIcon, XCircleIcon, CheckCircleIcon, LinkIcon, VideoCameraIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

let socket; // Global socket instance for simplicity, though typically managed within useEffect for better cleanup

// Helper function to validate video URLs using ReactPlayer's capabilities
const isValidVideoUrl = (url) => {
    return ReactPlayer.canPlay(url);
};


function App() {
    return (
        <>
            <style>
                {`
                /* Inter Font Import */
                @import url('https://rsms.me/inter/inter.css');
                html { font-family: 'Inter', sans-serif; }
                @supports (font-variation-settings: normal) {
                    html { font-family: 'Inter var', sans-serif; }
                }

                /* Custom Scrollbar Styles */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #4a5568; /* Tailwind gray-700 */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #6b7280; /* Tailwind gray-600 */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af; /* Tailwind gray-400 */
                }

                /* Basic fade-in animation for messages and sections */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fadeInDown 0.7s ease-out forwards;
                }
                `}
            </style>
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
        </>
    );
}

// --- HomePage Component ---
function HomePage() {
    const [username, setUsername] = useState('');
    const [createRoomVideoUrl, setCreateRoomVideoUrl] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (setter, value) => {
        setter(value);
        setError('');
        setSuccessMessage('');
    };

    const handleCreateRoom = () => {
        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }
        if (!isValidVideoUrl(createRoomVideoUrl)) {
            setError('Please enter a valid video link (e.g., YouTube, Vimeo, .mp4).');
            return;
        }

        if (!socket) {
            socket = io(SERVER_URL);
        }

        socket.emit('create_room', { username, videoUrl: createRoomVideoUrl });

        socket.on('room_created', (roomId) => {
            console.log(`Room created: ${roomId}`);
            setSuccessMessage(`Room created! Share this link: ${window.location.origin}/room/${roomId}`);
            navigate(`/room/${roomId}`, { state: { username: username, videoUrl: createRoomVideoUrl, isHost: true } });
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
                        placeholder="Your Username"
                        className="w-full p-4 mb-4 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={username}
                        onChange={(e) => handleInputChange(setUsername, e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Video Link (e.g., YouTube, Vimeo, .mp4)"
                        className="w-full p-4 mb-4 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={createRoomVideoUrl}
                        onChange={(e) => handleInputChange(setCreateRoomVideoUrl, e.target.value)}
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
                        onChange={(e) => handleInputChange(setUsername, e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Room ID (e.g., abcd123)"
                        className="w-full p-4 mb-6 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-200 placeholder-gray-400 text-lg"
                        value={joinRoomId}
                        onChange={(e) => handleInputChange(setJoinRoomId, e.target.value)}
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
                                    const messageBox = document.createElement('div');
                                    messageBox.textContent = 'Room link copied to clipboard!';
                                    messageBox.style.cssText = `
                                        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                                        background-color: #22c55e; color: white; padding: 10px 20px;
                                        border-radius: 8px; z-index: 1000; font-size: 1rem;
                                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                    `;
                                    document.body.appendChild(messageBox);
                                    setTimeout(() => document.body.removeChild(messageBox), 2000);
                                } else {
                                    throw new Error('Copy command failed.');
                                }
                            } catch (err) {
                                console.error('Failed to copy text: ', err);
                                const messageBox = document.createElement('div');
                                messageBox.textContent = 'Failed to copy link. Please copy it manually.';
                                messageBox.style.cssText = `
                                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                                    background-color: #dc2626; color: white; padding: 10px 20px;
                                    border-radius: 8px; z-index: 1000; font-size: 1rem;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                `;
                                document.body.appendChild(messageBox);
                                setTimeout(() => document.body.removeChild(messageBox), 3000);
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
    const playerRef = useRef(null);
    const chatMessagesEndRef = useRef(null);

    const [username, setUsername] = useState(location.state?.username || '');
    const [isHost, setIsHost] = useState(location.state?.isHost || false);
    const [videoUrl, setVideoUrl] = useState(location.state?.videoUrl || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [chatMessages, setChatMessages] = useState([]);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newVideoInput, setNewVideoInput] = useState('');

    // State to track if the host is currently seeking, to prevent rapid sync updates
    const isHostSeeking = useRef(false);

    // Effect to handle socket connection and events
    useEffect(() => {
        console.log(`[RoomPage Effect] Initializing for room: ${roomId}, user: ${username}, host: ${isHost}`);
        if (!username) {
            setShowUsernameModal(true);
            return;
        }

        if (!socket) {
            socket = io(SERVER_URL);
            console.log("[RoomPage Effect] Socket initialized for the first time.");
        }

        // Send initial join request or room creation for host
        if (isHost) {
            if (!videoUrl) {
                setStatusMessage('You are the host. Please set the video URL to start the session.');
                console.log("[RoomPage Effect] Host is missing video URL, prompting.");
            } else {
                console.log(`[RoomPage Effect] Host emitting 'create_room' with videoUrl: ${videoUrl}`);
                socket.emit('create_room', { username, videoUrl });
            }
        } else {
            console.log(`[RoomPage Effect] Non-host emitting 'join_request' for room: ${roomId}`);
            socket.emit('join_request', { roomId, username });
        }


        // --- Socket Event Listeners ---
        const handleRoomCreated = (id) => { console.log('[SOCKET EVENT] Host: Room created with ID', id); };
        const handleJoinApproved = (data) => {
            console.log('[SOCKET EVENT] Join approved! Received data:', data);
            setVideoUrl(data.videoUrl);
            setIsPlaying(data.videoState.playing); // Set local playing state
            setCurrentTime(data.videoState.currentTime); // Set local current time
            setUsersInRoom(data.users);

            // Ensure chat messages are correctly set from data.messages
            if (Array.isArray(data.messages)) {
                setChatMessages(data.messages);
                console.log("[CLIENT CHAT DEBUG] Chat messages successfully set from join_approved data:", data.messages);
            } else {
                setChatMessages([]);
                console.warn("[CLIENT CHAT DEBUG] Received non-array data.messages on join_approved:", data.messages);
            }

            setStatusMessage('');
            if (playerRef.current) {
                const player = playerRef.current;
                console.log(`[CLIENT VIDEO DEBUG] Join Approved: Seeking player to ${data.videoState.currentTime}, target playing state: ${data.videoState.playing}`);
                player.seekTo(data.videoState.currentTime, 'seconds');

                // Explicitly control play/pause for non-hosts
                if (data.videoState.playing) {
                    player.getInternalPlayer()?.play().catch(e => console.error("Autoplay failed for non-host on join_approved:", e));
                } else {
                    player.getInternalPlayer()?.pause();
                }
            }
        };

        const handleJoinRejected = (reason) => {
            console.log('[SOCKET EVENT] Join rejected:', reason);
            setStatusMessage(`Join rejected: ${reason}. Redirecting to home...`);
            socket.disconnect();
            setTimeout(() => navigate('/'), 3000);
        };

        const handleJoinPending = (message) => { setStatusMessage(message); };

        const handleNewJoinRequest = ({ requesterSocketId, username }) => {
            setPendingRequests(prev => [...prev, { requesterSocketId, username }]);
            console.log(`[SOCKET EVENT] New join request from ${username} (${requesterSocketId})`);
        };

        const handleRoomDataUpdate = (data) => {
            console.log('[SOCKET EVENT] Room data update received:', data);
            if (data.users) setUsersInRoom(data.users);
            if (data.pendingRequests) setPendingRequests(data.pendingRequests);
        };

        const handleVideoSync = (state) => {
            if (playerRef.current && !isHost) {
                const player = playerRef.current;
                const currentPlaybackTime = player.getCurrentTime();

                // Check for significant time difference OR a mismatch in play/pause state
                // player.getInternalPlayer().paused is true when paused, state.playing is true when playing
                // If player is paused but should be playing, OR player is playing but should be paused, sync.
                if (Math.abs(currentPlaybackTime - state.currentTime) > 1 || player.getInternalPlayer().paused === state.playing) {
                     console.log(`[CLIENT VIDEO DEBUG] Video Sync: Non-host seeking. Current: ${currentPlaybackTime.toFixed(2)}, Target: ${state.currentTime.toFixed(2)}. Player Paused: ${player.getInternalPlayer().paused}, Target Playing: ${state.playing}`);
                    player.seekTo(state.currentTime, 'seconds');
                }

                // Explicitly control play/pause for non-hosts
                if (state.playing && player.getInternalPlayer()?.paused) {
                    console.log("[CLIENT VIDEO DEBUG] Video Sync: Non-host playing video via direct call.");
                    player.getInternalPlayer()?.play().catch(e => console.error("Autoplay failed for non-host on video_sync:", e));
                    setIsPlaying(true); // Keep local state in sync
                } else if (!state.playing && !player.getInternalPlayer()?.paused) {
                    console.log("[CLIENT VIDEO DEBUG] Video Sync: Non-host pausing video via direct call.");
                    player.getInternalPlayer()?.pause();
                    setIsPlaying(false); // Keep local state in sync
                }
                setCurrentTime(state.currentTime); // Update current time locally
            }
        };

        const handleVideoUrlUpdated = ({ videoUrl: newUrl, videoState: newState }) => {
            console.log(`[SOCKET EVENT] Video URL updated to: ${newUrl}, new state:`, newState);
            setVideoUrl(newUrl);
            setIsPlaying(newState.playing);
            setCurrentTime(newState.currentTime);
            if (playerRef.current) {
                playerRef.current.seekTo(newState.currentTime, 'seconds');
                if (newState.playing) {
                    playerRef.current.getInternalPlayer()?.play().catch(e => console.error("Autoplay failed on video_url_updated:", e));
                } else {
                    playerRef.current.getInternalPlayer()?.pause();
                }
            }
        };

        const handleChatMessage = (msg) => {
            console.log('[SOCKET EVENT] New chat message:', msg);
            setChatMessages(prevMessages => [...prevMessages, msg]);
        };

        const handleUserJoined = ({ username: joinedUsername, socketId: joinedSocketId }) => {
            console.log(`[SOCKET EVENT] User joined: ${joinedUsername} (${joinedSocketId})`);
            setStatusMessage(`${joinedUsername} has joined the room.`);
            setTimeout(() => setStatusMessage(''), 3000);
        };

        const handleUserLeft = ({ username: leftUsername }) => {
            console.log(`[SOCKET EVENT] User left: ${leftUsername}`);
            setStatusMessage(`${leftUsername} has left the room.`);
            setTimeout(() => setStatusMessage(''), 3000);
        };

        const handleRoomClosed = (message) => {
            console.log('[SOCKET EVENT] Room closed:', message);
            setStatusMessage(`Room closed: ${message}. Redirecting to home...`);
            socket.disconnect();
            setTimeout(() => navigate('/'), 3000);
        };

        const handleErrorMessage = (msg) => {
            console.error('[SOCKET EVENT] Server error:', msg);
            setStatusMessage(`Error: ${msg}`);
            setTimeout(() => setStatusMessage(''), 5000);
        };


        socket.on('room_created', handleRoomCreated);
        socket.on('join_approved', handleJoinApproved);
        socket.on('join_rejected', handleJoinRejected);
        socket.on('join_pending', handleJoinPending);
        socket.on('new_join_request', handleNewJoinRequest);
        socket.on('room_data_update', handleRoomDataUpdate);
        socket.on('video_sync', handleVideoSync);
        socket.on('video_url_updated', handleVideoUrlUpdated);
        socket.on('chat_message', handleChatMessage);
        socket.on('user_joined', handleUserJoined);
        socket.on('user_left', handleUserLeft);
        socket.on('room_closed', handleRoomClosed);
        socket.on('error_message', handleErrorMessage);


        // Cleanup on unmount
        return () => {
            console.log("[RoomPage Effect] Cleaning up socket listeners.");
            socket.off('room_created', handleRoomCreated);
            socket.off('join_approved', handleJoinApproved);
            socket.off('join_rejected', handleJoinRejected);
            socket.off('join_pending', handleJoinPending);
            socket.off('new_join_request', handleNewJoinRequest);
            socket.off('room_data_update', handleRoomDataUpdate);
            socket.off('video_sync', handleVideoSync);
            socket.off('video_url_updated', handleVideoUrlUpdated);
            socket.off('chat_message', handleChatMessage);
            socket.off('user_joined', handleUserJoined);
            socket.off('user_left', handleUserLeft);
            socket.off('room_closed', handleRoomClosed);
            socket.off('error_message', handleErrorMessage);

            // Disconnect socket if it's the last component using it, or if navigating away
            // This is a simplified approach; in a larger app, you might manage socket lifecycle more granularly
            if (socket && socket.connected) {
                socket.disconnect();
                console.log("[RoomPage Effect] Socket disconnected during cleanup.");
            }
        };
    }, [roomId, username, isHost, videoUrl, navigate]); // Dependencies for useEffect

    // Scroll chat to bottom on new messages
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // --- Video Player Controls (Host Only) ---
    const handlePlayPause = () => {
        if (!isHost) return; // Only host can control
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);
        if (playerRef.current) {
            const player = playerRef.current;
            const currentTime = player.getCurrentTime();
            socket.emit('video_sync', { playing: newPlayingState, currentTime: currentTime });
            console.log(`[CLIENT VIDEO DEBUG] Host emitted video_sync: playing=${newPlayingState}, time=${currentTime}`);
        }
    };

    const handleProgress = useCallback((state) => {
        if (isHost && !isHostSeeking.current) { // Only host emits progress, and not while seeking
            // Emit sync event every 1-2 seconds to avoid excessive emissions
            if (Math.floor(state.playedSeconds) % 2 === 0 && Math.floor(state.playedSeconds) !== Math.floor(currentTime)) {
                setCurrentTime(state.playedSeconds);
                socket.emit('video_sync', { playing: isPlaying, currentTime: state.playedSeconds });
                console.log(`[CLIENT VIDEO DEBUG] Host emitted video_sync (progress): playing=${isPlaying}, time=${state.playedSeconds}`);
            }
        }
    }, [isHost, isPlaying, currentTime]);

    const handleSeek = useCallback((time) => {
        if (isHost && playerRef.current) {
            isHostSeeking.current = true; // Set seeking flag
            playerRef.current.seekTo(time, 'seconds');
            setCurrentTime(time);
            socket.emit('video_sync', { playing: isPlaying, currentTime: time });
            console.log(`[CLIENT VIDEO DEBUG] Host emitted video_sync (seek): playing=${isPlaying}, time=${time}`);
        }
    }, [isHost, isPlaying]);

    const handleSeekMouseUp = useCallback(() => {
        isHostSeeking.current = false; // Clear seeking flag
    }, []);

    const handleSetNewVideoUrl = () => {
        if (!isHost) {
            setStatusMessage('Only the host can change the video URL.');
            return;
        }
        if (!isValidVideoUrl(newVideoInput)) {
            setStatusMessage('Please enter a valid video link.');
            return;
        }
        socket.emit('set_video_url', { roomId, videoUrl: newVideoInput });
        setStatusMessage('Video URL change request sent.');
        setNewVideoInput(''); // Clear input after sending
    };

    // --- Chat Functions ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            socket.emit('chat_message', newMessage.trim());
            setNewMessage('');
        }
    };

    // --- Join Request Handling (Host Only) ---
    const handleApproveJoin = (requesterSocketId) => {
        socket.emit('approve_join', { roomId, requesterSocketId });
        setPendingRequests(prev => prev.filter(req => req.requesterSocketId !== requesterSocketId));
        setStatusMessage('Join request approved.');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleRejectJoin = (requesterSocketId) => {
        socket.emit('reject_join', { roomId, requesterSocketId });
        setPendingRequests(prev => prev.filter(req => req.requesterSocketId !== requesterSocketId));
        setStatusMessage('Join request rejected.');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    // --- Username Modal ---
    const handleSetUsernameAndJoin = () => {
        if (username.trim()) {
            setShowUsernameModal(false);
            // Re-trigger the useEffect to connect socket with the new username
            // This is a bit of a hack; a better approach might be to use a separate state for "hasJoined"
            // and only connect the socket when username is set and hasJoined is true.
            // For now, re-initializing the socket will work.
            if (socket && socket.connected) {
                socket.disconnect();
            }
            socket = io(SERVER_URL); // Re-initialize socket
            if (isHost) {
                socket.emit('create_room', { username, videoUrl });
            } else {
                socket.emit('join_request', { roomId, username });
            }
        } else {
            setStatusMessage('Please enter a username to join.');
        }
    };


    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto gap-6 p-4">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden">
                {/* Video Player */}
                <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                    {videoUrl ? (
                        <ReactPlayer
                            ref={playerRef}
                            url={videoUrl}
                            playing={isPlaying}
                            controls={isHost} // Only host sees controls
                            width="100%"
                            height="100%"
                            className="absolute top-0 left-0"
                            onPlay={() => isHost && setIsPlaying(true)}
                            onPause={() => isHost && setIsPlaying(false)}
                            onProgress={handleProgress}
                            onEnded={() => isHost && setIsPlaying(false)}
                            onReady={() => {
                                if (playerRef.current && isHost) {
                                    // Ensure host's initial state is sent
                                    socket.emit('video_sync', { playing: isPlaying, currentTime: playerRef.current.getCurrentTime() });
                                }
                            }}
                            config={{
                                youtube: {
                                    playerVars: { showinfo: 1 }
                                }
                            }}
                        />
                    ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 rounded-lg text-gray-400 text-xl">
                            {isHost ? "Enter a video URL to start the session." : "Waiting for host to set a video."}
                        </div>
                    )}
                </div>

                {/* Host Controls */}
                {isHost && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePlayPause}
                                className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition duration-200 transform hover:scale-105 shadow-lg"
                            >
                                {isPlaying ? <PauseCircleIcon className="h-8 w-8" /> : <PlayCircleIcon className="h-8 w-8" />}
                            </button>
                            <span className="text-lg font-semibold text-gray-200">
                                {isPlaying ? 'Playing' : 'Paused'}
                            </span>
                        </div>
                        <div className="flex-1 flex items-center gap-3 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="New Video URL"
                                className="flex-1 p-3 rounded-lg bg-gray-600 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-400"
                                value={newVideoInput}
                                onChange={(e) => setNewVideoInput(e.target.value)}
                            />
                            <button
                                onClick={handleSetNewVideoUrl}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-5 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg flex items-center gap
