import { Message, MessageFlags } from "discord.js";
import axios from "axios";

const command = {
  data: { name: "search" },
  async execute(message: Message, args: string[]) {
    if (!args.length) {
      await message.reply("Please provide a search query!");
      return;
    }

    const query = args.join(" ");

    try {
      const response = await axios.get("https://api.duckduckgo.com/", {
        params: { q: query, format: "json", no_redirect: 1, no_html: 1 },
      });

      const data = response.data;

      if (data.Abstract) {
        await message.reply({
          content: `**${data.Heading}**\n<:dash:1475266985700102237> ${data.Abstract}\n[Read More](${data.AbstractURL})`,
          flags: MessageFlags.SuppressEmbeds,
        });
        return;
      }

      const results = data.RelatedTopics?.filter(
        (r: any) => r.FirstURL && r.Text
      )?.slice(0, 1);

      if (!results?.length) {
        await message.reply("No results found!");
        return;
      }

      const formatted = results
        .map((r: any) => `<:dash:1475266985700102237> ${r.Text}\n[Read More](${r.FirstURL})`)
        .join("\n");

      await message.reply({ content: formatted, flags: MessageFlags.SuppressEmbeds });

    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while searching!");
    }
  },
};

module.exports = command;