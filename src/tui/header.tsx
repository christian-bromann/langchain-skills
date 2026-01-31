import { useState, useEffect, useRef } from "react";
import { agentState } from "../state";

export function Header() {
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <box
            border
            borderStyle="rounded"
            borderColor="#7aa2f7"
            padding={1}
            flexDirection="row"
            justifyContent="space-between"
        >
            <box flexDirection="row" gap={2}>
                <text>
                    <span fg="#bb9af7">
                        <strong>LangChain Skills Agent</strong>
                    </span>
                </text>
                <text fg="#565f89">|</text>
                <text>
                    <span fg="#9ece6a">Skills: {agentState.totalSkillsGenerated}</span>
                </text>
            </box>
            <box flexDirection="row" gap={2}>
                <text fg="#565f89">Elapsed: {formatTime(elapsed)}</text>
                <text fg="#565f89">|</text>
                <text>
                    <span fg={agentState.status === "running" ? "#9ece6a" : "#f7768e"}>
                        {agentState.status.toUpperCase()}
                    </span>
                </text>
            </box>
        </box>
    );
}