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

let server_settings = {
    long_distance: 100,
    short_distance: 3
}

let players = {}

io.on('connect', socket => {
    console.log(`Client connected. There's now ${io.engine.clientsCount} online.`);

    socket.emit('join', { player_id: socket.id, server_settings })
    socket.emit('player-count', io.engine.clientsCount)

    socket.on('name_change', new_name => {
        players[socket.id] = {
            ...players[socket.id],
            name: new_name
        }
    })

    socket.on('position', pos => {
        players[socket.id] = {
            ...players[socket.id],
            position: pos,
        }
        // Within short dist
        close_player_list = []

        // Within long dist
        near_player_list = []

        for (const [key, value] of Object.entries(players))
        {
            if (key == socket.id) continue;

            let dist = vin(pos.latitude, pos.longitude, value.position.latitude, value.position.longitude)
            let name = value.name ?? key
            if (dist <= server_settings.short_distance)
            {
                close_player_list.push(name)
            }
            else if (dist <= server_settings.long_distance)
            {
                near_player_list.push(name)
            }
        }

        io.to(socket.id).emit('near_player', near_player_list)
        io.to(socket.id).emit('close_player', close_player_list)
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
        console.log(`Client disconnected. There's now ${io.engine.clientsCount} online.`);
        socket.emit('player-count', io.engine.clientsCount)
    })
})

server.listen(port, hostname, () => console.log(`Socker.io is listening on ${hostname}:${port}`))
