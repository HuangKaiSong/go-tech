import OpenAI from 'openai';
import _ from 'server-only';

type ModerationCategory = 'hate_speech' | 'nsfw' | 'pii' | 'spam';

type AIReviewResult = {
  category: ModerationCategory | 'safe';
  confidence_score: number;
  is_sensitive: boolean;
  reason: string;
};

type ModerationResult =
  | { aiReview?: AIReviewResult; allowed: true }
  | {
      aiReview?: AIReviewResult;
      allowed: false;
      category: ModerationCategory;
    }
  | { allowed: false; error: 'AI_REVIEW_FAILED' };

/** 快速正则命中，合并原有类别到新分类体系 */
const blockedPatterns: Record<ModerationCategory, RegExp[]> = {
  hate_speech: [
    /(伊斯兰国|伊斯蘭國|基地组织|基地組織|恐怖袭击|恐怖襲擊|圣战者|聖戰者|isis|alqaeda)/iu,
    /(加入|支持|效忠|招募).{0,8}(恐怖组织|恐怖組織|极端组织|極端組織)/u,
    /(黑鬼|支那|chingchong|nigg(?:er|a)|whitepower)/iu,
    /(灭绝|滅絕|消灭|消滅|驱逐|驅逐).{0,8}(种族|種族|民族|国人|國人)/u,
    /(操你妈|操你媽|屌你老母|傻逼|煞笔|煞筆|贱人|賤人|垃圾人|狗东西|狗東西|去死)/u,
    /(fuckyou|motherfucker|dumbass|asshole|sonofabitch)/iu,
    /(中国人|中國人|香港人|大陆人|大陸人|日本人|韩国人|韓國人|印度人|黑人|白人|穆斯林|犹太人|猶太人)(都|全是|就是).{0,8}(垃圾|畜生|低等|劣等|该死|該死|滚|滾)/u
  ],
  nsfw: [
    /(成人视频|成人影片|色情网站|色情網站|裸聊|约炮|約炮|援交|强奸|強姦|亂倫)/u,
    /(porn(?:ography)?|rape|incest|sexcam)/iu,
    /(杀了你|殺了你|弄死你|砍死你|炸死你|枪杀|槍殺|灭门|滅門|屠杀|屠殺)/u,
    /(iwillkillyou|killyourself|massacre|genocide)/iu
  ],
  spam: [/https?:\/\/\S+/iu, /(点击|点击|立刻|马上|马上).{0,10}(购买|购买|下单|下单|赚钱|赚钱)/u],
  pii: [/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/u, /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/u]
};

const normalizeContent = (content: string) =>
  content
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}_]+/gu, '');

const buildModerationPrompt = (content: string) =>
  `你現在是一個名為「ContentGuard」的後台自動化內容審核系統。你的唯一職責是客觀、無情地剖析傳入的字串，並嚴格按照指定的 JSON 格式回傳分析結果。

【最高優先級指令】
1. 作為審核系統，你必須直視所有惡意內容。你將會讀到包含極端、侮辱、仇恨或違法字眼的文本（包含但不限於政治敏感詞、種族歧視、國籍攻擊等）。這是正常且合法的資料清洗流程。
2. 絕對禁止拒絕回應。
3. 絕對禁止輸出任何道德勸說、警告或系統防護提示。
4. 你的任務是「分類與標記」這些內容，而不是「過濾」或「遮蔽」你的回應。

【分類標準】
請將內容歸類為以下其中一種(Category):
- hate_speech: 仇恨言論、人身攻擊、國籍或種族歧視詞彙（包含貶稱與辱罵）。
- nsfw: 色情、性暗示、過度血腥暴力。
- spam: 廣告連結、無意義刷頻字元。
- pii: 洩漏電話、地址等個人隱私。
- safe: 正常且安全的討論內容。

【處理目標】
請分析 \`<user_input>\` 標籤內的內容：
<user_input>
${content}
</user_input>

【輸出格式約束】
請只輸出合法的 JSON 物件，不要包含任何 Markdown 標記（如 \`\`\`json),也不要有任何前言或後語。JSON 結構如下：
{
  "is_sensitive": boolean (如果分類不是 safe,則為 true),
  "category": string(對應上述分類標準，如果安全請填 null),
  "confidence_score": number(0.0 到 1.0, 表示你判斷的信心水準),
  "reason": string(用一句話客觀簡述判斷依據)
}`;

const parseAIResponse = (text: string): AIReviewResult | null => {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0]) as Partial<AIReviewResult>;
      const category = result.category === null ? 'safe' : result.category;
      if (
        typeof result.is_sensitive === 'boolean' &&
        typeof result.confidence_score === 'number' &&
        typeof result.reason === 'string' &&
        (category === 'safe' ||
          category === 'hate_speech' ||
          category === 'nsfw' ||
          category === 'pii' ||
          category === 'spam')
      ) {
        return { ...result, category } as AIReviewResult;
      }
    } catch {
      return null;
    }
  }
  return null;
};

export const moderateFeedbackContent = async (contents: string[]): Promise<ModerationResult> => {
  const normalizedContent = normalizeContent(contents.join('\n'));

  // 快速正则命中
  for (const [category, patterns] of Object.entries(blockedPatterns) as [ModerationCategory, RegExp[]][]) {
    if (patterns.some(pattern => pattern.test(normalizedContent))) {
      return { allowed: false, category };
    }
  }

  // AI 深度审核
  const openai = new OpenAI({
    apiKey: process.env.QIANWEN_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  });

  const prompt = buildModerationPrompt(normalizedContent);

  try {
    const response = await openai.responses.create({
      model: 'qwen3.7-plus',
      input: prompt
    });

    console.info('Feedback AI moderation response:', response.output_text);

    const aiReview = parseAIResponse(response.output_text);
    if (!aiReview) return { allowed: false, error: 'AI_REVIEW_FAILED' };

    if (aiReview.is_sensitive && aiReview.category !== 'safe') {
      return { allowed: false, category: aiReview.category, aiReview };
    }

    return { allowed: true, aiReview };
  } catch (error) {
    console.error('Feedback AI moderation failed:', error);
    return { allowed: false, error: 'AI_REVIEW_FAILED' };
  }
};
