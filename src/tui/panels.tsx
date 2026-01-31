import { useState, useEffect } from "react";

import { agentState } from "../state";
import type { SubagentInfo, TodoItem, LogEntry } from "../types";

export function SubagentPanel() {
    const [subagents, setSubagents] = useState<SubagentInfo[]>([]);

    useEffect(() => {
        const unsubscribe = agentState.subscribe(() => {
            setSubagents(Array.from(agentState.subagents.values()));
        });
        return unsubscribe;
    }, []);

    const getStatusIcon = (status: SubagentInfo["status"]): string => {
        switch (status) {
            case "spawning":
                return "◐";
            case "running":
                return "●";
            case "completed":
                return "✓";
            case "error":
                return "✗";
        }
    };

    const getStatusColor = (status: SubagentInfo["status"]): string => {
        switch (status) {
            case "spawning":
                return "#e0af68";
            case "running":
                return "#7aa2f7";
            case "completed":
                return "#9ece6a";
            case "error":
                return "#f7768e";
        }
    };

    const activeSubagents = subagents.filter(
        (s) => s.status === "spawning" || s.status === "running"
    );
    const completedCount = subagents.filter((s) => s.status === "completed").length;

    return (
        <box
            border
            borderStyle="rounded"
            borderColor="#565f89"
            flexDirection="column"
            width="40%"
            title="Subagents"
            titleAlignment="left"
        >
            <box padding={1} flexDirection="column" gap={1}>
                <text fg="#565f89">
                    Active: {activeSubagents.length} | Completed: {completedCount}
                </text>

                {subagents.length === 0 ? (
                    <text fg="#565f89">No subagents spawned yet...</text>
                ) : (
                    <scrollbox stickyScroll flexGrow={1}>
                        {subagents.slice(-15).map((subagent) => (
                            <box key={subagent.id} flexDirection="row" gap={1} marginBottom={1}>
                                <text fg={getStatusColor(subagent.status)}>
                                    {getStatusIcon(subagent.status)}
                                </text>
                                <box flexDirection="column" flexGrow={1}>
                                    <text>
                                        <span fg="#c0caf5">
                                            <strong>{subagent.name}</strong>
                                        </span>
                                    </text>
                                    <text fg="#565f89">{subagent.task.slice(0, 80)}{subagent.task.length > 80 ? "..." : ""}</text>
                                    {subagent.progress && (
                                        <text fg="#7aa2f7">{subagent.progress}</text>
                                    )}
                                </box>
                            </box>
                        ))}
                    </scrollbox>
                )}
            </box>
        </box>
    );
}

export function TodoPanel() {
    const [todos, setTodos] = useState<TodoItem[]>([]);

    useEffect(() => {
        const unsubscribe = agentState.subscribe(() => {
            setTodos([...agentState.todos]);
        });
        return unsubscribe;
    }, []);

    const getStatusIcon = (status: TodoItem["status"]): string => {
        switch (status) {
            case "pending":
                return "○";
            case "in_progress":
                return "◐";
            case "completed":
                return "✓";
            case "cancelled":
                return "✗";
        }
    };

    const getStatusColor = (status: TodoItem["status"]): string => {
        switch (status) {
            case "pending":
                return "#565f89";
            case "in_progress":
                return "#7aa2f7";
            case "completed":
                return "#9ece6a";
            case "cancelled":
                return "#f7768e";
        }
    };

    const inProgressCount = todos.filter((t) => t.status === "in_progress").length;
    const completedCount = todos.filter((t) => t.status === "completed").length;

    return (
        <box
            border
            borderStyle="rounded"
            borderColor="#565f89"
            flexDirection="column"
            width="60%"
            flexGrow={1}
            title="Todo List"
            titleAlignment="left"
        >
            <box padding={1} flexDirection="column" gap={1} flexGrow={1}>
                <text fg="#565f89">
                    Total: {todos.length} | In Progress: {inProgressCount} | Done: {completedCount}
                </text>

                {todos.length === 0 ? (
                    <text fg="#565f89">No todos yet...</text>
                ) : (
                    <scrollbox stickyScroll flexGrow={1}>
                        {todos.map((todo) => (
                            <box key={todo.id} flexDirection="row" gap={1} marginBottom={1}>
                                <text fg={getStatusColor(todo.status)}>
                                    {getStatusIcon(todo.status)}
                                </text>
                                <text fg={todo.status === "completed" ? "#565f89" : "#c0caf5"}>
                                    {todo.content.slice(0, 80)}{todo.content.length > 80 ? "..." : ""}
                                </text>
                            </box>
                        ))}
                    </scrollbox>
                )}
            </box>
        </box>
    );
}

export function LogPanel() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");

    useEffect(() => {
        const unsubscribe = agentState.subscribe(() => {
            setLogs([...agentState.logs]);
            setCurrentMessage(agentState.currentMessage);
        });
        return unsubscribe;
    }, []);

    const getLogColor = (type: LogEntry["type"]): string => {
        switch (type) {
            case "info":
                return "#7aa2f7";
            case "tool":
                return "#bb9af7";
            case "subagent":
                return "#e0af68";
            case "message":
                return "#c0caf5";
            case "error":
                return "#f7768e";
        }
    };

    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <box
            border
            borderStyle="rounded"
            borderColor="#565f89"
            flexDirection="column"
            flexGrow={1}
            title="Activity Log"
            titleAlignment="left"
        >
            <box padding={1} flexDirection="column" flexGrow={1}>
                <scrollbox stickyScroll flexGrow={1} focused>
                    {logs.slice(-20).map((log) => (
                        log.type === "error" ? (
                            <box 
                                key={log.id} 
                                flexDirection="column" 
                                backgroundColor="#2d1f1f"
                                padding={1}
                                marginBottom={1}
                                border
                                borderStyle="rounded"
                                borderColor="#f7768e"
                            >
                                <box flexDirection="row" gap={1}>
                                    <text fg="#f7768e">
                                        <strong>✗ ERROR</strong>
                                    </text>
                                    <text fg="#565f89">[{formatTime(log.timestamp)}]</text>
                                </box>
                                <text fg="#f7768e">
                                    {log.content}
                                </text>
                            </box>
                        ) : (
                            <box key={log.id} flexDirection="row" gap={1}>
                                <text fg="#565f89">[{formatTime(log.timestamp)}]</text>
                                <text fg={getLogColor(log.type)}>{log.content}</text>
                            </box>
                        )
                    ))}
                    {currentMessage && (
                        <box marginTop={1}>
                            <text fg="#c0caf5">
                                <span fg="#7aa2f7">AI: </span>
                                {currentMessage.slice(-500)}
                            </text>
                        </box>
                    )}
                </scrollbox>
            </box>
        </box>
    );
}