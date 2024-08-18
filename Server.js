const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws'); // Import the ws package

const corsOptions = {
    origin: 'http://10.12.1.3',  // Restrict the allowed origin
    methods: ['GET', 'POST'],        // Allow specific methods
    credentials: true,               // Allow credentials
    optionsSuccessStatus: 200        // For legacy browser support
};

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Apply CORS middleware
    cors(corsOptions)(req, res, () => {
        if (req.method === 'GET' && req.url.startsWith('/messages/')) {
            const user = req.url.split('/')[2]; // Extract user from URL
            const fileName = `messages/${user}.json`;
            const filePath = path.join(__dirname, fileName);

            fs.exists(filePath, (exists) => {
                if (exists) {
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(data);
                        }
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                }
            });
        } 
        
        else if (req.method === 'GET' && req.url === '/index.html') {
            // Serve the index.html file
            const filePath = path.join(__dirname, 'index.html');
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500 - Internal Server Error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } 

        else if (req.method === 'GET' && req.url === '/send.html') {
            // Serve the send.html file
            const filePath = path.join(__dirname, 'send.html');
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500 - Internal Server Error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } 

        else if (req.method === 'POST' && req.url.startsWith('/messages/')) {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const user = req.url.split('/')[2];
                const fileName = `messages/${user}.json`;
                const filePath = path.join(__dirname, fileName);

                fs.readFile(filePath, (err, fileData) => {
                    let messages = [];
                    if (!err) {
                        try {
                            messages = JSON.parse(fileData);
                            if (!Array.isArray(messages.messages)) {
                                throw new Error('File does not contain a valid JSON array');
                            }
                        } catch (parseError) {
                            console.error('Error parsing JSON:', parseError);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            return;
                        }
                    }
                    const newMessage = JSON.parse(body);
                    messages.messages.push(newMessage);

                    fs.writeFile(filePath, JSON.stringify(messages, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error('Error writing to file:', writeErr);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error writing to file');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(messages));
                        }
                    });
                });
            });
        } 
        
        else if (req.method === 'GET' && req.url === '/api/profile/statistics/') {
            // Generate random statistics
            const statistics = {
                win: Math.floor(Math.random() * 100),
                loss: Math.floor(Math.random() * 100),
                draw: Math.floor(Math.random() * 100)
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(statistics));
        } 
        
        else if (req.method === 'POST' && req.url === '/send/') {
            let body = '';
    
            req.on('data', chunk => {
                body += chunk.toString(); // Convert Buffer to string
            });
    
            req.on('end', () => {
                const { user, message, time } = JSON.parse(body);
                console.log(body);
                const messageData = {
                    user: user,
                    message: message,
                    time: time
                };
    
                // Send the message to all connected WebSocket clients
                broadcastMessage(messageData);
    
                // Respond to the GET request
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Message sent to WebSocket clients' }));
            });
        }

        else if (req.method === 'GET' && req.url === '/api/profile/friends/') {
            // Generate friends data with random images
            const friends = [
                { username: 'Alice', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'notactiveuser', rank: 1325 },
                { username: 'Bob', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1150 },
                { username: 'Charlie', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1420 },
                { username: 'JohnDoe', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1234 },
                { username: 'JaneSmith', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'notactiveuser', rank: 567 },
                { username: 'Alice', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1456 },
                { username: 'Bob', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'notactiveuser', rank: 789 },
                { username: 'Alice', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1456 },
                { username: 'Bob', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'notactiveuser', rank: 789 },
                { username: 'Alice', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1456 },
                { username: 'Bob', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'notactiveuser', rank: 789 },
                { username: 'Alice', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'activeuser', rank: 1456 },
                { username: 'Bob', picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/100`, status: 'notactiveuser', rank: 789 }
            ];

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(friends));
        }

        else if (req.method === 'GET' && req.url === '/api/profile/data/') {
            // Generate random profile data
            const profileData = {
                picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/200`,
                username: 'JohnDoe',
                background_picture: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000) + 1000}/600/400`,
                rank: Math.floor(Math.random() * 1000)
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(profileData));
        } 
        
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
});

// Create a WebSocket server
const wss = new WebSocket.Server({ server });
const wsss = new WebSocket.Server({ port: 8001 });

// Send a message to all connected clients
function broadcastMessage(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message)); // Convert message to JSON string
        }
    });
}

function broadcastwsss(message) {
    wsss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message)); // Convert message to JSON string
        }
    });
}

wsss.on('connection', (ws) => {
    console.log('New WebSocket connection for friendship requests');

    ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome to the friendship WebSocket server!' }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message); 
        console.log('Received friendship message:', parsedMessage);

        if (parsedMessage.type === 'friendship_request') {
            // Handle friendship request
            console.log(`Friendship request from: ${parsedMessage.from}`);
            // You can broadcast this request or handle it as needed
        } else if (parsedMessage.type === 'handle_friendship_request') {
            // Handle acceptance or rejection
            console.log(`Friendship request from: ${parsedMessage.from} with status: ${parsedMessage.status}`);
            // You can broadcast this response or handle it as needed
        }

        broadcastwsss(parsedMessage);
    });

    ws.on('close', () => {
        console.log('Friendship WebSocket connection closed');
    });
});

// Example of broadcasting a message when a new connection is established
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    // Send a welcome message to the newly connected client
    ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome to the WebSocket server!' }));

    // Handle incoming messages
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message); // Parse the JSON message
    
        console.log('Received:', parsedMessage);
    
        // Broadcast the parsed message to all connected clients
        broadcastMessage(parsedMessage);
    });

    // Handle connection close
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Send a message from the server to all clients at a specific point in your code


const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
