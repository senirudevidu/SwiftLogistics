import pika
import json
import time
import os
import requests

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
ROS_URL = os.getenv("ROS_URL", "http://ros-mock:8100")
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8000")
EXCHANGE_NAME = "order_exchange"

def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"Received order: {order}")

    # Forward order to ROS mock system via REST for route planning
    try:
        response = requests.post(
            f"{ROS_URL}/process_order",
            json=order,
            timeout=10
        )
        print(f"Forwarded order to ROS mock system, response: {response.status_code}, {response.text}")

        if response.status_code == 200:
            result = response.json()
            driver = result.get("driver")
            if driver and driver.get("driver_id"):
                # Call back to Order Service to assign the driver
                try:
                    update_resp = requests.put(
                        f"{ORDER_SERVICE_URL}/assign-driver",
                        json={
                            "order_id": order["order_id"],
                            "driver_id": driver["driver_id"]
                        },
                        timeout=5
                    )
                    print(f"Driver assignment update: {update_resp.status_code}, {update_resp.text}")
                except Exception as e:
                    print(f"Failed to update driver assignment in Order Service: {e}")
            else:
                print(f"No driver assigned by ROS for order {order['order_id']}")
    except Exception as e:
        print(f"Failed to forward order to ROS mock system: {e}")

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
            result = channel.queue_declare(queue='ros_adapter_queue', durable=True)
            queue_name = result.method.queue
            channel.queue_bind(exchange=EXCHANGE_NAME, queue=queue_name)

            channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

            print(f'ROS Adapter connected to RabbitMQ. Waiting for messages on {queue_name}...')
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