const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const dotenv = require("dotenv").config();
const User = require("./modules/User");

const { encrypt, decrypt } = require("./helpers/crypto");

const token = process.env.TELEGRAM_BOT_API_KEY;
let bot;
if (process.env.NODE_ENV === "production") {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

const app = express();
const db = process.env.MONGODB_URL;
const PORT = process.env.PORT || 3000;
const startBot = () => {
  bot.setMyCommands([
    {
      command: "/start",
      description: "Start the bot",
    },
    {
      command: "/info",
      description: "List your data",
    },
    {
      command: "/setcredentials",
      description: "Set your credentials",
    },
  ]);

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (text === "/start") {
      bot.sendMessage(chatId, "Добро пожаловать в мой телеграм бот");
    }

    if (text === "/info") {
      bot.sendMessage(
        chatId,
        "Введите логин, от которого хотите получить пароль"
      );

      bot.once("message", async (msg) => {
        const login = msg.text;
        try {
          const user = await User.findOne({ chatId: chatId, login: login });
          if (!user) throw Error;
          const decryptedPassword = decrypt(user.password);
          bot.sendMessage(
            chatId,
            `Social network: *${user.socialNetwork}*. Login: *${user.login}*. Password: *${decryptedPassword}*`,
            {
              parse_mode: "Markdown",
            }
          );
        } catch (err) {
          bot.sendMessage(
            chatId,
            "Данные не найдены, проверьте правильность введенных данных"
          );
        }
      });
    }

    if (text === "/setcredentials") {
      bot.sendMessage(
        chatId,
        "Введите логин и пароль в формате login><password><social network"
      );
      bot.once("message", async (msg) => {
        const text = msg.text;
        const credentials = text.split("><");
        const login = credentials[0];
        const passwordHash = encrypt(credentials[1]);
        const socialNetwork = credentials[2];
        const newData = new User({
          login,
          password: passwordHash,
          socialNetwork,
          chatId,
        });

        await newData.save();
        bot.sendMessage(
          chatId,
          "Данные сохранены, вы можете получить их с помощью команды /info"
        );
      });
    }
  });
};
const startServer = () => {
  try {
    mongoose.connect(db, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    app.listen(PORT, () => {
      console.log("server is listening on port " + PORT);
    });
    startBot();
  } catch (err) {
    console.log(err);
  }
};
startServer();
