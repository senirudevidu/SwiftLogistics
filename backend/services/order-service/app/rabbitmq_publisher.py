import pika, json, time, logging, os

logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
EXCHANGE_NAME = "order_exchange"

def publish_order(order: dict):
    for attempt in range(5):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT)
            )
            channel = connection.channel()
            channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='fanout', durable=True)
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key='',
                body=json.dumps(order),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            logger.info(f"Published order to {EXCHANGE_NAME}: {order}")
            connection.close()
            return
        except Exception as e:
            logger.warning(f"RabbitMQ publish attempt {attempt+1} failed: {e}")
            time.sleep(2)
    logger.error("Failed to publish order after 5 attempts")
