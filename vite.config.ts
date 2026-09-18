import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
const base=process.env.PAGES_BASE_PATH || '/';
export default defineConfig({
  base,
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  css:{postcss:{plugins:[tailwindcss()]}},
  plugins:[{
    name:'github-pages-asset-paths',enforce:'pre',
    transform(code,id){
      if(base==='/' || !/[/\\]app[/\\].*\.(tsx|json)$/.test(id))return;
      return code.replace(/(["'`])\/(?=(?:aqua|castaway|decode|dune|intergrowth|lone|prediction|sign|spiral|stitching|tao|winter|lastline)\/|preview-cover-|artwork\.)/g,(_,quote)=>quote+base);
    }
  },react()],
});
