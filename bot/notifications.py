"""Notification messages from the TG-bot design screen.

Each builder takes the event payload and the webapp URL and returns (text, keyboard).
Payload values are escaped, so text from users and moderators is safe to insert.
"""

from html import escape

from aiogram.types import InlineKeyboardMarkup

from keyboards import app_button, maps_button, rows, share_button

Built = tuple[str, InlineKeyboardMarkup | None]


def _e(data: dict, key: str, default: str = "") -> str:
    return escape(str(data.get(key, default)))


def application_received(d: dict, url: str) -> Built:
    text = (
        "📨 <b>Arizangiz qabul qilindi</b>\n"
        f"«{_e(d, 'title')}» · № {_e(d, 'number')}\n"
        "Admin 24 soat ichida ko‘rib chiqadi. Holatini istalgan vaqtda ko‘rishingiz mumkin."
    )
    return text, rows([app_button("Ariza holati", url, "/applications")])


def info_requested(d: dict, url: str) -> Built:
    text = (
        "⚠️ <b>Qo‘shimcha ma’lumot kerak</b>\n"
        f"Moderator izohi: «{_e(d, 'comment')}»\n\n"
        "<i>72 soat ichida javob bermasangiz ariza yopiladi.</i>"
    )
    return text, rows([app_button("Javob berish", url, "/applications")])


def application_approved(d: dict, url: str) -> Built:
    tid = str(d.get("tournament_id", ""))
    text = (
        "🎉 <b>Turniringiz tasdiqlandi!</b>\n"
        f"«{_e(d, 'title')}» e’lon qilindi. Ro‘yxatdan o‘tish ochiq: {_e(d, 'spots')} joy, {_e(d, 'deadline')}gacha.\n"
        "Turnir kigo.uz saytida va ilova bosh ekranida ko‘rsatilmoqda."
    )
    return text, rows(
        [app_button("Turnirni ochish", url, f"/tournament/{tid}"), share_button("Ulashish", f"«{d.get('title', '')}» turniriga yoziling!")],
        [app_button("Tashkilotchi paneli", url, "/applications")],
    )


def application_rejected(d: dict, url: str) -> Built:
    text = (
        f"❌ «{_e(d, 'title')}» arizasi rad etildi.\n"
        f"Sabab: {_e(d, 'reason')}\n"
        "Tuzatib qayta yuborishingiz mumkin."
    )
    return text, rows([app_button("Tuzatib qayta yuborish", url, "/tournament-apply")])


def new_participant(d: dict, url: str) -> Built:
    text = (
        "👤 <b>Yangi ishtirokchi</b>\n"
        f"{_e(d, 'names')} ro‘yxatdan o‘tdi · to‘lov {_e(d, 'amount')} qabul qilindi. "
        f"Jami: {_e(d, 'count')} / {_e(d, 'max')}."
    )
    return text, None


def booking_confirmed(d: dict, url: str) -> Built:
    paid = f"To‘landi: {_e(d, 'paid')} · " if d.get("paid") else ""
    text = (
        "✅ <b>Bron tasdiqlandi</b>\n"
        f"{_e(d, 'club')}, {_e(d, 'type')}\n"
        f"<b>{_e(d, 'day')}, {_e(d, 'start')}–{_e(d, 'end')}</b>\n"
        f"Bron № {_e(d, 'number')}\n\n"
        f"{paid}Klubda: {_e(d, 'at_club')}\n"
        f"Bepul bekor qilish: {_e(d, 'cancel_until')} gacha"
    )
    return text, rows(
        [app_button("QR kod", url, "/booking/done"), maps_button(str(d.get("club", "")))],
        [app_button("Bronlarim", url, "/profile")],
    )


def booking_reminder(d: dict, url: str) -> Built:
    text = (
        "⏰ <b>1 soatdan keyin o‘yin</b>\n"
        f"{_e(d, 'club')} · {_e(d, 'start')}\n"
        "QR kodni klubda ko‘rsating."
    )
    return text, rows([app_button("QR kod", url, "/booking/done"), maps_button(str(d.get("club", "")))])


def lead_approved(d: dict, url: str) -> Built:
    text = (
        f"✅ <b>{_e(d, 'kind')} arizangiz tasdiqlandi</b>\n"
        f"«{_e(d, 'title')}»\n"
        "Menejer tez orada siz bilan bog‘lanib, profilni sozlab beradi."
    )
    return text, rows([app_button("Ilovani ochish", url)])


def lead_info_requested(d: dict, url: str) -> Built:
    text = (
        "⚠️ <b>Qo‘shimcha ma’lumot kerak</b>\n"
        f"«{_e(d, 'title')}» arizasi bo‘yicha: «{_e(d, 'comment')}»\n\n"
        f"<i>Javobni {_e(d, 'deadline', '72 soat')} ichida @kigo_sherik ga yuboring.</i>"
    )
    return text, None


def lead_rejected(d: dict, url: str) -> Built:
    return f"❌ «{_e(d, 'title')}» arizasi rad etildi.\nSabab: {_e(d, 'reason')}", None


def tournament_stopped(d: dict, url: str) -> Built:
    refund = f"\nTo‘langan {_e(d, 'refund')} kartangizga qaytariladi." if d.get("refund") else ""
    text = f"⛔ <b>«{_e(d, 'title')}» turniri to‘xtatildi</b>\nSabab: {_e(d, 'reason')}{refund}"
    return text, rows([app_button("Turnirlar", url, "/tournament")])


def refund_approved(d: dict, url: str) -> Built:
    text = (
        "💸 <b>Pul qaytarildi</b>\n"
        f"{_e(d, 'club')} · {_e(d, 'day')}, {_e(d, 'start')}\n"
        f"{_e(d, 'amount')} 1–3 ish kunida kartangizga tushadi."
    )
    return text, rows([app_button("Bronlarim", url, "/profile")])


def refund_denied(d: dict, url: str) -> Built:
    text = (
        "Pul qaytarish rad etildi\n"
        f"{_e(d, 'club')} · {_e(d, 'day')}, {_e(d, 'start')}\n"
        "Bron o‘yinga 2 soatdan kam qolganda bekor qilingan. Savol bo‘lsa: @kigo_sherik"
    )
    return text, None


def complaint_reply(d: dict, url: str) -> Built:
    return f"📩 <b>Shikoyatingiz bo‘yicha javob</b>\n«{_e(d, 'title')}»\n\n{_e(d, 'reply')}", None


def staff_invited(d: dict, url: str) -> Built:
    return (f"👋 {_e(d, 'by')} sizni <b>KiGo Admin</b> jamoasiga qo‘shdi ({_e(d, 'role')}).\n"
            "Admin panelda «Telegram orqali kirish» ni bosing."), None


def admin_new_request(d: dict, url: str) -> Built:
    return f"🆕 <b>Yangi ariza</b> · {_e(d, 'kind')}\n«{_e(d, 'title')}»\nAdmin panel › Arizalar", None


EVENTS = {
    "lead_approved": lead_approved,
    "lead_info_requested": lead_info_requested,
    "lead_rejected": lead_rejected,
    "tournament_stopped": tournament_stopped,
    "refund_approved": refund_approved,
    "refund_denied": refund_denied,
    "complaint_reply": complaint_reply,
    "staff_invited": staff_invited,
    "admin_new_request": admin_new_request,
    "application_received": application_received,
    "info_requested": info_requested,
    "application_approved": application_approved,
    "application_rejected": application_rejected,
    "new_participant": new_participant,
    "booking_confirmed": booking_confirmed,
    "booking_reminder": booking_reminder,
}
