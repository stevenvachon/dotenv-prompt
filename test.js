"use strict";
const {EOL} = require("os");
const {expect} = require("chai");
const {mkdir, outputFile, readFile, remove} = require("fs-extra");
const {PassThrough} = require("stream");
const stringify = require("js-stringify");
const suppose = require("suppose");
const tempWrite = require("temp-write");



const dotenvPrompt = (envPath, envSamplePath, varnames) =>
{
	const contents = `
		"use strict";
		process.chdir(${stringify(process.cwd())});

		const dotenvPrompt = require(${stringify(require.resolve("./"))});

		const envPath       = ${stringify(envPath)};
		const envSamplePath = ${stringify(envSamplePath)};
		const varnames      = ${stringify(varnames)};

		dotenvPrompt(envPath, envSamplePath, varnames).catch(error =>
		{
			console.error(error);

			process.exitCode = 1;
		});
	`;

	return tempWrite(contents, "child.js")
	.then(childPath =>
	{
		return readFile(childPath, "utf8")
		.then(contents => console.log(contents))
		.then(() => childPath);
	});
};



const interaction = (childPath, expects=[]) =>
{
	return new Promise((resolve, reject) =>
	{
		const stream = new PassThrough()
		.on("data", chunk => console.log(chunk.toString()));

		console.log(process.execPath)

		// TODO :: https://github.com/jprichardson/node-suppose/issues/40
		const supposing = suppose(process.execPath, [childPath], { debug:stream, stripAnsi:true });

		//expects.forEach(expected => supposing.when(expected.condition).respond(expected.response));

		expects.forEach(expected => supposing.when(expected.condition).respond(() =>
		{
			setImmediate(() => console.error(stringify(expected.response)));
			return expected.response;
		}));

		supposing
		//.once("error", error => reject(error))
		//.end(code => resolve());
		.end(code =>
		{
			if (code !== 0)
			{
				// TODO :: https://github.com/jprichardson/node-suppose/issues/37
				reject(new Error(`Exited with code ${code}`));
			}
			else
			{
				resolve();
			}
		});
	});
};



const promptsAndWritesWithEmptyDefaults = (envPath, envSamplePath) =>
{
	it("prompts and writes an .env file with an empty and filled value (#1)", function()
	{
		return dotenvPrompt(envPath, envSamplePath, ["VAR1","VAR2"])
		.then(childPath => interaction(childPath,
		[
			{ condition:"? Value for VAR1 ()", response:EOL },
			{ condition:"? Value for VAR2 ()", response:`value${EOL}` }
		]))
		.then(() => readFile(envPath || ".env", "utf8"))
		.then(contents =>
		{
			expect(contents).to.equal(`VAR1=${EOL}VAR2=value${EOL}`);
		});
	});

	it("prompts and writes an .env file with an empty and filled value (#2)", function()
	{
		return dotenvPrompt(envPath, envSamplePath, ["VAR1","VAR2"])
		.then(childPath => interaction(childPath,
		[
			{ condition:"? Value for VAR1 ()", response:`value${EOL}` },
			{ condition:"? Value for VAR2 ()", response:EOL }
		]))
		.then(() => readFile(envPath || ".env", "utf8"))
		.then(contents =>
		{
			expect(contents).to.equal(`VAR1=value${EOL}VAR2=${EOL}`);
		});
	});

	it("prompts and writes an .env file with empty values", function()
	{
		return dotenvPrompt(envPath, envSamplePath, ["VAR1","VAR2"])
		.then(childPath => interaction(childPath,
		[
			{ condition:"? Value for VAR1 ()", response:EOL },
			{ condition:"? Value for VAR2 ()", response:EOL }
		]))
		.then(() => readFile(envPath || ".env", "utf8"))
		.then(contents =>
		{
			expect(contents).to.equal(`VAR1=${EOL}VAR2=${EOL}`);
		});
	});

	it("prompts and writes an .env file with filled values", function()
	{
		return dotenvPrompt(envPath, envSamplePath, ["VAR1","VAR2"])
		.then(childPath => interaction(childPath,
		[
			{ condition:"? Value for VAR1 ()", response:`value1${EOL}` },
			{ condition:"? Value for VAR2 ()", response:`value2${EOL}` }
		]))
		.then(() => readFile(envPath || ".env", "utf8"))
		.then(contents =>
		{
			expect(contents).to.equal(`VAR1=value1${EOL}VAR2=value2${EOL}`);
		});
	});
};



