import { Message, PermissionFlagsBits } from "discord.js";

const command = {
  data: { name: "ban" },
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("<a:redburst:1475266993253912586> You don't have permission to ban members!");
      return;
    }

    if (!message.guild?.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("<a:redburst:1475266993253912586> I don't have permission to ban members!");
      return;
    }

    if (!args.length) {
      await message.reply("<a:redburst:1475266993253912586> Please mention a member or provide their ID!");
      return;
    }

    const target =
      message.mentions.members?.first() ||
      (args[0] ? await message.guild?.members.fetch(args[0]).catch(() => null) : null);

    // ban users even out of server
    const targetUser =
      target?.user ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

    if (!targetUser) {
      await message.reply("<a:redburst:1475266993253912586> Could not find that user!");
      return;
    }

    if (targetUser.id === message.author.id) {
      await message.reply("<a:redburst:1475266993253912586> You can't ban yourself!");
      return;
    }

    if (targetUser.id === message.client.user?.id) {
      await message.reply("<a:redburst:1475266993253912586> I can't ban myself!");
      return;
    }

    if (target) {
      if (!target.bannable) {
        await message.reply("<a:redburst:1475266993253912586> I can't ban this member! They may have a higher role than me.");
        return;
      }

      if (
        message.member &&
        target.roles.highest.position >= message.member.roles.highest.position
      ) {
        await message.reply("<a:redburst:1475266993253912586> You can't ban someone with an equal or higher role than you!");
        return;
      }
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild?.bans.create(targetUser.id, { reason });
      await message.reply(`<a:redburst:1475266993253912586> **${targetUser.tag}** has been banned.\nReason: ${reason}`);
    } catch (error) {
      console.error(error);
      await message.reply("<a:redburst:1475266993253912586> Failed to ban the user!");
    }
  },
};

module.exports = command;