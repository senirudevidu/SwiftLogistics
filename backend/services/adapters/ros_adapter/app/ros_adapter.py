import pika
import json

def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"Received order: {order}")

    # Forward order to ROS mock system via REST
    import requests
    try:
        response = requests.post(
            "http://ros-mock-system:8000/process_order",  # Update host/port as needed
            json=order,
            timeout=5
        )
        print(f"Forwarded order to ROS mock system, response: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Failed to forward order to ROS mock system: {e}")

connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
channel = connection.channel()
channel.queue_declare(queue='order_queue', durable=True)
channel.basic_consume(queue='order_queue', on_message_callback=callback, auto_ack=True)

print('Waiting for messages. To exit press CTRL+C')
channel.start_consuming()