import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Manage slowmode for this channel")
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("Slowmode duration in seconds (0 to disable, max 21600)")
        .setMinValue(0)
        .setMaxValue(21600)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:whiteburst:1475266995170574396> You don't have permission to manage slowmode!");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.channel as TextChannel;
    const seconds = interaction.options.getInteger("seconds");

    if (seconds === null) {
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(`<a:whiteburst:1475266995170574396> Current slowmode is **${channel.rateLimitPerUser}s**. Provide a value in seconds to change it.`);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      await channel.setRateLimitPerUser(seconds);
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(
          seconds === 0
            ? "<a:whiteburst:1475266995170574396> Slowmode has been **disabled**."
            : `<a:whiteburst:1475266995170574396> Slowmode set to **${seconds}s**.`
        );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<a:whiteburst:1475266995170574396> Failed to set slowmode! Make sure I have the **Manage Channel** permission.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};

module.exports = command;