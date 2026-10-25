import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand, MenuButtonWebApp, WebAppInfo
from aiohttp import web

from config import load_config
from handlers import router
from notify_api import build_app


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    config = load_config()

    bot = Bot(config.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(webapp_url=config.webapp_url)
    dp.include_router(router)

    # Menu button next to the message field opens the mini app.
    await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text="KiGo", web_app=WebAppInfo(url=config.webapp_url)))
    await bot.set_my_commands([
        BotCommand(command="start", description="Ilovani ochish"),
        BotCommand(command="bronlarim", description="Bronlarim"),
        BotCommand(command="turnirlar", description="Turnirlar va arizalar"),
        BotCommand(command="help", description="Yordam"),
    ])

    runner = None
    if config.notify_secret:
        runner = web.AppRunner(build_app(bot, config.webapp_url, config.notify_secret))
        await runner.setup()
        await web.TCPSite(runner, config.notify_host, config.notify_port).start()
        logging.info("Notify API: http://%s:%s/notify", config.notify_host, config.notify_port)
    else:
        logging.warning("NOTIFY_SECRET bo‘sh — /notify API o‘chirilgan")

    try:
        await dp.start_polling(bot)
    finally:
        if runner:
            await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
