import pika
import json

def callback(ch, method, properties, body):
    try:
        order = json.loads(body)
        print(f"Received order: {order}")
        print(f"Order ID: {order.get('order_id')}, Client ID: {order.get('client_id')}, Status: {order.get('status')}")
    except Exception as e:
        print(f"Error processing message: {e}")

connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
channel = connection.channel()
channel.queue_declare(queue='order_queue', durable=True)
channel.basic_consume(queue='order_queue', on_message_callback=callback, auto_ack=True)

print('Waiting for messages. To exit press CTRL+C')
channel.start_consuming()