import { runAgent } from "./agent";

// Run if executed directly
runAgent().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
