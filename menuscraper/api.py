#! /usr/bin/python3
import sys

import requests

from scraper import CONFIG

API_URL = "https://graph.facebook.com/v2.6/me/messages?access_token={}" \
            .format(CONFIG["pageAccessToken"])


def parse_recipients(recipients):
    def parse_recipient(recipient):
        """
        recipient -
            A recipient id (str or int)
            A dictionary representing a recipient object
        Returns a recipient object
        """
        if isinstance(recipient, str) or isinstance(recipient, int):
            return {"id": str(recipient)}
        elif isinstance(recipient, dict):
            return recipient
        else:
            return None

    if isinstance(recipients, list) or isinstance(recipients, set):
        for recipient in recipients:
            yield parse_recipient(recipient)
    else:
        yield parse_recipient(recipients)


def parse_message(message):
    if isinstance(message, str):
        return {"text": message}
    elif isinstance(message, dict):
        return message
    else:
        raise ValueError("message is not one of allowed types.")


def parse_function(args, func_dict):
    args[1] = args[1].lower()
    args[2] = set(args[2].split())

    if args[1] in func_dict:
        return func_dict[args[1]](args[2], *args[3:])
    else:
        return func_dict["default"](args[2])


def message_base(message_constructor):
    """
    Function wrapper which sends a message given by calling the function
    in the argument.
    """

    payload = {"recipient": None, "message": None}

    def post_request():
        """
        POST request to Send API
        Returns response object
        """
        r = requests.post(API_URL, json=payload)

        return r

    def message_wrapper(recipients, *args):

        # Check for no information
        check = message_constructor(*args)
        if check is None:
            return [False]

        payload["message"] = parse_message(check)
        success = []
        for recipient in parse_recipients(recipients):
            if recipient is None:
                success.append(False)
            else:
                payload["recipient"] = recipient
                response = post_request()
                try:
                    response.raise_for_status()
                    success.append(True)
                except requests.HTTPError:
                    print(response.text)
                    sys.stdout.flush()
                    success.append(False)

        return all(success)

    return message_wrapper


# Provided as example use
@message_base
def simple_message(message):
    return message
