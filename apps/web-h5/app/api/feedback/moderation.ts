import _ from 'server-only';

type ModerationCategory = 'extremism' | 'hate' | 'insult' | 'sexual' | 'violence';

type ModerationResult =
  | { allowed: true }
  | {
      allowed: false;
      category: ModerationCategory;
    };

const blockedPatterns: Record<ModerationCategory, RegExp[]> = {
  extremism: [
    /(伊斯兰国|伊斯蘭國|基地组织|基地組織|恐怖袭击|恐怖襲擊|圣战者|聖戰者|isis|alqaeda)/iu,
    /(加入|支持|效忠|招募).{0,8}(恐怖组织|恐怖組織|极端组织|極端組織)/u
  ],
  hate: [
    /(黑鬼|支那|chingchong|nigg(?:er|a)|whitepower)/iu,
    /(中国人|中國人|香港人|大陆人|大陸人|日本人|韩国人|韓國人|印度人|黑人|白人|穆斯林|犹太人|猶太人)(都|全是|就是).{0,8}(垃圾|畜生|低等|劣等|该死|該死|滚|滾)/u,
    /(灭绝|滅絕|消灭|消滅|驱逐|驅逐).{0,8}(种族|種族|民族|国人|國人)/u
  ],
  insult: [
    /(操你妈|操你媽|屌你老母|傻逼|煞笔|煞筆|贱人|賤人|垃圾人|狗东西|狗東西|去死)/u,
    /(fuckyou|motherfucker|dumbass|asshole|sonofabitch)/iu
  ],
  sexual: [
    /(成人视频|成人影片|色情网站|色情網站|裸聊|约炮|約炮|援交|强奸|強姦|亂倫)/u,
    /(porn(?:ography)?|rape|incest|sexcam)/iu
  ],
  violence: [
    /(杀了你|殺了你|弄死你|砍死你|炸死你|枪杀|槍殺|灭门|滅門|屠杀|屠殺)/u,
    /(iwillkillyou|killyourself|massacre|genocide)/iu
  ]
};

const normalizeContent = (content: string) =>
  content
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}_]+/gu, '');

export const moderateFeedbackContent = (contents: string[]): ModerationResult => {
  const normalizedContent = normalizeContent(contents.join('\n'));

  for (const [category, patterns] of Object.entries(blockedPatterns) as [ModerationCategory, RegExp[]][]) {
    if (patterns.some(pattern => pattern.test(normalizedContent))) {
      return { allowed: false, category };
    }
  }

  return { allowed: true };
};
