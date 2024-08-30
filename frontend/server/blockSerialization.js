import { execFile, spawn, spawnSync } from "child_process";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";
import {
  BLOCK_SPECS_FILE_NAME,
  SUPPORTED_FILE_EXTENSIONS,
  SUPPORTED_FILE_NAMES,
  CHAT_HISTORY_FILE_NAME,
} from "../src/utils/constants";
import { cacheJoin } from "./cache";
import { fileExists, getDirectoryTree } from "./fileSystem";
import { logger } from "./logger";
import { HttpStatus, ServerError } from "./serverError";

const READ_ONLY_FILES = [BLOCK_SPECS_FILE_NAME, CHAT_HISTORY_FILE_NAME];

export async function compileComputation(pipelineId, blockId) {
  const blockPath = cacheJoin(pipelineId, blockId);
  const sourcePath = cacheJoin(pipelineId, blockId, "computations.py");
  const source = await fs.readFile(sourcePath, { encoding: "utf8" });

  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, "resources", "compileComputation.py")
    : path.join("resources", "compileComputation.py");
  if (!(await fileExists(scriptPath))) {
    throw new ServerError(
      `Could not find script for compilation: ${scriptPath}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const { stdout, stderr, status, error } = spawnSync("python", [scriptPath], {
    input: source,
    encoding: "utf8",
  });

  if (error) {
    logger.error(error, buildCompilationErrorLog(blockPath, scriptPath));
    throw buildCompilationServerError();
  }

  if (status != 0) {
    logger.error(buildCompilationErrorLog(blockPath, scriptPath));
    logger.error(stderr);
    throw buildCompilationServerError();
  }

  const io = JSON.parse(stdout);
  return io;
}

export async function saveBlockSpecs(pipelineId, blockId, specs) {
  const specsPath = cacheJoin(pipelineId, blockId, BLOCK_SPECS_FILE_NAME);

  removeConnections(specs.inputs);
  removeConnections(specs.outputs);

  specs.views.node.pos_x = 0;
  specs.views.node.pos_y = 0;

  await fs.writeFile(specsPath, JSON.stringify(specs, null, 2));
}

function removeConnections(io) {
  for (const key in io) {
    io[key].connections = [];
  }

  return io;
}

export async function runTest(pipelineId, blockId) {
  const blockPath = cacheJoin(pipelineId, blockId);
  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, "resources", "run_test.py")
    : path.join("resources", "run_test.py");
  if (!(await fileExists(scriptPath))) {
    throw new Error(`Could not find script for running tests: ${scriptPath}`);
  }

  return new Promise((resolve, reject) => {
    execFile(
      "python",
      [scriptPath, blockPath, blockId],
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }

        logger.debug(stdout);
        logger.error(stderr);
        resolve();
      },
    );
  });
}

function buildCompilationErrorLog(blockPath, scriptPath) {
  return `compilation failed for block \nblock path: ${blockPath} \nscript path: ${scriptPath}`;
}

function buildCompilationServerError(error) {
  return new ServerError(
    `Failed to compile code for the block`,
    HttpStatus.INTERNAL_SERVER_ERROR,
    error,
  );
}

export async function getBlockDirectory(pipelineId, blockId) {
  const blockDirectory = cacheJoin(pipelineId, blockId);

  const tree = await getDirectoryTree(blockDirectory, filePermissionVisitor);
  return tree;
}

function filePermissionVisitor(name) {
  return getFilePermissions(name);
}

export async function getBlockFile(pipelineId, blockId, relativeFilePath) {
  const absoluteFilePath = cacheJoin(pipelineId, blockId, relativeFilePath);
  const fileName = path.basename(absoluteFilePath);
  const { read } = getFilePermissions(fileName);

  if (!read) {
    const message = `Reading file: ${absoluteFilePath}, is not permitted`;
    logger.error(message);
    throw new ServerError(message, HttpStatus.BAD_REQUEST);
  }

  return await fs.readFile(absoluteFilePath, { encoding: "utf8" });
}

export async function updateBlockFile(
  pipelineId,
  blockId,
  relativeFilePath,
  content,
) {
  const absoluteFilePath = cacheJoin(pipelineId, blockId, relativeFilePath);
  const fileName = path.basename(absoluteFilePath);
  const { write } = getFilePermissions(fileName);

  if (!write) {
    const message = `Writing file: ${absoluteFilePath}, is not permitted`;
    logger.error(message);
    throw new ServerError(message, HttpStatus.BAD_REQUEST);
  }

  await fs.writeFile(absoluteFilePath, content);
}

function getFilePermissions(name) {
  const readOnly = READ_ONLY_FILES.includes(name);
  const supported = isFileSupported(name);

  const read = supported;
  const write = supported && !readOnly;

  return { read, write };
}

function isFileSupported(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  return (
    SUPPORTED_FILE_EXTENSIONS.includes(extension) ||
    SUPPORTED_FILE_NAMES.includes(basename)
  );
}

export async function callAgent(
  userMessage,
  agentName,
  conversationHistory,
  apiKey,
) {
  let agents = "agents";
  if (app.isPackaged) {
    agents = path.join(process.resourcesPath, "agents");
  }
  const scriptPath = path.join(
    agents,
    agentName,
    "generate",
    "computations.py",
  );

  const stdout = await spawnAsync("python", [scriptPath], {
    input: JSON.stringify({
      apiKey,
      userMessage,
      conversationHistory,
    }),
    encoding: "utf8",
  });
  const response = JSON.parse(stdout).response;

  return response;
}

export async function getLogs(pipelineId, blockId) {
  const logsPath = cacheJoin(pipelineId, blockId, "logs.txt");

  if (!(await fileExists(logsPath))) {
    return "Logs not yet available";
  }

  return await fs.readFile(logsPath, "utf8");
}

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const process = spawn(command, args, options);

    process.stdout.setEncoding(options.encoding);
    process.stdout.on("data", (data) => {
      stdout += data;
    });

    process.stderr.setEncoding(options.encoding);
    process.stderr.on("data", (data) => {
      stderr += data;
    });

    process.on("exit", (status) => {
      if (status != 0) {
        reject(stderr);
      }
      resolve(stdout);
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.stdin.write(options.input);
    process.stdin.end();
  });
}
