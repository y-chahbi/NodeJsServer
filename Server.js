const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const corsOptions = {
    origin: 'http://10.13.5.5', 
    methods: ['GET'], 
    optionsSuccessStatus: 200 
};

const server = http.createServer((req, res) => {
    // Apply CORS middleware
    cors(corsOptions)(req, res, () => {
        if (req.method === 'GET' && req.url.startsWith('/messages/')) {
            const user = req.url.split('/')[2]; // Extract user from URL

            // Construct filename
            console.log(user);
            const fileName = `messages/${user}.json`;
            const filePath = path.join(__dirname, fileName);

            // Check if file exists
            fs.exists(filePath, (exists) => {
                if (exists) {
                    // Read file content
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
        
        
        
        
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
