from aiogram import Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from keyboards import app_button, rows

router = Router()


@router.message(CommandStart())
async def start(message: Message, webapp_url: str) -> None:
    name = message.from_user.first_name if message.from_user else ""
    await message.answer(
        f"Salom, {name}! 👋\n\n"
        "<b>KiGo</b> — sherik topish, joy bron qilish va turnirlar bir joyda.\n"
        "Bilyard, futbol, padel, tennis va boshqa sport turlari.",
        reply_markup=rows(
            [app_button("Ilovani ochish", webapp_url)],
            [app_button("Sherik topish", webapp_url, "/games"), app_button("Joy bron qilish", webapp_url, "/search")],
        ),
    )


@router.message(Command("bronlarim"))
async def my_bookings(message: Message, webapp_url: str) -> None:
    await message.answer("Bronlaringiz profilda:", reply_markup=rows([app_button("Bronlarim", webapp_url, "/profile")]))


@router.message(Command("turnirlar"))
async def tournaments(message: Message, webapp_url: str) -> None:
    await message.answer(
        "Turnirlar va arizalaringiz:",
        reply_markup=rows(
            [app_button("Turnirlar", webapp_url, "/tournament/pirat-cup")],
            [app_button("Mening arizalarim", webapp_url, "/applications")],
            [app_button("Turnir o‘tkazish", webapp_url, "/tournament-apply")],
        ),
    )


@router.message(Command("help"))
async def help_(message: Message) -> None:
    await message.answer(
        "/start — ilovani ochish\n"
        "/bronlarim — bronlarim\n"
        "/turnirlar — turnirlar va arizalar\n\n"
        "Savol bo‘lsa: @kigo_sherik"
    )
