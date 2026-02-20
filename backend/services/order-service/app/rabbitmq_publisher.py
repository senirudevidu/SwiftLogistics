import pika
import json

def publish_order(order: dict):
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
    channel = connection.channel()
    channel.queue_declare(queue='order_queue', durable=True)
    channel.basic_publish(
        exchange='',
        routing_key='order_queue',
        body=json.dumps(order)
    )
    connection.close()
    