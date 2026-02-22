// commands/ping.ts
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
      .setDescription(`<:loading:1475242761895805099> *Bot Latency:* ${latency}ms\n<:loading:1475242761895805099> *API Latency:* ${apiLatency}ms`);
    await interaction.editReply({ content: "", embeds: [embed] });
  },
};

module.exports = command;