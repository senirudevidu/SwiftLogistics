import socket
import threading
import json
import time

HOST = '0.0.0.0'
PORT = 9000

statuses = ["Ready", "Loaded", "Dispatched"]

def handle_client(conn, addr):
    print(f"Connected by {addr}")
    order_data = conn.recv(1024)
    order = json.loads(order_data.decode())
    print(f"Received order: {order}")
    for status in statuses:
        time.sleep(5)
        update = json.dumps({"order_id": order.get("order_id"), "status": status})
        conn.sendall(update.encode())
        print(f"Sent status: {status}")
    conn.close()

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    print(f"Mock WMS TCP server listening on {HOST}:{PORT}")
    while True:
        conn, addr = s.accept()
        threading.Thread(target=handle_client, args=(conn, addr)).start()
