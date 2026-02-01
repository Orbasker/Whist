"""Custom exceptions"""


class GameNotFoundError(Exception):
    """Game not found exception"""
    pass


class InvalidBidsError(Exception):
    """Invalid bids exception"""
    pass


class InvalidTricksError(Exception):
    """Invalid tricks exception"""
    pass
