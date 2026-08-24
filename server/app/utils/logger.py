import logging

class CustomFormatter(logging.Formatter):
    green = "\x1b[32;1m"
    yellow = "\x1b[33;1m"
    red = "\x1b[31;1m"
    cyan = "\x1b[36;1m"
    reset = "\x1b[0m"
    format_str = "[%(levelname)s] %(asctime)s - %(message)s"

    FORMATS = {
        logging.DEBUG: cyan + format_str + reset,
        logging.INFO: green + format_str + reset,
        logging.WARNING: yellow + format_str + reset,
        logging.ERROR: red + format_str + reset,
        logging.CRITICAL: red + format_str + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt, datefmt="%Y-%m-%dT%H:%M:%S")
        return formatter.format(record)

logger = logging.getLogger("CarePulse")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setFormatter(CustomFormatter())
if not logger.handlers:
    logger.addHandler(handler)
