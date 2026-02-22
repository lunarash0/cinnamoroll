import { Message } from "discord.js";

const command = {
  data: { name: "ping" },
  async execute(message: Message, args: string[]) {
    const sent = await message.reply("Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(message.client.ws.ping);
    await sent.edit(`<:loading:1475242761895805099> *Bot Latency:* ${latency}ms\n<:loading:1475242761895805099> *API Latency:* ${apiLatency}ms`);
  },
};

module.exports = command;