describe.only("dotenvPrompt", function()
{
	afterEach(() => Promise.all([ remove(".env"), remove(".env.sample") ]));



	describe("with all varnames specified", function()
	{
		describe("and no pre-existing .env files", function()
		{
			promptsAndWritesWithEmptyDefaults();
		});



		describe("and an empty pre-existing .env.sample file", function()
		{
			beforeEach(() => outputFile(".env.sample", ""));

			promptsAndWritesWithEmptyDefaults();
		});



		describe("and a pre-existing .env.sample file containing empty values", function()
		{
			beforeEach(() => outputFile(".env.sample", `VAR1=${EOL}VAR2=${EOL}`));

			promptsAndWritesWithEmptyDefaults();
		});



		describe("and a pre-existing .env.sample file containing values", function()
		{
			beforeEach(() => outputFile(".env.sample", `VAR1=value1${EOL}VAR2=value2${EOL}`));

			it("prompts and writes an .env file with a different and default value (#1)", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:EOL },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=value1${EOL}VAR2=new value2${EOL}`);
				});
			});

			it("prompts and writes an .env file with a different and default value (#2)", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:EOL }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=value2${EOL}`);
				});
			});

			it("prompts and writes an .env file with default values", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=value1${EOL}VAR2=value2${EOL}`);
				});
			});

			it("prompts and writes an .env file with different values", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=new value2${EOL}`);
				});
			});
		});



		describe("and a pre-existing .env file containing empty values", function()
		{
			beforeEach(() => Promise.all(
			[
				outputFile(".env", `VAR1=${EOL}VAR2=${EOL}`),
				outputFile(".env.sample", `VAR1=value1${EOL}VAR2=value2${EOL}`)
			]));

			promptsAndWritesWithEmptyDefaults();
		});



		describe("and a pre-existing .env file containing filled values", function()
		{
			beforeEach(() => outputFile(".env", `VAR1=value1${EOL}VAR2=value2${EOL}`));

			it("prompts and writes an .env file with a different and default value (#1)", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:EOL },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=value1${EOL}VAR2=new value2${EOL}`);
				});
			});

			it("prompts and writes an .env file with a different and default value (#2)", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:EOL }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=value2${EOL}`);
				});
			});

			it("prompts and writes an .env file with default values", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:EOL },
					{ condition:"? Value for VAR2 (value2)", response:EOL }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=value1${EOL}VAR2=value2${EOL}`);
				});
			});

			it("prompts and writes an .env file with different values", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=new value2${EOL}`);
				});
			});
		});



		describe("and a custom .env file path", function()
		{
			beforeEach(() => outputFile("temp/.2env", `VAR1=value1${EOL}VAR2=value2${EOL}`));
			afterEach(() => remove("temp"));

			it("prompts and writes an .env file with different values", function()
			{
				return dotenvPrompt("temp/.2env", undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile("temp/.2env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=new value2${EOL}`);
				});
			});
		});



		describe("and a custom .env.sample file path", function()
		{
			beforeEach(() => outputFile("temp/.2env.sample", `VAR1=value1${EOL}VAR2=value2${EOL}`));
			afterEach(() => remove("temp"));

			it("prompts and writes an .env file with different values", function()
			{
				return dotenvPrompt(undefined, "temp/.2env.sample", ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=new value2${EOL}`);
				});
			});
		});



		describe("and a directory named \".env\"", function()
		{
			beforeEach(() => mkdir(".env"));

			it("throws an error", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath))
				.catch(error => error)
				.then(error =>
				{
					// TODO :: https://github.com/jprichardson/node-suppose/issues/37
					// TODO :: https://github.com/Tyriar/node-pty/issues/75
					expect(error).to.be.an("error")/*.with.property("message").that.matches(/^.*\sEISDIR\:/)*/;
				});
			});
		});
	});



	describe("with only some varnames specified", function()
	{
		describe("and a pre-existing .env file", function()
		{
			beforeEach(() => outputFile(".env.sample", `VAR1=value1${EOL}VAR2=value2${EOL}VAR3=value3${EOL}`));

			it("prompts and writes an .env file with some different values", function()
			{
				return dotenvPrompt(undefined, undefined, ["VAR1","VAR2"])
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=new value2${EOL}VAR3=value3${EOL}`);
				});
			});
		});
	});



	describe("with no varnames specified", function()
	{
		describe("and no pre-existing .env files", function()
		{
			it("throws an error", function()
			{
				return dotenvPrompt()
				.then(childPath => interaction(childPath))
				.catch(error => error)
				.then(error =>
				{
					// TODO :: https://github.com/jprichardson/node-suppose/issues/37
					// TODO :: https://github.com/Tyriar/node-pty/issues/75
					expect(error).to.be.an("error")/*.with.property("message").that.matches(/^.*\sNo variable\(s\) to prompt/)*/;
				});
			});
		});



		describe("and a pre-existing .env file", function()
		{
			beforeEach(() => outputFile(".env.sample", `VAR1=value1${EOL}VAR2=value2${EOL}`));

			it("prompts all varnames and writes an .env file with different values", function()
			{
				return dotenvPrompt(undefined, undefined)
				.then(childPath => interaction(childPath,
				[
					{ condition:"? Value for VAR1 (value1)", response:`new value1${EOL}` },
					{ condition:"? Value for VAR2 (value2)", response:`new value2${EOL}` }
				]))
				.then(() => readFile(".env", "utf8"))
				.then(contents =>
				{
					expect(contents).to.equal(`VAR1=new value1${EOL}VAR2=new value2${EOL}`);
				});
			});
		});
	});
});
