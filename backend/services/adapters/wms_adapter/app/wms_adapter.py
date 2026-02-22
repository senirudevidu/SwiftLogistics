import pika
import json

def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"Received order: {order}")

    # Send order to Mock WMS via TCP
    import socket
    import threading

    def tcp_send_order(order):
        HOST = '0.0.0.0'  # Update to actual hostname/IP
        PORT = 9000
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((HOST, PORT))
                s.sendall(json.dumps(order).encode())
                while True:
                    data = s.recv(1024)
                    if not data:
                        break
                    status_update = data.decode()
                    print(f"Received status update from Mock WMS: {status_update}")
                    # TODO: Forward status update to order-service
        except Exception as e:
            print(f"TCP communication error: {e}")

    threading.Thread(target=tcp_send_order, args=(order,)).start()

connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
channel = connection.channel()
channel.queue_declare(queue='order_queue', durable=True)
channel.basic_consume(queue='order_queue', on_message_callback=callback, auto_ack=True)

print('Waiting for messages. To exit press CTRL+C')
channel.start_consuming()