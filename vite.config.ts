import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, lazyPlugins } from 'vite-plus';

function resolvePhpCommand() {
    let phpFromPath = process.env.CLINIC_PHP_BINARY;

    if (!phpFromPath) {
        const lookup = spawnSync(
            process.platform === 'win32' ? 'where.exe' : 'which',
            ['php'],
            { encoding: 'utf8' },
        );
        phpFromPath =
            lookup.status === 0
                ? lookup.stdout.trim().split(/\r?\n/)[0]
                : undefined;
    }

    const candidates = [
        phpFromPath,
        resolve('.tools/php83/php.exe'),
        process.platform === 'win32' ? 'C:\\xampp\\php\\php.exe' : undefined,
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate !== phpFromPath && !existsSync(candidate)) continue;

        const check = spawnSync(candidate, ['-r', 'echo PHP_VERSION_ID;'], {
            encoding: 'utf8',
        });

        if (check.status === 0 && Number(check.stdout) >= 80300) {
            return `"${candidate.replaceAll('"', '\\"')}" artisan wayfinder:generate`;
        }
    }

    throw new Error(
        'PHP 8.3+ was not found. Install PHP 8.3 or set CLINIC_PHP_BINARY to its executable path.',
    );
}

export default defineConfig({
    plugins: lazyPlugins(() => [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
        wayfinder({
            command: resolvePhpCommand(),
            formVariants: true,
        }),
    ]),
    server: {
        watch: {
            ignored: [
                '**/.agents/**',
                '**/.claude/**',
                '**/.cursor/**',
                '**/.junie/**',
                '**/vendor/**',
            ],
        },
    },
    lint: {
        ignorePatterns: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        ignorePatterns: [
            '.github/**',
            'composer.json',
            'resources/js/components/ui/*',
            'resources/views/mail/*',
        ],
        sortTailwindcss: {
            functions: ['clsx', 'cn', 'cva'],
            stylesheet: 'resources/css/app.css',
        },
    },
});
