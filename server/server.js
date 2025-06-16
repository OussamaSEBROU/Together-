// Import necessary modules
const express = require('express'); // For creating the web server
const http = require('http'); // Node.js built-in HTTP module
const socketIo = require('socket.io'); // Socket.io for real-time communication
const cors = require('cors'); // CORS middleware to allow cross-origin requests
const path = require('path'); // Node.js built-in path module for serving static files

// Initialize Express app
const app = express();

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
// Configure CORS for Socket.io to allow connections from your frontend (e.g., http://localhost:3000 or your Render frontend URL)
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for development. In production, restrict this to your frontend URL.
        methods: ["GET", "POST"]
    }
});

// Use CORS middleware for Express app
app.use(cors());

// Define the port to listen on. Use the PORT environment variable if available (for Render.com), otherwise default to 3001.
const PORT = process.env.PORT || 3001;

// In-memory data store for rooms and users
// This data will be lost if the server restarts.
const rooms = {}; // Stores room data: { roomId: { hostId: string, videoUrl: string, videoState: { playing: boolean, currentTime: number }, users: { socketId: { username: string, approved: boolean } }, pendingRequests: { socketId: { username: string } } } }
const users = {}; // Stores user data: { socketId: { roomId: string, username: string } }

/**
 * Generates a unique room ID.
 * @returns {string} A unique room ID.
 */
