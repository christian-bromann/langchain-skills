
// ============================================================================
// Global State for TUI Updates
// ============================================================================

import type { SubagentInfo, ToolCall, LogEntry, TodoItem } from "./types";

type StateListener = () => void;

class AgentState {
  private listeners: Set<StateListener> = new Set();
  
  status: "initializing" | "running" | "completed" | "error" = "initializing";
  currentMessage: string = "";
  subagents: Map<string, SubagentInfo> = new Map();
  toolCalls: Map<string, ToolCall> = new Map();
  todos: TodoItem[] = [];
  logs: LogEntry[] = [];
  totalSkillsGenerated: number = 0;

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  setStatus(status: typeof this.status): void {
    this.status = status;
    this.notify();
  }

  appendMessage(text: string): void {
    this.currentMessage += text;
    this.notify();
  }

  clearMessage(): void {
    this.currentMessage = "";
    this.notify();
  }

  addSubagent(info: SubagentInfo): void {
    this.subagents.set(info.id, info);
    this.addLog({
      id: info.id,
      type: "subagent",
      content: `Spawned subagent: ${info.name} - ${info.task}`,
      timestamp: Date.now(),
    });
    this.notify();
  }

  updateSubagent(id: string, updates: Partial<SubagentInfo>): void {
    const existing = this.subagents.get(id);
    if (existing) {
      this.subagents.set(id, { ...existing, ...updates });
      this.notify();
    }
  }

  addToolCall(toolCall: ToolCall): void {
    this.toolCalls.set(toolCall.id, toolCall);
    this.addLog({
      id: toolCall.id,
      type: "tool",
      content: `Tool: ${toolCall.name} - ${toolCall.args.slice(0, 100)}...`,
      timestamp: Date.now(),
    });
    this.notify();
  }

  updateToolCall(id: string, updates: Partial<ToolCall>): void {
    const existing = this.toolCalls.get(id);
    if (existing) {
      this.toolCalls.set(id, { ...existing, ...updates });
      this.notify();
    }
  }

  setTodos(todos: Array<{ content: string; status: string }>): void {
    this.todos = todos.map((todo, index) => ({
      id: `todo-${index}`,
      content: todo.content,
      status: (todo.status || "pending") as TodoItem["status"],
    }));
    this.notify();
  }

  addLog(entry: LogEntry): void {
    this.logs.push(entry);
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    this.notify();
  }

  incrementSkillsGenerated(): void {
    this.totalSkillsGenerated++;
    this.notify();
  }
}

export const agentState = new AgentState();