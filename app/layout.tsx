import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'个人作品档案 — Selected Files',description:'打开一个文件夹，探索设计、图像与动态实验。可自由整理的个人作品档案。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
