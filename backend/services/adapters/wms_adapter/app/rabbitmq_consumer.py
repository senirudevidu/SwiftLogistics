import pika
import json

def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"Received order: {order}")

connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
channel = connection.channel()
channel.queue_declare(queue='order_queue', durable=True)
channel.basic_consume(queue='order_queue', on_message_callback=callback, auto_ack=True)

print('Waiting for messages. To exit press CTRL+C')
channel.start_consuming()