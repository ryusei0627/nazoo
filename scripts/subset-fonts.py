#!/usr/bin/env python3
"""M PLUS Rounded 1c をアプリで実際に使う文字だけにサブセット化する。

各ウェイト約3.3MB（全漢字収録）→数十KBへ。web/iOS両方のバンドルが軽くなる。

文字集合 =
  - 全ソース(App.tsx, src/**/*.ts,tsx)に出てくる全文字（UIラベル・questions.ts の問題/ヒント/答え/accept すべてを網羅）
  - ひらがな・カタカナ全ブロック（フリックキーボードの動的入力を完全カバー）
  - ASCII・全角英数・日本語の約物（記号）

使う4ウェイトのみ出力。出力先 assets/fonts/。
再生成: コンテンツ追加後にこのスクリプトを再実行するだけ。
  /tmp/fontvenv/bin/python scripts/subset-fonts.py
"""
import os
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = os.path.join(ROOT, "node_modules/@expo-google-fonts/m-plus-rounded-1c")
OUT = os.path.join(ROOT, "assets/fonts")

WEIGHTS = {
    "500Medium": "MPLUSRounded1c_500Medium",
    "700Bold": "MPLUSRounded1c_700Bold",
    "800ExtraBold": "MPLUSRounded1c_800ExtraBold",
    "900Black": "MPLUSRounded1c_900Black",
}

# 1) ソースから全文字を収集
chars = set()
patterns = ["App.tsx", "src/**/*.ts", "src/**/*.tsx"]
files = []
for p in patterns:
    files += glob.glob(os.path.join(ROOT, p), recursive=True)
for f in files:
    with open(f, encoding="utf-8") as fh:
        chars |= set(fh.read())

# 2) かな全ブロック（動的入力＝フリックキーボードのかなを完全カバー）
for cp in range(0x3041, 0x309F + 1):  # ひらがな（濁点・小書き含む）
    chars.add(chr(cp))
for cp in range(0x30A0, 0x30FF + 1):  # カタカナ
    chars.add(chr(cp))
chars.add("ー")  # 長音符 ー

# 3) ASCII印字可能・全角英数・日本語約物
for cp in range(0x20, 0x7E + 1):
    chars.add(chr(cp))
for cp in range(0xFF10, 0xFF19 + 1):  # 全角数字 ０-９
    chars.add(chr(cp))
for cp in range(0xFF21, 0xFF3A + 1):  # 全角A-Z
    chars.add(chr(cp))
for cp in range(0xFF41, 0xFF5A + 1):  # 全角a-z
    chars.add(chr(cp))
chars |= set("、。，．・：；！？「」『』（）〔〕［］｛｝〈〉《》【】…‥ー〜～％＆＋－＝／　♪☆★♥♡✨→←↑↓№℃")

# 制御文字は除外
chars = {c for c in chars if ord(c) >= 0x20 or c == " "}
chars.discard("\n")
chars.discard("\r")
chars.discard("\t")

text = "".join(sorted(chars))
print(f"収集文字数: {len(chars)}")

os.makedirs(OUT, exist_ok=True)

import subprocess
import sys

total_before = 0
total_after = 0
for sub, fam in WEIGHTS.items():
    src = os.path.join(PKG, sub, f"{fam}.ttf")
    dst = os.path.join(OUT, f"{fam}.ttf")
    before = os.path.getsize(src)
    subprocess.run([
        sys.executable, "-m", "fontTools.subset", src,
        f"--text={text}",
        f"--output-file={dst}",
        "--layout-features=*",
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=*",  # 名前テーブルを残す（iOSのフォント登録に必須。空にするとネイティブで読込失敗）
        "--notdef-outline",
        "--recalc-bounds",
    ], check=True)
    after = os.path.getsize(dst)
    total_before += before
    total_after += after
    print(f"  {fam}: {before/1024/1024:.2f}MB -> {after/1024:.0f}KB")

print(f"合計: {total_before/1024/1024:.1f}MB -> {total_after/1024:.0f}KB")
