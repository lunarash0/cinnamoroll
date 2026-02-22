import { Message, PermissionFlagsBits } from "discord.js";

const command = {
  data: { name: "unban" },
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("<a:redburst:1475266993253912586> You don't have permission to unban members!");
      return;
    }

    if (!message.guild?.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("<a:redburst:1475266993253912586> I don't have permission to unban members!");
      return;
    }

    if (!args.length) {
      await message.reply("<a:redburst:1475266993253912586> Please provide a user ID!");
      return;
    }

    const targetUser = await message.client.users.fetch(args[0]).catch(() => null);

    if (!targetUser) {
      await message.reply("<a:redburst:1475266993253912586> Could not find that user!");
      return;
    }

    if (targetUser.id === message.client.user?.id) {
      await message.reply("<a:redburst:1475266993253912586> I can't unban myself!");
      return;
    }

    const banEntry = await message.guild?.bans.fetch(targetUser.id).catch(() => null);
    if (!banEntry) {
      await message.reply("<a:redburst:1475266993253912586> That user is not banned!");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild?.bans.remove(targetUser.id, reason);
      await message.reply(`<a:redburst:1475266993253912586> **${targetUser.tag}** has been unbanned.\nReason: ${reason}`);
    } catch (error) {
      console.error(error);
      await message.reply("<a:redburst:1475266993253912586> Failed to unban the user!");
    }
  },
};

module.exports = command;