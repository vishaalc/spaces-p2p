const signalhub = require('signalhub')
const hub = signalhub('spaces', [
	'http://localhost:8080'
])

const Player = require('./player.js')
const me = new Player()

const peers = {}

hub.subscribe('update').on('data', data =>{
	// console.log(data)
	if (data.color == me.color) return
	if (!peers[data.color]) {
		peers[data.color] = new Player(data)
	}
	peers[data.color].update(data)
})

setInterval(() => {
	// hub.broadcast('update', window.location.hash)
	me.update()
	hub.broadcast('update', me)
}, 100)

document.addEventListener('keypress', e => {
	const speed = 16
	switch (e.key) {
		case 'a':
			me.x -= speed
			break
		case 'd':
			me.x += speed
			break
		case 'w':
			me.y -= speed
			break
		case 's':
			me.y += speed
			break
	}
}, false)