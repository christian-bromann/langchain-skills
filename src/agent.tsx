import fs from "node:fs";

import {
  createDeepAgent,
  FilesystemBackend,
} from "deepagents";
import { AIMessage } from "langchain";

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import { SYSTEM_PROMPT } from "./prompts";
import { agentState } from "./state";
import { searchLangChainDocsTool, fetchWebPageTool, generateSkillFileTool } from "./tools";
import { mcpClient } from "./mcp";
import { App } from "./tui/app";

const logFile = fs.createWriteStream("agent.log", { flags: "a" });
const log = (message: string) => {
  logFile.write(`${message}\n`);
};

// ============================================================================
// Create the Deep Agent
// ============================================================================
async function createLangChainSkillsAgent() {
  const skillsDir = `${process.cwd()}/skills`;
  
  const backend = new FilesystemBackend({
    rootDir: skillsDir,
    virtualMode: true,
  });

  const agent = createDeepAgent({
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: SYSTEM_PROMPT,
    tools: [searchLangChainDocsTool, fetchWebPageTool, generateSkillFileTool],
    backend
  });

  return agent;
}

// ============================================================================
// Main Entry Point
// ============================================================================
export async function runAgent() {
  // Initialize OpenTUI renderer
  const renderer = await createCliRenderer({
    exitOnCtrlC: true, // Handle exit ourselves
  });

  // Create React root and render the TUI
  createRoot(renderer).render(<App />);

  // Add initial log
  agentState.addLog({
    id: "init",
    type: "info",
    content: "Starting LangChain Skills Agent...",
    timestamp: Date.now(),
  });

  // Create the agent
  const agent = await createLangChainSkillsAgent();

  agentState.addLog({
    id: "agent-created",
    type: "info",
    content: "Agent created. Beginning documentation exploration...",
    timestamp: Date.now(),
  });

  agentState.setStatus("running");

  try {
    const stream = await agent.stream(
      {
        messages: [
          {
            role: "user",
            content: `Please explore the LangChain documentation and create skill.md files for all major topics 
following the documentation navigation structure. Start by searching for an overview to understand 
the scope, then systematically create skill files for each area.`,
          },
        ],
      },
      {
        streamMode: ["updates", "messages"],
        recursionLimit: 200,
      }
    );

    // Track active subagents by their checkpoint_ns task_id (e.g., "8b255c2f-3248-5ba7-a69e-98daef12e11e")
    const activeSubagents = new Map<string, { id: string; name: string; toolCallId?: string }>();
    // Track pending task tool calls (tool_call_id -> description)
    const pendingTaskCalls = new Map<string, { subagentType: string; description: string }>();

    // Helper to extract subagent task_id from checkpoint_ns
    // Format: "tools:<task_id>|<node>:<node_id>" -> extract <task_id>
    const extractSubagentTaskId = (checkpointNs: string | undefined): string | null => {
      if (!checkpointNs || !checkpointNs.startsWith("tools:")) return null;
      const match = checkpointNs.match(/^tools:([a-f0-9-]+)/);
      return match && match[1] ? match[1] : null;
    };

    for await (const chunk of stream) {
      const [streamMode, data] = chunk;

      log(`[${streamMode}]: ${JSON.stringify(data)}`);

      if (streamMode === "messages") {
        const [message, metadata] = data;
        
        // Check if this is a subagent event by examining checkpoint_ns
        const checkpointNs = metadata?.checkpoint_ns as string | undefined;
        const subagentTaskId = checkpointNs ? extractSubagentTaskId(checkpointNs) : null;
        
        if (subagentTaskId) {
          // This is a subagent event - track it if not already
          if (!activeSubagents.has(subagentTaskId)) {
            const subagentId = `subagent-${subagentTaskId}`;
            const langgraphNode = metadata?.langgraph_node as string | undefined;
            activeSubagents.set(subagentTaskId, { 
              id: subagentId, 
              name: langgraphNode || "subagent" 
            });
            
            agentState.addSubagent({
              id: subagentId,
              name: "task",
              status: "running",
              task: `Subagent executing...`,
              progress: "",
              startTime: Date.now(),
            });
            
            agentState.addLog({
              id: `subagent-start-${Date.now()}-${Math.random()}`,
              type: "info",
              content: `Subagent started: ${subagentTaskId.slice(0, 8)}...`,
              timestamp: Date.now(),
            });
          }
          
          // Update subagent progress with streaming content
          if (message?.content) {
            const subagent = activeSubagents.get(subagentTaskId);
            if (subagent) {
              let textContent: string = "";
              if (typeof message.content === "string") {
                textContent = message.content;
              } else if (Array.isArray(message.content)) {
                const textBlock = message.content.find((c: { type: string; text?: string }) => c.type === "text");
                if (textBlock && typeof textBlock.text === "string") {
                  textContent = textBlock.text;
                }
              }
              if (textContent) {
                agentState.updateSubagent(subagent.id, {
                  progress: textContent.slice(0, 100),
                });
              }
            }
          }
        }
        
        // Check for tool calls in AIMessage - track all tool calls from the stream
        if (AIMessage.isInstance(message) && message.tool_calls && message.tool_calls.length > 0) {
          const toolCalls = message.tool_calls;
          for (const toolCall of toolCalls) {
            if (!toolCall.id) continue;
            
            // Args may be a string (JSON) or already parsed object
            const args = typeof toolCall.args === "string" 
              ? JSON.parse(toolCall.args) 
              : toolCall.args;
            
            if (toolCall.name === "task") {
              // This is a subagent spawn via the "task" tool
              const subagentType = args.subagent_type || "general-purpose";
              const description = args.description || args.prompt || args.task || "Processing task...";
              
              // Store pending task call info for when subagent starts
              pendingTaskCalls.set(toolCall.id, { subagentType, description: String(description) });
              
              agentState.addLog({
                id: `subagent-spawn-${Date.now()}-${Math.random()}`,
                type: "info",
                content: `Task delegated: ${String(description).slice(0, 80)}`,
                timestamp: Date.now(),
              });
            } else if (!subagentTaskId) {
              // Regular tool call from main agent (not in subagent context)
              agentState.addToolCall({
                id: toolCall.id,
                name: toolCall.name,
                status: "running",
                args: JSON.stringify(args).slice(0, 200),
                startTime: Date.now(),
              });
            }
          }
        }
        
        // Only append message content from the main agent (not subagents)
        if (!subagentTaskId && message?.content) {
          agentState.appendMessage(message.text);
        }
      } else if (streamMode === "updates") {
        for (const [nodeName, update] of Object.entries(data)) {
          if (nodeName === "__interrupt__") {
            agentState.addLog({
              id: `interrupt-${Date.now()}`,
              type: "info",
              content: `Interrupt: ${JSON.stringify(update).slice(0, 100)}`,
              timestamp: Date.now(),
            });
          } else if (nodeName === "tools") {
            const toolUpdate = update as { 
              todos?: Array<{ content: string; status: string }>;
              messages?: Array<{ name?: string; id?: string; content?: unknown; tool_call_id?: string; additional_kwargs?: Record<string, unknown> }>;
            };
            
            // Check for todos updates
            if (toolUpdate.todos && Array.isArray(toolUpdate.todos)) {
              agentState.setTodos(toolUpdate.todos);
              agentState.addLog({
                id: `todos-${Date.now()}`,
                type: "info",
                content: `Todo list updated: ${toolUpdate.todos.length} items`,
                timestamp: Date.now(),
              });
            }
            
            if (toolUpdate.messages) {
              for (const msg of toolUpdate.messages) {
                const toolName =
                  msg.name ||
                  (msg.additional_kwargs?.name as string | undefined) ||
                  "tool";
                // ToolMessage uses tool_call_id, not id
                const toolCallId = (msg.tool_call_id || msg.id) as string | undefined;
                const content = msg.content || "";
                
                // Check for tool status (success or error)
                const toolStatus = (msg as { status?: string }).status;
                const isError = toolStatus === "error" || 
                  String(content).toLowerCase().includes("error:") ||
                  String(content).toLowerCase().includes("failed");
                
                // Check if this is a task tool result (subagent completion)
                if (toolName === "task" && toolCallId) {
                  // Find and mark subagent as completed
                  // The toolCallId here is the original tool_call_id from the task tool call
                  const pendingTask = pendingTaskCalls.get(toolCallId);
                  
                  // Mark any subagents that completed
                  for (const [taskId, subagent] of activeSubagents) {
                    if (subagent.toolCallId === toolCallId || !subagent.toolCallId) {
                      agentState.updateSubagent(subagent.id, {
                        status: isError ? "error" : "completed",
                        progress: String(content).slice(0, 100),
                      });
                      activeSubagents.delete(taskId);
                      
                      agentState.addLog({
                        id: `subagent-${isError ? "error" : "complete"}-${Date.now()}-${Math.random()}`,
                        type: isError ? "error" : "info",
                        content: isError 
                          ? `Subagent failed: ${pendingTask?.description?.slice(0, 60) || taskId.slice(0, 8)}\n${String(content).slice(0, 300)}`
                          : `Subagent completed: ${pendingTask?.description?.slice(0, 60) || taskId.slice(0, 8)}`,
                        timestamp: Date.now(),
                      });
                      break;
                    }
                  }
                  
                  pendingTaskCalls.delete(toolCallId);
                } else if (toolName !== "write_todos") {
                  // Regular tool (skip write_todos as we handle todos separately)
                  // Log as error if tool failed
                  agentState.addLog({
                    id: `tool-result-${Date.now()}-${Math.random()}`,
                    type: isError ? "error" : "tool",
                    content: isError 
                      ? `${toolName} failed: ${String(content).slice(0, 500)}`
                      : `${toolName}: ${String(content).slice(0, 150)}...`,
                    timestamp: Date.now(),
                  });
                }
              }
            }
          } else if (nodeName === "model" || nodeName === "model_request") {
            agentState.clearMessage();
            agentState.addLog({
              id: `model-${Date.now()}`,
              type: "message",
              content: "Model response complete",
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    agentState.setStatus("completed");
    agentState.addLog({
      id: "complete",
      type: "info",
      content: `Agent completed. Generated ${agentState.totalSkillsGenerated} skill files.`,
      timestamp: Date.now(),
    });
  } catch (error) {
    agentState.setStatus("error");
    
    // Extract detailed error information
    let errorDetails = "";
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for ShellError or other errors with additional properties
      const anyError = error as Error & { 
        exitCode?: number; 
        stdout?: unknown; 
        stderr?: unknown;
        cause?: unknown;
      };
      
      if (anyError.exitCode !== undefined) {
        errorDetails += ` (exit code: ${anyError.exitCode})`;
      }
      if (anyError.stderr) {
        errorDetails += `\nStderr: ${String(anyError.stderr).slice(0, 500)}`;
      }
      if (anyError.stdout) {
        errorDetails += `\nStdout: ${String(anyError.stdout).slice(0, 500)}`;
      }
      if (anyError.cause) {
        errorDetails += `\nCause: ${String(anyError.cause)}`;
      }
      
      // Log the stack trace to the log file for debugging
      log(`Error stack trace: ${error.stack}`);
    } else {
      errorDetails = String(error);
    }
    
    agentState.addLog({
      id: "error",
      type: "error",
      content: `Error: ${errorDetails}`,
      timestamp: Date.now(),
    });
  }

  // Cleanup MCP client
  if (mcpClient) {
    await mcpClient.close();
  }
}
