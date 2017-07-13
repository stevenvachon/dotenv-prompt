"use strict";
const editEnv = require("edit-dotenv");
const Enquirer = require("enquirer");
const isset = require("isset");
const {outputFile, readFile} = require("fs-extra");
const {parse:parseEnv} = require("dotenv");



const dotenvPrompt = async (envPath=".env", envSamplePath=".env.sample", varnames=[]) =>
{
	const envs = await Promise.all(
	[
		readEnv(envPath),
		readEnv(envSamplePath)
	]);

	const envString = envs[0] || envs[1];
	const env = await parseEnv(envString);

	if (varnames.length === 0)
	{
		// Prompt all vars
		varnames = Object.keys(env);
	}

	if (varnames.length === 0)
	{
		throw new Error("No variable(s) to prompt");
	}

	const changes = await prompts(env, varnames);

	if (Object.keys(changes).length > 0)
	{
		Object.assign(env, changes);

		await outputFile(envPath, editEnv(envString, changes));
	}
	else if (envString === envs[1])
	{
		// Duplicate the sample
		await outputFile(envPath, envString);
	}
};



const prompts = async (env, varnames) =>
{
	const enquirer = new Enquirer();

	const questions = varnames.map(varname => enquirer.question(
	{
		name: varname,
		message: `Value for ${varname}`,
		default: isset(env[varname]) ? env[varname] : ""  // TODO :: https://github.com/enquirer/enquirer/issues/18
	}));

	/*const questions = varnames.map(varname =>
	{
		switch (typeof varname)
		{
			case "string": return enquirer.question(
			{
				name: varname,
				message: `Value for ${varname}`,
				default: isset(env[varname]) ? env[varname] : ""
			});

			case "object": return enquirer.question(varname);
		}
	});*/

	const answers = await enquirer.ask(questions);

	return Object.keys(answers).reduce((result, varname) =>
	{
		if (varname in env && answers[varname]===env[varname])
		{
			delete answers[varname];
		}

		return result;
	}, answers);
};



const readEnv = async path =>
{
	try
	{
		return await readFile(path, "utf8");
	}
	catch (error)
	{
		if (error.code === "ENOENT")
		{
			return "";
		}
		else
		{
			throw error;
		}
	}
};



module.exports = dotenvPrompt;
