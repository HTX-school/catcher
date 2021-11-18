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

let settings = { 
    max_distance: 100,
    min_distance: 5
}

let players = {}

io.on('connect', socket => {
    console.log(`Client connected. There's now ${io.engine.clientsCount} online.`);

    players[socket.id] = {
        name: socket.id,
        pos: undefined
    }

    socket.emit('join', { player_id: socket.id, settings })
    io.emit('player-count', io.engine.clientsCount)

    socket.on('name_change', new_name => {
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

        let distance_list = {}

        for (const [key, value] of Object.entries(players))
        {
            if (key == socket.id || value.pos == undefined) continue;

            let dist = vin(pos.latitude, pos.longitude, value.position.latitude, value.position.longitude)
            let name = value.name

            console.log(key)
            if (dist > settings.max_distance || dist < settings.min_distance) continue;
            distance_list[name] = dist
        }

        socket.emit('player_distances', distance_list)
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
        console.log(`Client disconnected. There's now ${io.engine.clientsCount} online.`);
        io.emit('player-count', io.engine.clientsCount)
    })
})

server.listen(port, hostname, () => console.log(`Socker.io is listening on ${hostname}:${port}`))
