import { Message, PermissionFlagsBits, GuildMember } from "discord.js";

const command = {
  data: { name: "kick" },
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await message.reply("<a:orangeburst:1475266989034438698> You don't have permission to kick members!");
      return;
    }

    if (!message.guild?.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await message.reply("<a:orangeburst:1475266989034438698> I don't have permission to kick members!");
      return;
    }

    const target =
      message.mentions.members?.first() ||
      (args[0] ? await message.guild?.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      await message.reply("<a:orangeburst:1475266989034438698> Please mention a member or provide their ID!");
      return;
    }

    if (target.id === message.author.id) {
      await message.reply("<a:orangeburst:1475266989034438698> You can't kick yourself!");
      return;
    }

    if (target.id === message.client.user?.id) {
      await message.reply("<a:orangeburst:1475266989034438698> I can't kick myself!");
      return;
    }

    if (!target.kickable) {
      await message.reply("<a:orangeburst:1475266989034438698> I can't kick this member! They may have a higher role than me.");
      return;
    }

    if (
      message.member &&
      target.roles.highest.position >= message.member.roles.highest.position
    ) {
      await message.reply("<a:orangeburst:1475266989034438698> You can't kick someone with an equal or higher role than you!");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.kick(reason);
      await message.reply(`<a:orangeburst:1475266989034438698> **${target.user.tag}** has been kicked.\nReason: ${reason}`);
    } catch (error) {
      console.error(error);
      await message.reply("<a:orangeburst:1475266989034438698> Failed to kick the member!");
    }
  },
};

module.exports = command;