import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Lists every file in a folder (used for public/ — icons, manifest)
function listFiles(dir: string, root: string = dir): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        return entry.isDirectory() ? listFiles(full, root) : [relative(root, full).split('\\').join('/')];
    });
}

// Builds sw.js with the real (hashed) file names so the app works offline
function serviceWorker(): Plugin {
    return {
        name: 'translit-service-worker',
        apply: 'build',
        generateBundle(_options, bundle) {
            const files = ['./', ...Object.keys(bundle), ...listFiles('public')].map((file) =>
                file.startsWith('./') ? file : './' + file
            );
            const version = Date.now().toString(36);
            const source = readFileSync('src/sw-template.js', 'utf8')
                .replace('__APP_FILES__', JSON.stringify(files, null, 4))
                .replace('__VERSION__', version);

            this.emitFile({ type: 'asset', fileName: 'sw.js', source });
        },
    };
}

export default defineConfig({
    // Relative paths: works at kuzz0k.github.io/translit/ and anywhere else
    base: './',
    plugins: [react(), serviceWorker()],
});
