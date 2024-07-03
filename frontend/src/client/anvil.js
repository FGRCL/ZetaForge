// log socket

export async function terminateExecution(configuration, executionId) {
  const response = await handleRequest(
    buildPath(
      getScheme(configuration.anvil.host),
      configuration.anvil.host,
      configuration.anvil.port,
      `execution/${executionId}/terminate`,
    ),
    HttpMethod.POST,
    {},
  );

  const body = await response.json()

  return body
}

export async function getAllPipelines(configuration) {
  const response = await handleRequest(
    buildPath(
      getScheme(configuration.anvil.host),
      configuration.anvil.host,
      configuration.anvil.port,
      "pipeline/filter?limit=100000&offset=0"
    ),
    HttpMethod.GET,
    {},
  );

  const body = await response.json()

  return body
} 

export async function ping(configuration) {
  const response = await handleRequest(
    buildPath(
      getScheme(configuration.anvil.host),
      configuration.anvil.host,
      configuration.anvil.port,
      "ping",
    ),
    HttpMethod.GET,
    {},
  );

  try {
    return response.ok;
  } catch {
    return false
  }
}

const LOCAL_DOMAINS = ["localhost", "127.0.0.1", "::1"];

const HttpMethod = {
  GET: "GET",
  POST: "POST",
};

function buildPath(scheme, host, port, path) {
  const base = `${scheme}://${host}:${port}`;
  console.log(scheme)
  const url = new URL(path, base);
  return url;
}

function getScheme(host) {
  return LOCAL_DOMAINS.includes(host) ? "http" : "https";
}

async function handleRequest(url, method, headers, body = null) {
  try {
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : null,
    });
    return response;
  } catch (error) {
    const message = `Anvil request failed: ${error}`;
    console.error(message);
    throw new Error(message);
  }
}

