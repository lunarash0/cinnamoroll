import { Message, PermissionFlagsBits } from "discord.js";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

const command = {
  data: { name: "mute" },
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("<a:yellowburst:1475266996814872697> You don't have permission to mute members!");
      return;
    }

    if (!message.guild?.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("<a:yellowburst:1475266996814872697> I don't have permission to mute members!");
      return;
    }

    if (!args.length) {
      await message.reply("<a:yellowburst:1475266996814872697> Please mention a member or provide their ID!");
      return;
    }

    const target =
      message.mentions.members?.first() ||
      (args[0] ? await message.guild?.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      await message.reply("<a:yellowburst:1475266996814872697> Could not find that member!");
      return;
    }

    if (target.id === message.author.id) {
      await message.reply("<a:yellowburst:1475266996814872697> You can't mute yourself!");
      return;
    }

    if (target.id === message.client.user?.id) {
      await message.reply("<a:yellowburst:1475266996814872697> I can't mute myself!");
      return;
    }

    if (!target.moderatable) {
      await message.reply("<a:yellowburst:1475266996814872697> I can't mute this member! They may have a higher role than me.");
      return;
    }

    if (
      message.member &&
      target.roles.highest.position >= message.member.roles.highest.position
    ) {
      await message.reply("<a:yellowburst:1475266996814872697> You can't mute someone with an equal or higher role than you!");
      return;
    }

    const mentionUsed = message.mentions.members?.first() !== undefined;
    const durationArg = mentionUsed ? args[1] : args[1];
    const duration = durationArg ? parseDuration(durationArg) : null;

    // max duration is 28d
    if (duration && duration > 28 * 24 * 60 * 60 * 1000) {
      await message.reply("<a:yellowburst:1475266996814872697> Duration cannot exceed 28 days!");
      return;
    }

    const reason = (durationArg ? args.slice(2) : args.slice(1)).join(" ") || "No reason provided";

    try {
      await target.timeout(duration ?? 10 * 60 * 1000, reason);
      const durationText = durationArg && duration ? durationArg : "10m (default)";
      await message.reply(
        `<a:yellowburst:1475266996814872697> **${target.user.tag}** has been muted for **${durationText}**.\nReason: ${reason}`
      );
    } catch (error) {
      console.error(error);
      await message.reply("<a:yellowburst:1475266996814872697> Failed to mute the member!");
    }
  },
};

module.exports = command;