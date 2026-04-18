import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/lib-core'],
      tsconfigPath: './tsconfig.lib.json',
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/lib-core/index.ts'),
        server: path.resolve(__dirname, 'src/lib-core/server.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-markdown',
        'mdast-util-from-markdown',
        'mdast-util-to-string',
        'mdast-util-to-markdown',
        'shiki',
        'marked',
        'remark-gfm',
        'remark-breaks',
        /^shiki\/.*/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        chunkFileNames: `[name].[format].js`,
      },
    },
    outDir: 'dist',
  },
})
