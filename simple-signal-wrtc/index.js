const signalhub = require('signalhub')
const createSwarm = require('webrtc-swarm')
const hub = signalhub('spaces', [
	'http://localhost:8080'
])
// new webrtc swarm with signalhub to discover + broker
const swarm = createSwarm(hub)

const Player = require('./player.js')
const me = new Player()

const peers = {}

// Create WRTC Swarm and map it with Signalhub
// peer is a simple-peer instance
swarm.on('connect', (peer, id) => {
	if (!peers[id]) {
		peers[id] = new Player()
	}
	// peer.send receiver
	peer.on('data', data => {
		data = JSON.parse(data.toString())
		peers[id].update(data)
	})
})

swarm.on('disconnect', (peer, id) => {
	if (peers[id]) {
		peers[id].element.parentNode.removeChild(peers[id].element)
		delete peers[id]
	}
})

setInterval(() => {
	me.update()
	const meString = JSON.stringify(me)
	swarm.peers.forEach(peer => {
		peer.send(meString)
	})
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