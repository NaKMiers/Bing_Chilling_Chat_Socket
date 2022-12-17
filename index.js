require('dotenv').config()
const io = require('socket.io')(process.env.PORT, {
   cors: {
      origin: process.env.CLIENT,
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
      console.log('receiverIds', receiverIds)
      console.log('users will receive', users)
      if (users.length) {
         for (let user of users) {
            io.to(user.socketId).emit('receive-message', data)
         }
      }
   })

   // user-add-new-room
   socket.on('user-add-new-room', data => {
      const { userId, roomId } = data
      activeUsers = activeUsers.map(user =>
         user.userId === userId ? { ...user, rooms: (user.rooms = [...user.rooms, roomId]) } : user
      )
      console.log('Add', activeUsers)
   })

   // join room
   socket.on('join-room', data => {
      const { userJoinId, roomId } = data
      console.log(data)
      const users = activeUsers.filter(user => {
         return user.rooms.includes(roomId)
      })

      activeUsers = activeUsers.map(user =>
         user.userId === userJoinId ? { ...user, rooms: (user.rooms = [...user.rooms, roomId]) } : user
      )
      console.log('users will take joining: ', users)
      if (users.length) {
         for (let user of users) {
            io.to(user.socketId).emit('join-room', data)
         }
      }
   })

   // leave room
   socket.on('leave-room', data => {
      const { userLeaveId, roomId } = data
      console.log(data)
      const users = activeUsers.filter(user => {
         return user.rooms.includes(roomId)
      })

      activeUsers = activeUsers.map(user =>
         user.userId === userLeaveId ? { ...user, rooms: user.rooms.filter(id => id !== roomId) } : user
      )

      console.log('users will take leaving: ', users)
      if (users.length) {
         for (let user of users) {
            io.to(user.socketId).emit('leave-room', data)
         }
      }
   })
})
