// index.ts
import { Client, GatewayIntentBits, Collection, MessageFlags, REST, Routes } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { morning, mind } from "gradient-string";

dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;


if (!token || !clientId) {
  console.error("TOKEN or CLIENT_ID is missing in your .env file");
  process.exit(1);
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, any>;
    prefixCommands: Collection<string, any>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();
client.prefixCommands = new Collection();

async function deploy() {
  const commands: any[] = [];
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const imported = await import(filePath);
    const command = imported.default ?? imported;
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.warn(`Command at ${filePath} is missing "data" or "execute"`);
    }
  }

  const prefixCommandsPath = path.join(__dirname, "prefixcommands");
  if (fs.existsSync(prefixCommandsPath)) {
    const prefixCommandFiles = fs
      .readdirSync(prefixCommandsPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of prefixCommandFiles) {
      const filePath = path.join(prefixCommandsPath, file);
      const imported = await import(filePath);
      const command = imported.default ?? imported;
      if ("data" in command && "execute" in command) {
        client.prefixCommands.set(command.data.name, command);
      } else {
        console.warn(`Prefix command at ${filePath} is missing "data" or "execute"`);
      }
    }
  }

  const rest = new REST().setToken(token!);
  await rest.put(Routes.applicationCommands(clientId!), { body: commands });
  console.log(mind(`Registered ${commands.length + client.prefixCommands.size} commands`));
}

client.once("clientReady", (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  console.log(morning(`Ready to give everyone a freshly baked cinnamon roll!`));
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "There was an error executing this command.", flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: "There was an error executing this command.", flags: MessageFlags.Ephemeral });
    }
  }
});

const PREFIX = ">";

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  const command = client.prefixCommands.get(commandName ?? "");
  if (!command) return;

  try {
    await message.react("<a:loading:1475242756958851204>");

    await command.execute(message, args);

      await message.reactions.removeAll();
  } catch (error) {
    console.error(error);
    await message.reactions.removeAll();
    await message.reply("There was an error executing this command.");
  }
});

deploy()
  .then(() => client.login(token))
  .catch((error) => {
    console.error("Failed to load/deploy commands:", error);
    process.exit(1);
  });
  