function generateRoomId() {
    // Simple ID generation using current timestamp and a random number
    return Math.random().toString(36).substring(2, 9);
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Room Management Events ---

    /**
     * Handles 'create_room' event.
     * A user requests to create a new synchronized video room.
     * The creator automatically becomes the host.
     */
    socket.on('create_room', ({ username, videoUrl }) => {
        const roomId = generateRoomId();
        rooms[roomId] = {
            hostId: socket.id,
            videoUrl: videoUrl,
            videoState: { playing: false, currentTime: 0 }, // Initial video state
            users: {
                [socket.id]: { username: username, approved: true } // Host is automatically approved
            },
            pendingRequests: {}
        };
        users[socket.id] = { roomId: roomId, username: username }; // Store user's room and username

        socket.join(roomId); // Join the socket to the room
        console.log(`Room created: ${roomId} by ${username} (Host: ${socket.id}) with video: ${videoUrl}`);

        // Emit room ID back to the host client
        socket.emit('room_created', roomId);

        // Send initial room data to the host
        socket.emit('room_data', {
            roomId: roomId,
            hostId: socket.id,
            videoUrl: videoUrl,
            videoState: rooms[roomId].videoState,
            users: Object.values(rooms[roomId].users), // Send list of users
            pendingRequests: Object.values(rooms[roomId].pendingRequests) // Send list of pending requests
        });
    });

    /**
     * Handles 'join_request' event.
     * A user requests to join an existing room. The host must approve.
     */
    socket.on('join_request', ({ roomId, username }) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('join_rejected', 'Room does not exist.');
            console.log(`Join request to non-existent room ${roomId} by ${username} (${socket.id})`);
            return;
        }

        // Check if the user is already in the room or has a pending request
        if (room.users[socket.id] || room.pendingRequests[socket.id]) {
            socket.emit('join_rejected', 'You are already in this room or your request is pending.');
            console.log(`Duplicate join request to room ${roomId} by ${username} (${socket.id})`);
            return;
        }

        // Add user to pending requests
        room.pendingRequests[socket.id] = { username: username };
        users[socket.id] = { roomId: roomId, username: username }; // Temporarily store user's room and username

        console.log(`Join request for room ${roomId} from ${username} (Socket: ${socket.id})`);

        // Notify the host about the new join request
        io.to(room.hostId).emit('new_join_request', {
            requesterSocketId: socket.id,
            username: username
        });

        // Inform the requesting user that their request is pending
        socket.emit('join_pending', 'Your request has been sent to the host.');

        // Update host's view of pending requests
        io.to(room.hostId).emit('room_data_update', {
            pendingRequests: Object.values(room.pendingRequests)
        });
    });

    /**
     * Handles 'approve_join' event.
     * The host approves a join request.
     */
    socket.on('approve_join', ({ roomId, requesterSocketId }) => {
        const room = rooms[roomId];
        if (!room || room.hostId !== socket.id) {
            // Only the host can approve
            socket.emit('error_message', 'Only the host can approve join requests.');
            console.warn(`Attempt to approve join request by non-host ${socket.id} for room ${roomId}`);
            return;
        }

        const requester = room.pendingRequests[requesterSocketId];
        if (!requester) {
            socket.emit('error_message', 'Join request not found or already processed.');
            console.warn(`Requester ${requesterSocketId} not found in pending requests for room ${roomId}`);
            return;
        }

        // Move from pending to approved users
        delete room.pendingRequests[requesterSocketId];
        room.users[requesterSocketId] = { username: requester.username, approved: true };

        // Make the requester's socket join the room
        const requesterSocket = io.sockets.sockets.get(requesterSocketId);
        if (requesterSocket) {
            requesterSocket.join(roomId);
            console.log(`User ${requester.username} (${requesterSocketId}) approved and joined room ${roomId}`);

            // Send full room data to the newly approved user
            requesterSocket.emit('join_approved', {
                roomId: roomId,
                hostId: room.hostId,
                videoUrl: room.videoUrl,
                videoState: room.videoState,
                users: Object.values(room.users)
            });

            // Notify all other users in the room (including host) that a new user has joined
            io.to(roomId).emit('user_joined', { username: requester.username, socketId: requesterSocketId });

            // Update host's view of users and pending requests
            io.to(room.hostId).emit('room_data_update', {
                users: Object.values(room.users),
                pendingRequests: Object.values(room.pendingRequests)
            });

        } else {
            console.error(`Socket for approved user ${requesterSocketId} not found.`);
            socket.emit('error_message', 'Could not find the user to approve.');
            // Re-add to pending if socket not found to prevent data loss? Or let it time out.
        }
    });

    /**
     * Handles 'reject_join' event.
     * The host rejects a join request.
     */
    socket.on('reject_join', ({ roomId, requesterSocketId }) => {
        const room = rooms[roomId];
        if (!room || room.hostId !== socket.id) {
            // Only the host can reject
            socket.emit('error_message', 'Only the host can reject join requests.');
            console.warn(`Attempt to reject join request by non-host ${socket.id} for room ${roomId}`);
            return;
        }

        const requester = room.pendingRequests[requesterSocketId];
        if (!requester) {
            socket.emit('error_message', 'Join request not found or already processed.');
            console.warn(`Requester ${requesterSocketId} not found in pending requests for room ${roomId}`);
            return;
        }

        delete room.pendingRequests[requesterSocketId]; // Remove from pending
        delete users[requesterSocketId]; // Remove user's temporary entry

        // Notify the rejected user
        const requesterSocket = io.sockets.sockets.get(requesterSocketId);
        if (requesterSocket) {
            requesterSocket.emit('join_rejected', 'Your request to join the room was rejected by the host.');
            console.log(`User ${requester.username} (${requesterSocketId}) rejected from room ${roomId}`);
        } else {
            console.error(`Socket for rejected user ${requesterSocketId} not found.`);
        }

        // Update host's view of pending requests
        io.to(room.hostId).emit('room_data_update', {
            pendingRequests: Object.values(room.pendingRequests)
        });
    });


    // --- Video Synchronization Events ---

    /**
     * Handles 'video_sync' event.
     * Only the host can send this event. It synchronizes the video state (play/pause/time)
     * across all approved users in the room.
     */
    socket.on('video_sync', (state) => {
        const user = users[socket.id];
        if (!user) return; // User not associated with a room

        const room = rooms[user.roomId];
        if (!room || room.hostId !== socket.id) {
            // Only the host can send sync commands
            // console.warn(`Non-host ${socket.id} attempted to send video_sync for room ${user.roomId}`);
            return;
        }

        // Update the room's video state
        room.videoState = {
            playing: state.playing,
            currentTime: state.currentTime
        };

        // Emit the video state to all other users in the room (excluding the host)
        socket.to(user.roomId).emit('video_sync', room.videoState);
        // console.log(`Video sync for room ${user.roomId}: playing=${state.playing}, time=${state.currentTime}`);
    });

    /**
     * Handles 'set_video_url' event.
     * Allows the host to change the video URL for the room.
     */
    socket.on('set_video_url', ({ roomId, videoUrl }) => {
        const room = rooms[roomId];
        if (!room || room.hostId !== socket.id) {
            socket.emit('error_message', 'Only the host can set the video URL.');
            return;
        }

        room.videoUrl = videoUrl;
        room.videoState = { playing: false, currentTime: 0 }; // Reset video state on URL change

        console.log(`Room ${roomId}: Video URL changed to ${videoUrl} by host ${socket.id}`);

        // Emit new video URL and reset state to all users in the room
        io.to(roomId).emit('video_url_updated', { videoUrl: videoUrl, videoState: room.videoState });
    });


    // --- Chat Events ---

    /**
     * Handles 'chat_message' event.
     * Relays a text message to all users in the same room.
     */
    socket.on('chat_message', (message) => {
        const user = users[socket.id];
        if (!user) return; // User not associated with a room

        const room = rooms[user.roomId];
        if (!room) return; // Room does not exist

        // Emit the message to all users in the room
        io.to(user.roomId).emit('chat_message', {
            username: user.username,
            message: message,
            timestamp: Date.now()
        });
        console.log(`Chat in room ${user.roomId} from ${user.username}: ${message}`);
    });

    // --- Disconnection Handling ---

    /**
     * Handles 'disconnect' event.
     * Cleans up user data and notifies other users in the room.
     */
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const user = users[socket.id];

        if (user) {
            const roomId = user.roomId;
            const room = rooms[roomId];

            if (room) {
                // Check if the disconnected user was the host
                if (room.hostId === socket.id) {
                    // Host disconnected, close the room
                    console.log(`Host ${socket.id} for room ${roomId} disconnected. Closing room.`);
                    io.to(roomId).emit('room_closed', 'The host has disconnected. The room is now closed.');
                    // Clean up all users in this room as well
                    for (const userId in room.users) {
                        delete users[userId];
                    }
                    for (const userId in room.pendingRequests) {
                        delete users[userId];
                    }
                    delete rooms[roomId]; // Remove the room from memory
                } else {
                    // Regular user disconnected
                    // Remove from approved users or pending requests
                    if (room.users[socket.id]) {
                        delete room.users[socket.id];
                        // Notify others in the room that a user has left
                        io.to(roomId).emit('user_left', { socketId: socket.id, username: user.username });
                        console.log(`User ${user.username} (${socket.id}) left room ${roomId}.`);
                    } else if (room.pendingRequests[socket.id]) {
                        delete room.pendingRequests[socket.id];
                        // Notify host that a pending requester disconnected
                        io.to(room.hostId).emit('room_data_update', {
                            pendingRequests: Object.values(room.pendingRequests)
                        });
                        console.log(`Pending requester ${user.username} (${socket.id}) disconnected from room ${roomId}.`);
                    }
                }
            }
            delete users[socket.id]; // Remove user from global users map
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

