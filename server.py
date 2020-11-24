import sys
import socket
import threading

class Server:
	sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	conns = []
	def __init__(self):
		self.sock.bind(('0.0.0.0', 8888))
		self.sock.listen(1)

	def handler(self, conn, addr, conns):
		while True:
			# Handle messages
			data = conn.recv(1024)
			for c in conns:
				c.send(bytes(data))

			# Remove disconnected
			if not data:
				print('{}:{} disconnected'.format(addr[0], addr[1]))
				self.conns.remove(conn)
				conn.close()
				break

	def run(self):
		while True:
			conn, addr = self.sock.accept()
			# Threads for multiple connections
			conn_thread = threading.Thread(
				target=self.handler,
				args=(conn, addr, self.conns),
				daemon=True) # close on program exit

			# Begin session
			conn_thread.start()
			self.conns.append(conn)
			print('{}:{} connected'.format(addr[0], addr[1]))

class Client:
	sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

	def __init__(self, address):
		self.sock.connect((address, 8888))
		# Send Data (background)
		cli_thread = threading.Thread(
			target=self.send,
			daemon=True)
		cli_thread.start()

		# Receive Data
		while True:
			data = self.sock.recv(1024)
			if not data:
				break
			print(str(data, 'utf-8'))

	def send(self):
		# Raw encode
		while True:
			self.sock.send(bytes(input(""), 'utf-8'))

if __name__ == '__main__':
	# Run as server or client
	if len(sys.argv) > 1:
		client = Client(sys.argv[1])
	else:
		server = Server()
		server.run()