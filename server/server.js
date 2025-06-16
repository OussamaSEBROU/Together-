// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

const rooms = {}; // Store active rooms

io.on('connection', (socket) => {
    console.log(`[CONNECT] User connected: ${socket.id}`);

    // Host: Create Room
    socket.on('create_room', ({ username, videoUrl }) => {
        const roomId = generateRoomId();
        const hostDisplayName = `${username} - admin`; // Define host's display name
        rooms[roomId] = {
            hostId: socket.id,
            videoUrl: videoUrl,
            videoState: { playing: false, currentTime: 0 },
            users: [{ id: socket.id, username: hostDisplayName, isHost: true }], // Store display name for host
            messages: [],
            pendingRequests: []
        };
        socket.join(roomId);
        socket.emit('room_created', roomId);
        io.to(roomId).emit('user_joined', { username: hostDisplayName, socketId: socket.id }); // Announce host joined
        console.log(`[CREATE_ROOM] Room ${roomId} created by host ${hostDisplayName} (${socket.id}) with video ${videoUrl}`);
        io.to(roomId).emit('room_data_update', { users: rooms[roomId].users, pendingRequests: rooms[roomId].pendingRequests });
    });

    // Client: Join Request
    socket.on('join_request', ({ roomId, username }) => {
        console.log(`[JOIN_REQUEST] Received join request from ${username} (${socket.id}) for room ${roomId}`);
        const room = rooms[roomId];
        if (!room) {
            console.log(`[JOIN_REQUEST] Room ${roomId} not found. Rejecting ${username} (${socket.id}).`);
            socket.emit('join_rejected', 'Room does not exist.');
            return;
        }

        // Check if user is already in the room or has a pending request
        if (room.users.some(user => user.id === socket.id)) {
            console.log(`[JOIN_REQUEST] User ${username} (${socket.id}) already in room ${roomId}. Approving directly.`);
            socket.join(roomId); // Ensure they are still in the Socket.IO room
            socket.emit('join_approved', {
                videoUrl: room.videoUrl,
                videoState: room.videoState,
                users: room.users,
                messages: room.messages // Crucial: Send existing chat messages
            });
            io.to(roomId).emit('room_data_update', { users: room.users, pendingRequests: room.pendingRequests });
            return;
        }
        if (room.pendingRequests.some(req => req.requesterSocketId === socket.id)) {
            console.log(`[JOIN_REQUEST] User ${username} (${socket.id}) already has a pending request for room ${roomId}. Re-sending pending message.`);
            socket.emit('join_pending', 'Your join request is still pending host approval.');
            return;
        }

        room.pendingRequests.push({ requesterSocketId: socket.id, username: username });
        socket.emit('join_pending', 'Your join request has been sent to the host. Please wait for approval.');
        io.to(room.hostId).emit('new_join_request', { requesterSocketId: socket.id, username: username });
        console.log(`[JOIN_REQUEST] New pending request from ${username} (${socket.id}) for room ${roomId}. Notifying host.`);
        io.to(room.hostId).emit('room_data_update', { users: room.users, pendingRequests: room.pendingRequests }); // Only update host on new request
    });

    // Host: Approve Join
    socket.on('approve_join', ({ roomId, requesterSocketId }) => {
        console.log(`[APPROVE_JOIN] Host (${socket.id}) attempting to approve ${requesterSocketId} for room ${roomId}`);
        const room = rooms[roomId];
        if (!room || socket.id !== room.hostId) {
            console.log(`[APPROVE_JOIN] Error: ${socket.id} is not host of room ${roomId}.`);
            socket.emit('error_message', 'You are not the host of this room.');
            return;
        }

        const requestIndex = room.pendingRequests.findIndex(req => req.requesterSocketId === requesterSocketId);
        if (requestIndex === -1) {
            console.log(`[APPROVE_JOIN] Error: Join request for ${requesterSocketId} not found in room ${roomId}'s pending list.`);
            socket.emit('error_message', 'Join request not found or already processed.');
            return;
        }

        const { username } = room.pendingRequests[requestIndex];
        room.pendingRequests.splice(requestIndex, 1); // Remove from pending
        room.users.push({ id: requesterSocketId, username: username, isHost: false }); // Add to active users

        // THIS IS CRUCIAL: Make the requester's socket join the specific Socket.IO room
        io.sockets.sockets.get(requesterSocketId)?.join(roomId);
        console.log(`[APPROVE_JOIN] Socket ${requesterSocketId} explicitly joined room ${roomId}.`);

        // Inform the newly approved user
        io.to(requesterSocketId).emit('join_approved', {
            videoUrl: room.videoUrl,
            videoState: room.videoState,
            users: room.users, // Send updated user list
            messages: room.messages // Crucial: Send existing chat messages to new user
        });
        console.log(`[APPROVE_JOIN] Sent 'join_approved' to ${requesterSocketId} for room ${roomId}.`);

        // Inform all existing users in the room (including host) about the new user
        io.to(roomId).emit('user_joined', { username: username, socketId: requesterSocketId });
        console.log(`[APPROVE_JOIN] Broadcast 'user_joined' for ${username} (${requesterSocketId}) to room ${roomId}.`);

        // Broadcast updated room data to everyone in the room (users and pending requests)
        io.to(roomId).emit('room_data_update', { users: room.users, pendingRequests: room.pendingRequests });
        console.log(`[APPROVE_JOIN] Broadcast 'room_data_update' to room ${roomId}. Current users: ${room.users.map(u => u.username).join(', ')}. Pending: ${room.pendingRequests.length}`);
    });

    // Host: Reject Join
    socket.on('reject_join', ({ roomId, requesterSocketId }) => {
        console.log(`[REJECT_JOIN] Host (${socket.id}) attempting to reject ${requesterSocketId} for room ${roomId}`);
        const room = rooms[roomId];
        if (!room || socket.id !== room.hostId) {
            console.log(`[REJECT_JOIN] Error: ${socket.id} is not host or room not found.`);
            socket.emit('error_message', 'You are not the host of this room.');
            return;
        }

        const requestIndex = room.pendingRequests.findIndex(req => req.requesterSocketId === requesterSocketId);
        if (requestIndex === -1) {
            console.log(`[REJECT_JOIN] Error: Join request for ${requesterSocketId} not found.`);
            socket.emit('error_message', 'Join request not found.');
            return;
        }

        const { username } = room.pendingRequests.splice(requestIndex, 1)[0]; // Remove from pending
        io.to(requesterSocketId).emit('join_rejected', 'Host rejected your request.');
        console.log(`[REJECT_JOIN] Sent 'join_rejected' to ${requesterSocketId}.`);
        io.to(room.hostId).emit('room_data_update', { users: room.users, pendingRequests: room.pendingRequests }); // Only update host
        // Do not update other users with pending requests unless they need to know someone was rejected
    });


    // Host: Video Sync (sent frequently by host)
    socket.on('video_sync', (state) => {
        const roomId = Object.keys(rooms).find(id => rooms[id].hostId === socket.id);
        if (roomId && rooms[roomId]) {
            rooms[roomId].videoState = state;
            // Broadcast to all other users in the room (excluding the sender/host)
            socket.to(roomId).emit('video_sync', state);
            // console.log(`[VIDEO_SYNC] Room ${roomId}: Host ${socket.id} synced video state. Playing: ${state.playing}, Time: ${state.currentTime.toFixed(2)}`);
        }
    });

    // Host: Set New Video URL
    socket.on('set_video_url', ({ roomId, videoUrl }) => {
        console.log(`[SET_VIDEO_URL] Host (${socket.id}) attempting to set video URL for room ${roomId}`);
        const room = rooms[roomId];
        if (!room || socket.id !== room.hostId) {
            console.log(`[SET_VIDEO_URL] Error: ${socket.id} is not host or room not found.`);
            socket.emit('error_message', 'Only the host can change the video URL.');
            return;
        }
        if (!videoUrl) {
            console.log(`[SET_VIDEO_URL] Error: Video URL cannot be empty.`);
            socket.emit('error_message', 'Video URL cannot be empty.');
            return;
        }

        room.videoUrl = videoUrl;
        room.videoState = { playing: false, currentTime: 0 }; // Reset video state
        io.to(roomId).emit('video_url_updated', { videoUrl: videoUrl, videoState: room.videoState });
        console.log(`[SET_VIDEO_URL] Room ${roomId}: Video URL updated to ${videoUrl} by host ${socket.id}`);
    });


    // Chat Message
    socket.on('chat_message', (message) => {
        let roomId = null;
        let currentUser = null;
        for (const id in rooms) {
            const user = rooms[id].users.find(u => u.id === socket.id);
            if (user) {
                roomId = id;
                currentUser = user;
                break;
            }
        }

        if (roomId && rooms[roomId] && currentUser) {
            // Use the username from the stored user object (which includes '-admin' for host)
            const chatMsg = { username: currentUser.username, message: message, timestamp: Date.now() };
            rooms[roomId].messages.push(chatMsg); // Store message
            io.to(roomId).emit('chat_message', chatMsg); // Broadcast to all in room
            console.log(`[CHAT] Room ${roomId}: ${currentUser.username}: ${message}`);
        } else {
            console.log(`[CHAT] Error: Could not find room for socket ${socket.id} to send message.`);
            socket.emit('error_message', 'Could not send message: Not in a valid room.');
        }
    });

    // User Disconnect
    socket.on('disconnect', () => {
        console.log(`[DISCONNECT] User disconnected: ${socket.id}`);
        for (const roomId in rooms) {
            const room = rooms[roomId];

            // If disconnected user was the host
            if (room.hostId === socket.id) {
                io.to(roomId).emit('room_closed', 'Host disconnected. Room closed.');
                console.log(`[DISCONNECT] Room ${roomId} closed due to host disconnection.`);
                delete rooms[roomId];
                return;
            }

            // If disconnected user was a regular participant
            const userIndex = room.users.findIndex(user => user.id === socket.id);
            if (userIndex !== -1) {
                const [disconnectedUser] = room.users.splice(userIndex, 1);
                io.to(roomId).emit('user_left', { username: disconnectedUser.username });
                io.to(roomId).emit('room_data_update', { users: room.users, pendingRequests: room.pendingRequests });
                console.log(`[DISCONNECT] User ${disconnectedUser.username} (${socket.id}) left room ${roomId}.`);
                return;
            }

            // If disconnected user had a pending request
            const pendingIndex = room.pendingRequests.findIndex(req => req.requesterSocketId === socket.id);
            if (pendingIndex !== -1) {
                const [removedPending] = room.pendingRequests.splice(pendingIndex, 1);
                io.to(room.hostId).emit('room_data_update', { users: room.users, pendingRequests: room.pendingRequests }); // Only update host
                console.log(`[DISCONNECT] Pending request from ${removedPending.username} (${socket.id}) for room ${roomId} cancelled.`);
                return;
            }
        }
    });
});

function generateRoomId() {
    return Math.random().toString(36).substring(2, 9);
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

