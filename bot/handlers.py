from aiogram import F, Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message

from backend import Backend
from keyboards import app_button, rows

router = Router()


# CRM sign-in: the admin panel links to t.me/<bot>?start=login_<token>
@router.message(CommandStart(deep_link=True, magic=F.args.startswith("login_")))
async def crm_login(message: Message, command: CommandObject, backend: Backend) -> None:
    token = command.args.removeprefix("login_")
    check = await backend.login_check(token, message.from_user)
    if not check.get("ok"):
        await message.answer(f"⚠️ {check.get('reason', 'Kirib bo‘lmadi')}")
        return
    await message.answer(
        "🔐 <b>KiGo Admin panelga kirish</b>\n\n"
        "Hozir brauzerda admin.kigo.uz ga kirish so‘raldi. Bu siz bo‘lsangiz, tasdiqlang.\n"
        "<i>Agar so‘ramagan bo‘lsangiz, «Bekor qilish» ni bosing.</i>",
        reply_markup=rows([
            InlineKeyboardButton(text="✅ Kirish", callback_data=f"lg:1:{token}"),
            InlineKeyboardButton(text="Bekor qilish", callback_data=f"lg:0:{token}"),
        ]),
    )


@router.callback_query(F.data.startswith("lg:"))
async def crm_login_answer(call: CallbackQuery, backend: Backend) -> None:
    _, approve, token = call.data.split(":", 2)
    r = await backend.login_confirm(token, call.from_user, approve == "1")
    text = f"✅ Kirdingiz, {r.get('name', '')}. Brauzerga qayting." if r.get("ok") else f"✕ {r.get('reason', 'Bekor qilindi')}"
    await call.message.edit_text(text)
    await call.answer()


@router.message(CommandStart())
async def start(message: Message, webapp_url: str, backend: Backend) -> None:
    await backend.seen(message.from_user)
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
            [app_button("Turnirlar", webapp_url, "/tournament")],
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
