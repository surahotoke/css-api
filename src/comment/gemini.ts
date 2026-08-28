import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { sql } from 'kysely'
import { getDb } from '../db'
import { COMMENT_MAX, GEMINI_NAME, GEMINI_TRIGGER } from './common'

const GEMINI_MODEL = 'gemini-3.5-flash-lite'

/** 返答の指示文字数。指示を超過しがちなので COMMENT_MAX よりだいぶ手前に置く */
const REPLY_TARGET = COMMENT_MAX - 80

const SYSTEM_INSTRUCTION =
  'あなたは掲示板のコメント欄に返信するアシスタント「Gemini」です。' +
  `投稿されたコメントに、日本語で${REPLY_TARGET}文字以内で簡潔に返信してください。` +
  'Markdown は使えないのでプレーンテキストで書いてください。'

/** @gemini コメントへの返答を生成して Gemini 名義のコメントとして追加する（waitUntil 用） */
export async function postGeminiReply(env: Env, apiKey: string | undefined, name: string, comment: string): Promise<void> {
  const reply = await generateReply(apiKey, name, comment)
  const db = getDb(env.DB)
  await sql`INSERT INTO comments (name, comment) VALUES (${GEMINI_NAME}, ${truncate(reply, COMMENT_MAX)})`.execute(db)
}

async function generateReply(apiKey: string | undefined, name: string, comment: string): Promise<string> {
  if (apiKey === undefined) return '（Gemini APIキーが未設定です。コメント欄の「Gemini設定…」から登録してください）'
  const body = comment.slice(GEMINI_TRIGGER.length).trim()
  try {
    const ai = new GoogleGenAI({ apiKey })
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${name}さんのコメント:\n${body || '（本文なし。あいさつしてください）'}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
    const text = res.text?.trim()
    return text ? text : '（Geminiから返答が得られませんでした）'
  } catch {
    return '（Gemini APIの呼び出しに失敗しました。APIキーや利用上限を確認してください）'
  }
}

/** サロゲートペアを壊さず UTF-16 長で max 以内に切り詰める */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  let out = ''
  for (const ch of text) {
    if (out.length + ch.length > max) break
    out += ch
  }
  return out
}
