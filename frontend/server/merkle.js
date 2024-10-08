import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

//TODO could use more refactoring
export async function computePipelineMerkleTree(specs, pipelinePath) {
  const tree = {};

  if (specs.pipeline) {
    tree.blocks = {};
    for (let key in specs.pipeline) {
      const childBlock = specs.pipeline[key];
      if (hasPipeline(childBlock) || hasContainer(childBlock)) {
        tree.blocks[key] = await merklePipeline(childBlock, pipelinePath, key);
      }
    }
    tree.hash = combineChildrenHashes(Object.values(tree.blocks));
  }

  return tree;
}

async function merklePipeline(block, pipelinePath, blockKey) {
  const node = {};

  if (block.action.pipeline) {
    node.blocks = {};
    for (let key in block.action.pipeline) {
      const childBlock = block.action.pipeline[key];
      if (hasPipeline(childBlock) || hasContainer(childBlock)) {
        node.blocks[key] = await merklePipeline(childBlock, pipelinePath, key);
      }
    }
    node.hash = combineChildrenHashes(Object.values(node.blocks));
    return node;
  } else if (block.action.container) {
    const blockPath = path.join(pipelinePath, blockKey);
    node.files = await computeDirectoryMerkleTree(blockPath);
    node.hash = node.files.hash;
  }

  return node;
}

function hasContainer(block) {
  return block?.action?.container?.image?.length > 0;
}

function hasPipeline(block) {
  return Object.keys(block?.action?.pipeline ?? {}).length > 0;
}

async function computeDirectoryMerkleTree(dirPath) {
  const files = await merkleDirectory(dirPath, "");
  return files;
}

async function merkleDirectory(dirPath, parentRelativePath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const children = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const nodeRelativePath = path.join(parentRelativePath, entry.name);

    if (entry.isDirectory()) {
      const subDirNode = await merkleDirectory(fullPath, nodeRelativePath);
      children.push(subDirNode);
    } else {
      const fileHash = await computeFileHash(fullPath);
      children.push({ path: nodeRelativePath, hash: fileHash });
    }
  }

  const hash = combineChildrenHashes(children);
  return { path: parentRelativePath, hash: hash, children: children };
}

async function computeFileHash(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

function combineChildrenHashes(nodes) {
  return combineHashes(nodes.map((e) => e.hash));
}

function combineHashes(hashes) {
  if (hashes.length === 1) return hashes[0]; //TODO remove this edge case

  const concatenatedHashes = hashes.join("");
  const combinedHash = crypto
    .createHash("sha256")
    .update(concatenatedHashes)
    .digest("hex");
  return combinedHash;
}
