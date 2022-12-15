const io = require('socket.io')('3002', {
   cors: {
      origin: 'http://localhost:3000',
   },
})

let activeUsers = []

io.on('connection', socket => {
   // add active user
   socket.on('new-user-add', ({ newUserId, rooms }) => {
      if (newUserId && !activeUsers.some(user => user.userId === newUserId)) {
         activeUsers.push({ userId: newUserId, socketId: socket.id, rooms })
      }
      console.log('Connected users', activeUsers)
      io.emit('get-users', activeUsers)
   })

   // disconnection
   socket.on('disconnect', () => {
      activeUsers = activeUsers.filter(user => user.socketId !== socket.id)
      console.log('User disconnect', activeUsers)
      io.emit('get-users', activeUsers)
   })

   // send message
   socket.on('send-message', data => {
      const { receiverIds } = data
      const users = activeUsers.filter(user => receiverIds.includes(user.userId))
      console.log('users will receive', users)
      if (users.length) {
         for (let user of users) {
            io.to(user.socketId).emit('receive-message', data)
         }
      }
   })

   // join room
   socket.on('join-room', data => {
      const { roomId } = data
      console.log(data)
      const users = activeUsers.filter(user => {
         return user.rooms.includes(roomId)
      })
      console.log('users will take joining: ', users)
      if (users.length) {
         for (let user of users) {
            io.to(user.socketId).emit('join-room', data)
         }
      }
   })

   // leave room
   socket.on('leave-room', data => {
      const { roomId } = data
      console.log(data)
      const users = activeUsers.filter(user => {
         return user.rooms.includes(roomId)
      })
      console.log('users will take leaving: ', users)
      if (users.length) {
         for (let user of users) {
            io.to(user.socketId).emit('leave-room', data)
         }
      }
   })
})
