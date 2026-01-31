import { useRenderer, useKeyboard } from "@opentui/react";
import { useState, useEffect } from "react";

import { Header } from "./header";
import { SubagentPanel, TodoPanel, LogPanel } from "./panels";
import { agentState } from "../state";

function Footer() {
    const renderer = useRenderer();

    useKeyboard((key) => {
        if (key.name === "escape" || (key.ctrl && key.name === "c")) {
            renderer.destroy();
        }
    });

    return (
        <box
            border
            borderColor="#565f89"
            padding={1}
            flexDirection="row"
            justifyContent="space-between"
        >
            <text fg="#565f89">
                Press <span fg="#7aa2f7">ESC</span> or{" "}
                <span fg="#7aa2f7">Ctrl+C</span> to exit
            </text>
            <text fg="#565f89">LangChain Skills Generator v1.0</text>
        </box>
    );
}

export function App() {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const unsubscribe = agentState.subscribe(() => {
            forceUpdate({});
        });
        return unsubscribe;
    }, []);

    return (
        <box flexDirection="column" width="100%" height="100%">
            <Header />

            <box flexDirection="row" gap={1} marginTop={1}>
                <SubagentPanel />
                <TodoPanel />
            </box>

            <box marginTop={1} flexGrow={1}>
                <LogPanel />
            </box>

            <Footer />
        </box>
    );
}