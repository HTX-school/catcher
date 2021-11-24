if (process.env.NODE_ENV !== 'production') require('dotenv').config()

let vin = require('./vincentys')

const server = require('http').createServer()
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 5000

let max_dist = process.env.MAX_DISTANCE || 100
let min_dist = process.env.MIN_DISTANCE || 0

let settings = { 
    max_distance: max_dist,
    min_distance: min_dist
}

let players = {}

io.on('connect', socket => {
    console.log(`Client connected (${io.engine.clientsCount} online)`);

    players[socket.id] = {
        name: socket.id,
        position: undefined
    }

    socket.emit('join', { player_id: socket.id, settings })
    io.emit('players.count', io.engine.clientsCount)

    socket.on('player.name.change', new_name => {
        players[socket.id] = {
            ...players[socket.id],
            name: new_name
        }
    })

    socket.on('chat.message.send', message => {
        mesObj = {
            sender: players[socket.id].name,
            message: message
        }
        console.log(mesObj)
        io.emit('chat.message.received', mesObj)
    })

    socket.on('position', pos => {
        players[socket.id] = {
            ...players[socket.id],
            position: pos,
        }

        let distance_list = []
        
        for (const [key, value] of Object.entries(players))
        {
            if (key == socket.id || value.position == undefined) continue;
            let name = value.name

            let dist = vin(pos.latitude, pos.longitude, value.position.latitude, value.position.longitude)

            if (dist >= min_dist || dist <= max_dist) 
            {
                distance_list.push({name, distance: dist})
            }
        }

        socket.emit('players.distance', distance_list)
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
        console.log(`Client disconnected (${io.engine.clientsCount} online)`);
        io.emit('players.count', io.engine.clientsCount)
    })
})

server.listen(port, hostname, () => console.log(`Socket.io is listening on ${hostname}:${port}`))
