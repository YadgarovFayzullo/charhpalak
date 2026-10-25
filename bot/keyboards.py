from urllib.parse import quote

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo


def app_url(base: str, route: str = "") -> str:
    """Mini app URL for a route of the webapp's HashRouter, e.g. route="/profile"."""
    return f"{base}#{route}" if route else base


def app_button(text: str, base: str, route: str = "") -> InlineKeyboardButton:
    return InlineKeyboardButton(text=text, web_app=WebAppInfo(url=app_url(base, route)))


def share_button(text: str, share_text: str, url: str = "https://t.me/kigo_bot") -> InlineKeyboardButton:
    return InlineKeyboardButton(text=text, url=f"https://t.me/share/url?url={quote(url)}&text={quote(share_text)}")


def maps_button(place: str) -> InlineKeyboardButton:
    return InlineKeyboardButton(text="Yo‘nalish", url=f"https://yandex.uz/maps/?text={quote(place + ' Toshkent')}")


def rows(*rows_: list[InlineKeyboardButton]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[r for r in rows_ if r])
