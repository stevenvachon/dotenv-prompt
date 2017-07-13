"use strict";
const Enquirer = require("enquirer");



const test = (envPath, envSamplePath, varnames) =>
{
	const enquirer = new Enquirer();

	const questions = varnames.map(varname => enquirer.question(
	{
		name: varname,
		message: `Value for ${varname}`,
		default: ""
	}));

	return enquirer.ask(questions)
	.then(changes => console.log(changes));
};



test(undefined, undefined, ["VAR1","VAR2"]);
