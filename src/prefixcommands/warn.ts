import { Message, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import path from "path";

const WARNS_FILE = path.join(__dirname, "../../data/warns.json");

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

const command = {
  data: { name: "warn" },
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("<a:yellowburst:1475266996814872697> You don't have permission to manage warns!");
      return;
    }

    const sub = args[0]?.toLowerCase();

    // >warn list @user
    if (sub === "list") {
      const target =
        message.mentions.members?.first() ||
        (args[1] ? await message.guild?.members.fetch(args[1]).catch(() => null) : null);

      if (!target) {
        await message.reply("<a:yellowburst:1475266996814872697> Please mention a member or provide their ID!");
        return;
      }

      const data = loadWarns();
      const warns = data[message.guild!.id]?.[target.id] ?? [];

      if (!warns.length) {
        await message.reply(`<a:yellowburst:1475266996814872697> **${target.user.tag}** has no warnings.`);
        return;
      }

      const list = warns
        .map(
          (w) =>
            `\`#${w.id}\` — ${w.reason} — by <@${w.moderator}> — <t:${Math.floor(w.timestamp / 1000)}:R>`
        )
        .join("\n");

      await message.reply({
        content: `<a:yellowburst:1475266996814872697> **${target.user.tag}** has **${warns.length}** warning(s):\n${list}`,
        allowedMentions: { parse: [] },
      });
      return;
    }

    // >warn remove @user <id>
    if (sub === "remove") {
      const target =
        message.mentions.members?.first() ||
        (args[1] ? await message.guild?.members.fetch(args[1]).catch(() => null) : null);

      if (!target) {
        await message.reply("<a:yellowburst:1475266996814872697> Please mention a member or provide their ID!");
        return;
      }

      const warnId = parseInt(mentionUsed(message) ? args[2] : args[2]);

      if (isNaN(warnId)) {
        await message.reply("<a:yellowburst:1475266996814872697> Please provide a valid warn ID!");
        return;
      }

      const data = loadWarns();
      const userWarns = data[message.guild!.id]?.[target.id] ?? [];
      const index = userWarns.findIndex((w) => w.id === warnId);

      if (index === -1) {
        await message.reply("<a:yellowburst:1475266996814872697> Warn not found!");
        return;
      }

      userWarns.splice(index, 1);
      data[message.guild!.id][target.id] = userWarns;
      saveWarns(data);

      await message.reply(`<a:yellowburst:1475266996814872697> Warn \`#${warnId}\` removed from **${target.user.tag}**.`);
      return;
    }

    // >warn clear @user
    if (sub === "clear") {
      const target =
        message.mentions.members?.first() ||
        (args[1] ? await message.guild?.members.fetch(args[1]).catch(() => null) : null);

      if (!target) {
        await message.reply("<a:yellowburst:1475266996814872697> Please mention a member or provide their ID!");
        return;
      }

      const data = loadWarns();
      if (data[message.guild!.id]) {
        data[message.guild!.id][target.id] = [];
        saveWarns(data);
      }

      await message.reply(`<a:yellowburst:1475266996814872697> Cleared all warnings for **${target.user.tag}**.`);
      return;
    }

    // >warn @user <reason>
    const target =
      message.mentions.members?.first() ||
      (args[0] ? await message.guild?.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      await message.reply("<a:yellowburst:1475266996814872697> Please mention a member or provide their ID!");
      return;
    }

    if (target.id === message.author.id) {
      await message.reply("<a:yellowburst:1475266996814872697> You can't warn yourself!");
      return;
    }

    if (target.id === message.client.user?.id) {
      await message.reply("<a:yellowburst:1475266996814872697> You can't warn me!");
      return;
    }

    if (
      message.member &&
      target.roles.highest.position >= message.member.roles.highest.position
    ) {
      await message.reply("<a:yellowburst:1475266996814872697> You can't warn someone with an equal or higher role than you!");
      return;
    }

    const reason = args.slice(mentionUsed(message) ? 1 : 1).join(" ") || "No reason provided";

    const data = loadWarns();
    if (!data[message.guild!.id]) data[message.guild!.id] = {};
    if (!data[message.guild!.id][target.id]) data[message.guild!.id][target.id] = [];

    const userWarns = data[message.guild!.id][target.id];
    const newId = userWarns.length ? Math.max(...userWarns.map((w) => w.id)) + 1 : 1;

    const warn: Warn = {
      id: newId,
      reason,
      moderator: message.author.id,
      timestamp: Date.now(),
    };

    userWarns.push(warn);
    saveWarns(data);

    // DM the user
    await target.user
      .send(`<a:yellowburst:1475266996814872697> You have been warned in **${message.guild!.name}**.\nReason: ${reason}\nTotal warnings: ${userWarns.length}`)
      .catch(() => null); // dms closed, ignore

    await message.reply(
      `<a:yellowburst:1475266996814872697> **${target.user.tag}** has been warned. \`[#${newId}]\`\nReason: ${reason}\nTotal warnings: **${userWarns.length}**`
    );
  },
};

function mentionUsed(message: Message): boolean {
  return !!message.mentions.members?.first();
}

module.exports = command;