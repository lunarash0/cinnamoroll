import { Message, PermissionFlagsBits, TextChannel } from "discord.js";

const command = {
  data: { name: "slowmode" },
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("<a:whiteburst:1475266995170574396> You don't have permission to manage slowmode!");
      return;
    }

    const channel = message.channel as TextChannel;

    if (!args.length) {
      await message.reply(`<a:whiteburst:1475266995170574396> Current slowmode is **${channel.rateLimitPerUser}s**. Provide a value in seconds to change it.`);
      return;
    }

    const seconds = parseInt(args[0]);

    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      await message.reply("<a:whiteburst:1475266995170574396> Please provide a valid number between **0** and **21600** seconds (6 hours)!");
      return;
    }

    try {
      await channel.setRateLimitPerUser(seconds);
      await message.reply(
        seconds === 0
          ? "<a:whiteburst:1475266995170574396> Slowmode has been **disabled**."
          : `<a:whiteburst:1475266995170574396> Slowmode set to **${seconds}s**.`
      );
    } catch (error) {
      console.error(error);
      await message.reply("<a:whiteburst:1475266995170574396> Failed to set slowmode! Make sure I have the **Manage Channel** permission.");
    }
  },
};

module.exports = command;