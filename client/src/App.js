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

                // Explicitly control play/pause for non-hosts if the `playing` prop isn't enough or for immediate feedback
                // However, setting `isPlaying` state should suffice given ReactPlayer's design.
                // The previous error was due to an incomplete `player.get`
            }
        };


        // Rest of your useEffect and other component logic...
        // ... (remaining code remains unchanged)
    }, [roomId, username, isHost, videoUrl]); // Dependencies
    // ... (rest of the RoomPage component)
    return null; // Added a temporary return as the original snippet was cut short
}
