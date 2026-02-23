import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import path from "path";

const DDG_ICON = path.join(__dirname, "../icons/duckduckgo.png");
const SEPARATOR = path.join(__dirname, "../icons/separator.png");

const command = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search DuckDuckGo")
    .addStringOption((option) =>
      option.setName("query").setDescription("What to search for").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const query = interaction.options.getString("query", true);

    try {
      const response = await axios.get("https://api.duckduckgo.com/", {
        params: { q: query, format: "json", no_redirect: 1, no_html: 1 },
      });

      const data = response.data;

      const iconAttachment = { attachment: DDG_ICON, name: "duckduckgo.png" };
      const separatorAttachment = { attachment: SEPARATOR, name: "separator.png" };
      const iconURL = "attachment://duckduckgo.png";
      const files = [iconAttachment, separatorAttachment];

      if (data.Abstract) {
        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setAuthor({ name: "DuckDuckGo Search", iconURL })
          .setTitle(data.Heading)
          .setURL(data.AbstractURL)
          .setDescription(data.Abstract)
          .setImage("attachment://separator.png")
          .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], files });
        return;
      }

      const results = data.RelatedTopics?.filter(
        (r: any) => r.FirstURL && r.Text
      )?.slice(0, 1);

      if (!results?.length) {
        const embed = new EmbedBuilder()
          .setColor(0xff4b4b)
          .setDescription("<:dash:1475266985700102237> No results found!");
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xd8e5f2)
        .setAuthor({ name: "DuckDuckGo Search", iconURL })
        .setDescription(
          results.map((r: any) => `<:dash:1475266985700102237> ${r.Text}\n[Read More](${r.FirstURL})`).join("\n")
        )
        .setImage("attachment://separator.png")
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files });

    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xff4b4b)
        .setDescription("<:dash:1475266985700102237> An error occurred while searching!");
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

module.exports = command;