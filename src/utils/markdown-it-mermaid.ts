import MarkdownIt from "markdown-it";
import Mermaid from "mermaid";
import { uuid } from "./random_util";

// Define interface to await readiness of import

const drawQueue: Promise<any>[] = []

function mermaid(md: MarkdownIt, options: any) {
    // Setup Mermaid
    Mermaid.initialize({
        securityLevel: "loose",
        ...options,
    });

    function getLangName(info: string): string {
        return info.split(/\s+/g)[0];
    }

    // Store reference to original renderer.
    const defaultFenceRenderer = md.renderer.rules.fence;

    // Render custom code types as SVGs, letting the fence parser do all the heavy lifting.
    function customFenceRenderer(
        tokens: any[],
        idx: number,
        options: any,
        env: any,
        slf: any
    ) {
        const token = tokens[idx];
        const info = token.info.trim();
        const langName = info ? getLangName(info) : "";

        if (["mermaid", "{mermaid}"].indexOf(langName) === -1) {
            if (defaultFenceRenderer !== undefined) {
                return defaultFenceRenderer(tokens, idx, options, env, slf);
            }
            return "";
        }
        const container_id = "mermaid-container" + uuid();
        try {
            drawQueue.push(
                Mermaid.mermaidAPI.render(
                    "svg-" + container_id,
                    token.content,
                ).then(({ svg }) => {
                    const a = document.getElementById(container_id) as any
                    a.innerHTML = svg
                })
            )
        } catch (e) {
            return `<div class="alert alert-danger">${e}</div>`;
        }
        return `<div id="${container_id}"></div>`;
    }
    md.renderer.rules.fence = customFenceRenderer;
}

export { mermaid, drawQueue }