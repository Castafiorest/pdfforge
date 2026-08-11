import pytest

from app.services.tools.split import parse_page_spec


def test_single_page():
    assert parse_page_spec("3", 5) == [[2]]


def test_range():
    assert parse_page_spec("1-3", 5) == [[0, 1, 2]]


def test_comma_separated_groups():
    assert parse_page_spec("1,3,7", 8) == [[0], [2], [6]]


def test_mixed():
    assert parse_page_spec("1-3,8-10", 10) == [[0, 1, 2], [7, 8, 9]]


def test_out_of_range_raises():
    with pytest.raises(ValueError):
        parse_page_spec("1-20", 5)


def test_empty_raises():
    with pytest.raises(ValueError):
        parse_page_spec("", 5)
