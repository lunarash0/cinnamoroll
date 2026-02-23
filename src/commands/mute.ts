import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a member using a timeout")
    .addUserOption((option) =>
      option.setName("user").setDescription("The member to mute").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration e.g. 10s, 5m, 2h, 1d (default: 10m)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the mute").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> You don't have permission to mute members!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> I don't have permission to mute members!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const target = await interaction.guild?.members.fetch(interaction.options.getUser("user", true).id).catch(() => null);

    if (!target) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> Could not find that member!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (target.id === interaction.user.id) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> You can't mute yourself!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (target.id === interaction.client.user?.id) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> I can't mute myself!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (!target.moderatable) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> I can't mute this member! They may have a higher role than me.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
    if (member && target.roles.highest.position >= member.roles.highest.position) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> You can't mute someone with an equal or higher role than you!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const durationArg = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const duration = durationArg ? parseDuration(durationArg) : null;

    if (durationArg && !duration) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> Invalid duration! Use formats like `10s`, `5m`, `2h`, `1d`.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (duration && duration > 28 * 24 * 60 * 60 * 1000) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> Duration cannot exceed 28 days!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      await target.timeout(duration ?? 10 * 60 * 1000, reason);
      const durationText = durationArg && duration ? durationArg : "10m (default)";
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(`<a:yellowburst:1475266996814872697> **${target.user.tag}** has been muted for **${durationText}**.\nReason: ${reason}`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:yellowburst:1475266996814872697> Failed to mute the member!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};

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

module.exports = command;