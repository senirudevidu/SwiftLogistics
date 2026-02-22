import pika
import json
import socket
import threading
import time
import os
import requests

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
WMS_HOST = os.getenv("WMS_HOST", "wms-mock")
WMS_TCP_PORT = 9000
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8000")
EXCHANGE_NAME = "order_exchange"

def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"Received order: {order}")

    # Send order to Mock WMS via TCP
    def tcp_send_order(order):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((WMS_HOST, WMS_TCP_PORT))
                s.sendall(json.dumps(order).encode())
                while True:
                    data = s.recv(1024)
                    if not data:
                        break
                    status_update = data.decode()
                    print(f"Received status update from Mock WMS: {status_update}")

                    # Parse status and update Order Service
                    try:
                        update = json.loads(status_update)
                        resp = requests.put(
                            f"{ORDER_SERVICE_URL}/update-status",
                            json={
                                "order_id": update["order_id"],
                                "status": update["status"]
                            },
                            timeout=5
                        )
                        print(f"Order status update sent: {resp.status_code}, {resp.text}")
                    except Exception as e:
                        print(f"Failed to update order status in Order Service: {e}")
        except Exception as e:
            print(f"TCP communication error: {e}")

    threading.Thread(target=tcp_send_order, args=(order,)).start()

def start_consuming():
    """Connect to RabbitMQ with retry logic and consume from fanout exchange."""
    for attempt in range(30):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT)
            )
            channel = connection.channel()

            # Declare the fanout exchange (must match publisher)
            channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='fanout', durable=True)

            # Create a named queue for this consumer and bind it to the exchange
            result = channel.queue_declare(queue='wms_adapter_queue', durable=True)
            queue_name = result.method.queue
            channel.queue_bind(exchange=EXCHANGE_NAME, queue=queue_name)

            channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

            print(f'WMS Adapter connected to RabbitMQ. Waiting for messages on {queue_name}...')
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError as e:
            print(f"RabbitMQ connection attempt {attempt+1}/30 failed: {e}")
            time.sleep(3)
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(3)
    print("Failed to connect to RabbitMQ after 30 attempts. Exiting.")

if __name__ == "__main__":
    start_consuming()