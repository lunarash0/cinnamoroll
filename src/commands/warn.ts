import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  AttachmentBuilder
} from "discord.js";
import fs from "fs";
import path from "path";

const WARNS_FILE = path.join(__dirname, "../../data/warns.json");
const SEPARATOR = path.join(__dirname, "../icons/separator.png");

interface Warn {
  id: number;
  reason: string;
  moderator: string;
  timestamp: number;
}

interface WarnData {
  [guildId: string]: {
    [userId: string]: Warn[];
  };
}

function loadWarns(): WarnData {
  if (!fs.existsSync(WARNS_FILE)) {
    fs.mkdirSync(path.dirname(WARNS_FILE), { recursive: true });
    fs.writeFileSync(WARNS_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(WARNS_FILE, "utf-8"));
}

function saveWarns(data: WarnData) {
  fs.writeFileSync(WARNS_FILE, JSON.stringify(data, null, 2));
}

function buildEmbed(description: string, interaction: ChatInputCommandInteraction, thumbnailURL?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0xd8e5f2)
    .setDescription(description)
    .setImage("attachment://separator.png")
    .setFooter({
      text: `${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()
    if (thumbnailURL) embed.setThumbnail(thumbnailURL)
    return embed;
}

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Manage warnings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Warn a member")
        .addUserOption((opt) => opt.setName("user").setDescription("The member to warn").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the warn"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View a member's warnings")
        .addUserOption((opt) => opt.setName("user").setDescription("The member to check").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a specific warning")
        .addUserOption((opt) => opt.setName("user").setDescription("The member").setRequired(true))
        .addIntegerOption((opt) => opt.setName("id").setDescription("The warn ID to remove").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Clear all warnings for a member")
        .addUserOption((opt) => opt.setName("user").setDescription("The member to clear").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember("user") as any;
    const separator = new AttachmentBuilder(SEPARATOR, { name: "separator.png" });

    if (!target) {
      await interaction.reply({
        embeds: [buildEmbed("<a:yellowburst:1475266996814872697> Member not found!", interaction)],
        files: [separator],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guildId = interaction.guild!.id;

    // /warn list
    if (sub === "list") {
      const data = loadWarns();
      const warns = data[guildId]?.[target.id] ?? [];

      if (!warns.length) {
        await interaction.reply({
          embeds: [buildEmbed(
            `<a:yellowburst:1475266996814872697> **${target.user.tag}** has no warnings.`,
            interaction,
            target.user.displayAvatarURL()
          )
          ],
          files: [separator],
        });
        return;
      }

      const list = warns
        .map((w) => `\`#${w.id}\` - ${w.reason} - by <@${w.moderator}> - <t:${Math.floor(w.timestamp / 1000)}:R>`)
        .join("\n");

      await interaction.reply({
        embeds: [buildEmbed(`<a:yellowburst:1475266996814872697> **${target.user.tag}** has **${warns.length}** warning(s):\n${list}`, interaction)],
        files: [separator],
      });
      return;
    }

    // /warn remove
    if (sub === "remove") {
      const warnId = interaction.options.getInteger("id", true);
      const data = loadWarns();
      const userWarns = data[guildId]?.[target.id] ?? [];
      const index = userWarns.findIndex((w) => w.id === warnId);

      if (index === -1) {
        await interaction.reply({
          embeds: [buildEmbed(
            "<a:yellowburst:1475266996814872697> Warn not found!",
            interaction,
            target.user.displayAvatarURL()
          )],
          files: [separator],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      userWarns.splice(index, 1);
      data[guildId][target.id] = userWarns;
      saveWarns(data);

      await interaction.reply({
        embeds: [buildEmbed(
          `<a:yellowburst:1475266996814872697> Warn \`#${warnId}\` removed from **${target.user.tag}**.`,
          interaction,
          target.user.displayAvatarURL()
        )],
        files: [separator],
      });
      return;
    }

    // /warn clear
    if (sub === "clear") {
      const data = loadWarns();
      if (data[guildId]) {
        data[guildId][target.id] = [];
        saveWarns(data);
      }

      await interaction.reply({
        embeds: [buildEmbed(
          `<a:yellowburst:1475266996814872697> Cleared all warnings for **${target.user.tag}**.`,
          interaction,
          target.user.displayAvatarURL()
        )],
        files: [separator],
      });
      return;
    }

    // /warn add
    if (sub === "add") {
      const member = interaction.member as any;

      if (target.id === interaction.user.id) {
        await interaction.reply({
          embeds: [buildEmbed(
            "<a:yellowburst:1475266996814872697> You can't warn yourself!",
            interaction,
            target.user.displayAvatarURL()
          )],
          files: [separator],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (target.id === interaction.client.user?.id) {
        await interaction.reply({
          embeds: [buildEmbed(
            "<a:yellowburst:1475266996814872697> You can't warn me!",
            interaction,
            target.user.displayAvatarURL()
          )],
          files: [separator],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (target.roles.highest.position >= member.roles.highest.position) {
        await interaction.reply({
          embeds: [buildEmbed(
            "<a:yellowburst:1475266996814872697> You can't warn someone with an equal or higher role than you!",
            interaction,
            target.user.displayAvatarURL()
          )],
          files: [separator],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const reason = interaction.options.getString("reason") || "No reason provided";
      const data = loadWarns();
      if (!data[guildId]) data[guildId] = {};
      if (!data[guildId][target.id]) data[guildId][target.id] = [];

      const userWarns = data[guildId][target.id];
      const newId = userWarns.length ? Math.max(...userWarns.map((w) => w.id)) + 1 : 1;

      const warn: Warn = {
        id: newId,
        reason,
        moderator: interaction.user.id,
        timestamp: Date.now(),
      };

      userWarns.push(warn);
      saveWarns(data);

      await target.user
        .send(`<a:yellowburst:1475266996814872697> You have been warned in **${interaction.guild!.name}**.\nReason: ${reason}\nTotal warnings: ${userWarns.length}`)
        .catch(() => null);

      await interaction.reply({
        embeds: [
          buildEmbed(
            `<a:yellowburst:1475266996814872697> **${target.user.tag}** has been warned. \`[#${newId}]\`\nReason: ${reason}\nTotal warnings: **${userWarns.length}**`,
            interaction,
            target.user.displayAvatarURL()
          ),
        ],
        files: [separator],
      });
    }
  },
};
