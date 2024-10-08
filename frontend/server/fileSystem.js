import fs from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import {
  BLOCK_SPECS_FILE_NAME,
  PIPELINE_SPECS_FILE_NAME,
} from "../src/utils/constants";
import { logger } from "./logger";

export const readPipelines = async (dir) => {
  const items = await fs.readdir(dir);
  return pipelineSpecBuilder(items, dir);
};

const pipelineSpecBuilder = async (items, dir) => {
  const pipelinesData = [];

  for (const item of items) {
    try {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        const pipelineSpecFile = path.join(itemPath, PIPELINE_SPECS_FILE_NAME);
        try {
          await fs.stat(pipelineSpecFile);
          const pipelineData = await fs.readFile(pipelineSpecFile, "utf8");
          const parsedPipelineData = JSON.parse(pipelineData);
          parsedPipelineData.folderName = item; // Add the folder name to the pipeline data
          pipelinesData.push({
            path: itemPath,
            specs: parsedPipelineData,
          });
        } catch (error) {
          logger.error(error);
        }
      }
    } catch (error) {
      logger.error(error);
    }
  }

  return pipelinesData;
};

export const readSpecs = async (dir) => {
  const items = await fs.readdir(dir);
  //const pipelines = await fs.readdir("../pipelines");
  return specBuilder(items, dir);
};

const specBuilder = async (specs, dir) => {
  const specsData = [];

  for (const item of specs) {
    try {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        const specs = path.join(itemPath, BLOCK_SPECS_FILE_NAME);
        try {
          await fs.stat(specs);
          const specData = await fs.readFile(specs);
          specsData.push(JSON.parse(specData));
        } catch (error) {
          logger.error(error);
        }
      }
    } catch (error) {
      logger.error(error);
    }
  }

  return specsData;
};

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonToObject(filePath) {
  const buffer = await fs.readFile(filePath);
  return JSON.parse(buffer);
}

export async function filterDirectories(filePaths) {
  const stats = await Promise.all(filePaths.map((p) => fs.stat(p)));
  return filePaths
    .map((p, i) => [p, stats[i]])
    .filter(([, s]) => s.isDirectory())
    .map(([p]) => p);
}

export async function withFileSystemRollback(restorablePaths, workFunction) {
  const tempDirectory = await fs.mkdtemp(path.join(tmpdir(), "rollback"));
  const existingFiles = [];
  const notExistingFiles = [];

  try {
    for (const p of restorablePaths) {
      if (await fileExists(p)) {
        await fs.cp(p, path.join(tempDirectory, btoa(p)), { recursive: true });
        existingFiles.push(p);
      } else {
        notExistingFiles.push(p);
      }
    }

    await workFunction();
  } catch (e) {
    logger.error(
      "File system operations failed. Starting file rollback. Caused by:",
      e,
    );
    for (const p of existingFiles) {
      await fs.rm(p, { recursive: true });
      await fs.cp(path.join(tempDirectory, btoa(p)), p, { recursive: true });
    }
    for (const p of notExistingFiles) {
      await fs.rm(p, { recursive: true });
    }
  } finally {
    await fs.rm(tempDirectory, { recursive: true });
  }
}

export async function getDirectoryFilesRecursive(directoryPath) {
  const dirents = await fs.readdir(directoryPath, { recursive: true });
  const stats = await Promise.all(
    dirents.map((f) => {
      const absolutePath = path.join(directoryPath, f);
      return Promise.all([fs.stat(absolutePath), f]);
    }),
  );
  const files = stats.filter(([s]) => s.isFile()).map(([, f]) => f);
  return files;
}

export async function getDirectoryTree(directoryPath, visitor) {
  const root = makeDirectoryTreeNode(
    path.basename(directoryPath),
    directoryPath,
    "",
  );
  const stack = [root];

  while (stack.length > 0) {
    const parent = stack.pop();
    const dirents = await fs.readdir(parent.absolutePath, {
      withFileTypes: true,
    });

    parent.children = [];
    for (const dirent of dirents) {
      const isDirectory = dirent.isDirectory();
      const child = makeDirectoryTreeNode(
        dirent.name,
        path.join(parent.absolutePath, dirent.name),
        path.join(parent.relativePath, dirent.name),
        isDirectory,
        visitor,
      );

      parent.children.push(child);
      if (isDirectory) {
        stack.push(child);
      }
    }
  }

  return root;
}

function makeDirectoryTreeNode(
  name,
  absolutePath,
  relativePath,
  isDirectory,
  visitor,
) {
  let visit = {};
  if (visitor) {
    visit = visitor(name, absolutePath, relativePath, isDirectory) ?? {};
  }

  return {
    name: name,
    absolutePath: absolutePath,
    relativePath: relativePath,
    ...visit,
  };
}
