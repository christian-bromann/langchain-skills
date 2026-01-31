// ============================================================================
// MCP Client Setup for LangChain Docs
// ============================================================================
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const LANGCHAIN_MCP_URL = "https://docs.langchain.com/mcp";

// Timeout configuration
const REQUEST_TIMEOUT_MS = 120_000; // 2 minutes for search requests
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export let mcpClient: Client | null = null;

export async function getMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient;

  const transport = new StreamableHTTPClientTransport(new URL(LANGCHAIN_MCP_URL));

  mcpClient = new Client({
    name: "langchain-skills-agent",
    version: "1.0.0",
  });

  await mcpClient.connect(transport);
  return mcpClient;
}

/**
 * Call an MCP tool with retry logic for timeout errors
 */
export async function callMcpToolWithRetry<T>(
  toolName: string,
  args: Record<string, unknown>
): Promise<T> {
  const client = await getMcpClient();
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await client.callTool(
        {
          name: toolName,
          arguments: args,
        },
        undefined, // resultSchema
        {
          timeout: REQUEST_TIMEOUT_MS,
          resetTimeoutOnProgress: true,
        }
      );
      
      if (result.isError) {
        throw new Error(`MCP tool error: ${JSON.stringify(result.content)}`);
      }
      
      return result.content as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a timeout error
      const isTimeout = lastError.message.includes("-32001") || 
                        lastError.message.toLowerCase().includes("timeout");
      
      if (isTimeout && attempt < MAX_RETRIES) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }
      
      // Not a timeout or final attempt, throw the error
      throw lastError;
    }
  }
  
  throw lastError ?? new Error("MCP call failed after retries");
}