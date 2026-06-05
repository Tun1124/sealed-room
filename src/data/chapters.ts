import type { SceneData } from '../engine/types';
import { chapter1 } from './chapter1';

/**
 * チャプター一覧（タイトル画面 / チャプター選択で使用）。
 * 新チャプターを増やすときは、ここに 1 行追加して `scene` を渡すだけ。
 * IAP の追加チャプター販売もこの配列を拡張するだけで完結する。
 */
export interface ChapterMeta {
  /** 内部ID（セーブのキー） */
  id: string;
  /** チュートリアル枠か、本編か */
  kind: 'tutorial' | 'main';
  /** 表示用ナンバー（"00" / "01" ...） */
  no: string;
  /** 日本語タイトル */
  title: string;
  /** ひとことフレーバー */
  subtitle: string;
  /** 想定プレイ時間ラベル */
  duration: string;
  /** 実際に遊べるシーンデータ（未実装なら undefined） */
  scene?: SceneData;
  /** まだ遊べない（近日公開） */
  locked?: boolean;
}

export const chapters: ChapterMeta[] = [
  {
    id: 'chapter1',
    kind: 'tutorial',
    no: '00',
    title: 'はじまりの部屋',
    subtitle: '基本操作を覚える、短い導入。',
    duration: '約3分',
    scene: chapter1,
  },
  {
    id: 'chapter2',
    kind: 'main',
    no: '01',
    title: '???',
    subtitle: '近日公開',
    duration: '—',
    locked: true,
  },
  {
    id: 'chapter3',
    kind: 'main',
    no: '02',
    title: '???',
    subtitle: '近日公開',
    duration: '—',
    locked: true,
  },
];

export function getChapter(id: string): ChapterMeta | undefined {
  return chapters.find((c) => c.id === id);
}
