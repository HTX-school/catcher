const server = require('http').createServer()
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

const port = 5000

io.on('connect', socket => {
    console.log(`Client connected. There's now ${io.engine.clientsCount} online.`);

    socket.on('position', pos => {
        // console.log(`${socket.id}:`, pos)
    })

    socket.on('disconnect', () => {
        console.log(`Client disconnected. There's now ${io.engine.clientsCount} online.`);
    })
})

server.listen(port, () => console.log(`Server listening on *:${port}`))