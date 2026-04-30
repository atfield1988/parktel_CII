# backend/app/renew-logging_config.py
import logging
import os

def configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
    )
    try:
        import watchtower
        if os.environ.get("CLOUDWATCH_LOG_GROUP"):
            cw_handler = watchtower.CloudWatchLogHandler(
                log_group=os.environ["CLOUDWATCH_LOG_GROUP"],
                stream_name=os.environ.get("CLOUDWATCH_LOG_STREAM", "{instance_id}"),
                boto3_session=None,
                create_log_group=True
            )
            cw_handler.setLevel(logging.INFO)
            logging.getLogger().addHandler(cw_handler)
            logging.getLogger(__name__).info("CloudWatch logging configured.")
    except Exception as e:
        logging.getLogger(__name__).warning(f"CloudWatch logging not configured: {e}")
