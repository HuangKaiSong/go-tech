import { loadLocales } from '@/locales';
import { NextResponse } from 'next/server';
import fs from 'node:fs'
import process from 'node:process'

export async function GET(_request: Request) {
  const messages = loadLocales()

  return NextResponse.json(messages);
}

function getI18nContent(body: any) {
  const enI18nFile = `${process.cwd()}/locales/en-us/index.json`;
  const cnI18nFile = `${process.cwd()}/locales/zh-cn/index.json`;
  const hkI18nFile = `${process.cwd()}/locales/zh-hk/index.json`;

  const originEnContent = JSON.parse(fs.readFileSync(enI18nFile, { encoding: 'utf8' }))
  const originCnContent = JSON.parse(fs.readFileSync(cnI18nFile, { encoding: 'utf8' }))
  const originHkContent = JSON.parse(fs.readFileSync(hkI18nFile, { encoding: 'utf8' }))

  const newEnContent = body['en-us']
  const newCnContent = body['zh-cn']
  const newHkContent = body['zh-hk']

  const diffEnContent = Object.assign(originEnContent, newEnContent)
  const diffCnContent = Object.assign(originCnContent, newCnContent)
  const diffHkContent = Object.assign(originHkContent, newHkContent)

  return {
    'en-us': diffEnContent,
    'zh-cn': diffCnContent,
    'zh-hk': diffHkContent
  }
}


export async function POST(request: Request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 格式必须 { 'en-us': { "键": 值 }, 'zh-cn': { "键": 值 }, 'en-hk': { "键": 值 }, }
  const enI18nFile = `${process.cwd()}/locales/en-us/index.json`;
  const cnI18nFile = `${process.cwd()}/locales/zh-cn/index.json`;
  const hkI18nFile = `${process.cwd()}/locales/zh-hk/index.json`;

  const allContent = getI18nContent(body)
  const enContent = allContent['en-us']
  const cnContent = allContent['zh-cn']
  const hkContent = allContent['zh-hk']

  // 写入到 i18n 文件
  fs.writeFileSync(enI18nFile, JSON.stringify(enContent, null, "\t"), { encoding: 'utf8' })
  fs.writeFileSync(cnI18nFile, JSON.stringify(cnContent, null, "\t"), { encoding: 'utf8' })
  fs.writeFileSync(hkI18nFile, JSON.stringify(hkContent, null, "\t"), { encoding: 'utf8' })

  return new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } });
}
