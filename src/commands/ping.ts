import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: "Pinging..." });
    const message = await interaction.fetchReply();
    const latency = message.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(0xd7e5f2)
      .setDescription(`*Bot Latency:* ${latency}ms\n*API Latency:* ${apiLatency}ms`);
    await interaction.editReply({ content: "", embeds: [embed] });
  },
};

module.exports = command;