export interface SubagentInfo {
    id: string;
    name: string;
    status: "spawning" | "running" | "completed" | "error";
    task: string;
    progress: string;
    startTime: number;
    endTime?: number;
}

export interface ToolCall {
    id: string;
    name: string;
    status: "running" | "completed" | "error";
    args: string;
    result?: string;
    startTime: number;
    endTime?: number;
}

export interface TodoItem {
    id: string;
    content: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
}

export interface LogEntry {
    id: string;
    type: "info" | "tool" | "subagent" | "message" | "error";
    content: string;
    timestamp: number;
}