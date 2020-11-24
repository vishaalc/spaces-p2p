import sys
import socket
import threading
import time
from random import randint

class P2P:
	peers = ['127.0.0.1']


class Server:
	conns = []
	peers = []
	def __init__(self):
		# Instantiate socket
		sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		# Reuse socket
		sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

		sock.bind(('0.0.0.0', 8888))
		sock.listen(1)
		print("Server running ...")

		while True:
			conn, addr = sock.accept()

			# Threads for multiple connections
			conn_thread = threading.Thread(
				target=self.handler,
				args=(conn, addr),
				daemon=True) # close on program exit

			# Begin session
			conn_thread.start()
			self.conns.append(conn)

			# Track peer addresses
			P2P.peers.append(addr[0])
			print('{}:{} connected'.format(addr[0], addr[1]))
			self.sendPeersList()

	def handler(self, conn, addr):
		while True:
			# Handle messages
			data = conn.recv(1024)
			for c in self.conns:
				c.send(bytes(data))

			# Remove disconnected
			if not data:
				print('{}:{} disconnected'.format(addr[0], addr[1]))
				self.conns.remove(conn)
				P2P.peers.remove(addr[0])
				conn.close()
				# Update server connections
				self.sendPeersList()
				break

	# Send list of peers
	def sendPeersList(self):
		peers_lst = [str(peer) for peer in P2P.peers]
		peers_str = ','.join(peers_lst)
		for c in self.conns:
			c.send(b'\x11' + bytes(peers_str, 'utf-8'))


class Client:
	def __init__(self, address):
		sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		sock.connect((address, 8888))

		# Send Data (background)
		cli_thread = threading.Thread(
			target=self.sendMessage,
			args=(sock,),
			daemon=True)
		cli_thread.start()

		# Receive Data
		while True:
			data = sock.recv(1024)
			if not data:
				break

			# If peer list
			if data[0:1] == b'\x11':
				print('Got peers list:', data[1:])
				self.updateAllPeers(data[1:])
			else:
				print(str(data, 'utf-8'))

	def sendMessage(self, sock):
		# Raw encode
		while True:
			sock.send(bytes(input(""), 'utf-8'))

	def updateAllPeers(self, peers_str):
		P2P.peers = str(peers_str, 'utf-8').split(',')[:-1]


if __name__ == '__main__':
	# When a server loses connection, randomly pick a client
	while True:
		try:
			print("Trying to connect ...")
			time.sleep(randint(1,5))

			for peer in P2P.peers:
				# Try to connect
				try:
					client = Client(peer)
				except KeyboardInterrupt:
					sys.exit(0)
				except:
					pass

				# Become the server
				try:
					server = Server()
				except KeyboardInterrupt:
					sys.exit(0)
				except:
					print("Failed to start server.")

		except KeyboardInterrupt:
			sys.exit(0)
