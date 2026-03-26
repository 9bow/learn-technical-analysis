// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://9bow.github.io',
  base: '/learn-technical-analysis',
  integrations: [
    starlight({
      title: '기술적 분석 학습',
      defaultLocale: 'root',
      locales: {
        root: { label: '한국어', lang: 'ko' },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/9bow/learn-technical-analysis',
        },
      ],
      sidebar: [
        {
          label: '기초',
          autogenerate: { directory: '01-fundamentals' },
        },
        {
          label: '추세 분석',
          autogenerate: { directory: '02-trend-analysis' },
        },
        {
          label: '차트 패턴',
          autogenerate: { directory: '03-chart-patterns' },
        },
        {
          label: '보조 지표',
          autogenerate: { directory: '04-indicators' },
        },
        {
          label: '캔들스틱 패턴',
          autogenerate: { directory: '05-candlestick-patterns' },
        },
        {
          label: '고급 기법',
          autogenerate: { directory: '06-advanced' },
        },
        {
          label: '리스크 관리',
          autogenerate: { directory: '07-risk-management' },
        },
        {
          label: '가상자산',
          autogenerate: { directory: '08-crypto' },
        },
        {
          label: '퀀트 전략',
          autogenerate: { directory: '09-quant-strategies' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        SidebarSublist: './src/components/layout/SidebarWithProgress.astro',
      },
    }),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
