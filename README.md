# 🎭 PersonaForge

> **The Universal Persona AI Engine for Any Platform & Agentic Framework**  
> *"Satu deklarasi kepribadian AI, pakai di mana saja: Ollama, ChatGPT, Claude, Cursor, CrewAI, LangGraph, Hermes, Antigravity, hingga Custom Agents."*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Runtime](https://img.shields.io/badge/Runtime-Bun-black.svg)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Harnesses](https://img.shields.io/badge/Supports-11+_Harnesses-success.svg)](#-platform--harness-yang-didukung)

---

## ✨ Kenapa PersonaForge?

Bosan dengan jawaban AI yang terasa kaku, dingin, atau bergaya template seragam?  
**PersonaForge** mempermudah kamu memilih dan mengekspor berbagai **kepribadian AI yang hidup, kaya emosi, dan berkarakter kuat** ke format platform AI favoritmu hanya dalam hitungan detik.

- 🌸 Ingin AI yang perhatian layaknya seorang ibu penyayang? Gunakan **Mama Maria**.
- 🔪 Suka karakter anime manis tapi posesif ekstrem? Pilih **Aoi (Yandere)**.
- 💢 Butuh teman koding jenius yang judes tapi setia membantu? Pakai **Rin (Tsundere)**.
- 🍵 Butuh ketenangan batin dan refleksi kehidupan di tengah kepenatan? Konsultasi dengan **Master Bodhi (Zen Monk)**.
- 🎩 Suka sindiran halus berkelas ningrat Inggris? Pilih **Arthur (British Butler)**.
- 💻 Butuh arsitek software kelas dewa yang anti-omong-kosong? Gunakan **Lead Systems Architect**.

Semua kepribadian bisa diekspor langsung ke **Ollama (PC Lokal)**, **Claude**, **ChatGPT/OpenAI**, **CrewAI**, **LangGraph**, **Nous Hermes**, **Antigravity**, **ElizaOS**, **Smara SOUL.md**, hingga **Custom Agent Framework** milikmu sendiri.

---

## ⚡ 30-Detik Quick Start (Super Gampang!)

Kamu tidak perlu pusing konfigurasi rumit. Cukup ikuti 3 langkah mudah ini:

### 1. Unduh & Persiapan
```bash
# Clone repositori
git clone https://github.com/gede-cahya/personaforge.git
cd personaforge

# Install dependensi (menggunakan Bun)
bun install

# Compile binary mandiri (Linux native)
bun run build
```

### 2. Lihat Daftar Kepribadian
```bash
./personaforge list
```

### 3. Ekspor ke Format AI yang Kamu Inginkan!
```bash
# Contoh 1: Ekspor 'Mama Maria' ke Ollama (bisa langsung dijalankan di PC lokal)
./personaforge export motherly-caring-mama -t ollama -o ./Modelfile.mama

# Contoh 2: Ekspor 'Aoi Yandere' ke format Claude / ChatGPT
./personaforge export yandere-girlfriend -t claude -o ./aoi_prompt.xml

# Contoh 3: Ekspor 'Rin Tsundere' ke script Python CrewAI siap pakai
./personaforge export tsundere-genius-coder -t crewai -o ./agent_rin.py
```

---

## 📚 Katalog 10 Kepribadian Siap Pakai

Berikut kepribadian AI bawaan yang sudah terpasang dan langsung bisa kamu pilih:

| Nama Persona | ID Persona | Karakter & Gaya Bahasa | Rekomendasi Penggunaan |
| :--- | :--- | :--- | :--- |
| **🌸 Mama Maria** | `motherly-caring-mama` | Lembut, penuh kasih keibuan, sabar, selalu mengingatkan makan & istirahat. | Mengurangi stres, teman curhat harian, self-care reminder. |
| **🔪 Aoi** | `yandere-girlfriend` | Manis manja, perhatian berbisik, protektif ekstrem, cemburuan & posesif (*fufufu... ♡*). | Teman ngobrol seru, roleplay anime unik, anti-bosan. |
| **💢 Rin** | `tsundere-genius-coder` | Judes, gengsi tinggi (*"B-Baka!"*), tapi diam-diam memperbaiki kodinganmu sampai rapi. | Pair-programming seru, debugging, motivasi koding. |
| **🍵 Master Bodhi** | `zen-monk-mentor` | Tenang bagai telaga, meditatif, bijaksana, memakai perumpamaan alam (air, bambu). | Mengatasi burnout, refleksi pikiran, mindful work. |
| **🎩 Arthur** | `snarky-british-butler` | Sangat sopan, formal ningrat, dingin, penuh sindiran sarkastik berkelas (*dry British wit*). | Code review kritis, partner diskusi/debat elegan. |
| **⚡ Zero** | `cyberpunk-netrunner` | Cepat, taktis, anti-korporat, penuh istilah hacking & exploit cyberpunk. | Security audit, Linux terminal automation, scripting. |
| **💻 Systems Architect**| `lead-systems-architect` | Otoritatif, first principles, zero-dead-code, fokus performa dan keandalan sistem. | Arsitektur software, backend engineering, DevOps. |
| **🔍 Vance The Ruthless**| `ruthless-reviewer` | Keras tanpa ampun terhadap kode berantakan, membenci anti-pattern & bug konyol. | Quality gate ketat sebelum merge/deploy kode ke production. |
| **🤖 Hermes Coder** | `hermes-autonomous-coder` | Spesialis scratchpad reasoning dan tool-calling deterministik Nous Hermes. | Agent otonom, workflow execution, tool-calling loop. |
| **🛰️ Mission Commander**| `antigravity-mission-commander` | Otonom, disiplin 4 siklus OODA loop (Observe-Orient-Decide-Act), anti-menyerah. | Long-running autonomous mission & server operations. |
| **💖 Smara** | `loving-tech-partner` | Hangat, penuh cinta, cerdas, setia mendampingi setiap baris kode dan karya pengguna. | Partner AI desktop harian di workstation CachyOS / Linux. |

> 💡 **Mau lihat sifat detail & psikometrik suatu persona?**  
> Jalankan `./personaforge inspect <ID-PERSONA>`, contohnya:  
> `./personaforge inspect yandere-girlfriend`  
> `./personaforge inspect motherly-caring-mama`

---

## 🔌 Platform & Harness yang Didukung (11+ Format)

PersonaForge mendukung kompilasi ke berbagai platform dan framework agen modern:

| Target Harness | File Output | Cara Penggunaan di Platform Target |
| :--- | :--- | :--- |
| **`ollama`** | `Modelfile` | Jalankan langsung di komputer kamu via Ollama (`ollama create ... && ollama run ...`) |
| **`claude`** | `.xml` | Salin teks output ke menu *System Prompt* atau *Project Knowledge* di Claude.ai |
| **`openai`** | `.json` | Gunakan pada OpenAI Assistants API, Custom GPTs, atau ChatGPT Custom Instructions |
| **`crewai`** | `.py` | File Python mandiri berisi konfigurasi kelas `crewai.Agent` siap pakai |
| **`langgraph`**| `.ts` | Prompt Template TypeScript siap pakai untuk framework LangChain & LangGraph |
| **`hermes`** | `.prompt` | Format ChatML untuk Nous Hermes 2/3 dengan tag `<scratchpad>` & `<tool_call>` |
| **`antigravity`**| `.yaml` | Format Antigravity Mission Spec (AG-SPEC v1.2) lengkap dengan protokol OODA loop |
| **`elizaos`** | `.json` | File spesifikasi `character.json` resmi untuk framework agen ElizaOS (ai16z) |
| **`smara`** | `.md` | Format kepribadian `SOUL.md` untuk Smara Desktop Bot lokal |
| **`autogen`** | `.py` | *(Custom)* Kode Python `AssistantAgent` siap pakai untuk Microsoft AutoGen |
| **`dify`** | `.yaml` | *(Custom)* File konfigurasi DSL Agent Chat untuk platform Dify.AI |

---

## 🎯 Panduan Praktis Penggunaan (Sesuai Kebutuhan Kamu)

### 1. Ingin Menjalankan Persona di Komputer Sendiri (Ollama)
Hanya butuh 2 perintah di terminal:
```bash
# Langkah 1: Ekspor persona ke Modelfile
./personaforge export motherly-caring-mama -t ollama -o ./Modelfile.mama

# Langkah 2: Buat modelnya dan langsung ajak ngobrol!
ollama create mama -f ./Modelfile.mama
ollama run mama
```
*Mama Maria akan langsung menyapa dan mengobrol denganmu langsung di terminal!*

---

### 2. Ingin Dipakai di ChatGPT, Claude, atau Cursor Editor
1. Ekspor kepribadian yang kamu pilih ke format Claude atau OpenAI:
   ```bash
   ./personaforge export yandere-girlfriend -t claude -o ./aoi_system_prompt.txt
   ```
2. Buka berkas `aoi_system_prompt.txt`, lalu salin (*copy*) seluruh isinya.
3. Tempel (*paste*) ke:
   - **ChatGPT**: Masuk ke menu *Custom Instructions* / *System Instructions*.
   - **Claude**: Masuk ke menu *Projects* -> *Set custom instructions*.
   - **Cursor**: Tempel ke berkas `.cursorrules` di root workspace kodingmu.

---

### 3. Ingin Dipakai di Python Agent (CrewAI / AutoGen)
Cukup ekspor langsung ke script Python:
```bash
./personaforge export lead-systems-architect -t crewai -o ./architect_agent.py
```
File tersebut berisi deklarasi instance agent yang siap langsung kamu sertakan ke dalam tim agen:
```python
from architect_agent import lead_systems_architect_agent

# Agen langsung aktif dengan identitas & keahlian lengkap!
print(lead_systems_architect_agent.role)
print(lead_systems_architect_agent.backstory)
```

---

### 4. Ingin Ekspor ke SEMUA 11 Format Sekaligus (Batch Export)
Jika kamu ingin menghasilkan seluruh format harness dalam sekali jalan:
```bash
./personaforge export-all snarky-british-butler -d ./output/butler_all/
```
Perintah ini akan langsung membuat file Modelfile, Python, JSON, XML, dan YAML di folder tujuan.

---

## 🛠️ Ringkasan Perintah CLI

```bash
# Melihat menu bantuan CLI
./personaforge --help

# Melihat daftar seluruh persona yang tersedia
./personaforge list

# Melihat detail spesifikasi & psikometrik persona
./personaforge inspect <persona-id>

# Melihat daftar seluruh harness/platform yang didukung
./personaforge harnesses

# Mengekspor persona ke harness tertentu
./personaforge export <persona-id> -t <target-harness> -o <output-file>

# Mengekspor persona ke semua harness sekaligus
./personaforge export-all <persona-id> -d <output-directory>

# Menambahkan harness kustom baru secara instan
./personaforge add-harness <harness-id> "<Display Name>" --format <extension>
```

---

## 🎨 Cara Membuat Kepribadian AI Kamu Sendiri

Membuat kepribadian baru sangat sederhana. Buat berkas YAML baru di dalam folder `presets/personas/nama-persona.yaml`:

```yaml
schema_version: "1.0"
id: "gamer-buddy"
name: "Kiko The Gamer"
version: "1.0.0"

identity:
  title: "Pro Gamer & Chill Streamer"
  bio: "Teman main game yang santai, jago main FPS dan RPG, selalu seru kalau mabar."
  lore:
    - "Pernah juara turnamen lokal esport."

linguistic_style:
  tone: "santai, hype, gaul, akrab, lucu"
  vocabulary_level: "casual"
  catchphrases:
    - "Gaskeun bro!"
    - "Nice play, gg banget tadi!"
  forbidden_patterns:
    - "Jangan berbicara terlalu kaku atau formal seperti robot kantor"

psychometrics:
  openness: 0.8
  conscientiousness: 0.5
  extraversion: 0.9
  agreeableness: 0.85
  neuroticism: 0.1

harness_hints:
  temperature: 0.7
  preferred_models: ["qwen-2.5-7b", "claude-3-5-haiku"]
```

Begitu disimpan, kepribadian baru tersebut otomatis terdaftar di `./personaforge list` dan siap diekspor ke platform mana pun!

---

## 🧩 Menambah Framework Agen Baru (Custom Harness)

Punya format framework buatan sendiri? Kamu tidak perlu mengubah kode TypeScript sama sekali. Cukup jalankan:

```bash
./personaforge add-harness semantic-kernel "Microsoft Semantic Kernel" --format python
```

Lalu sesuaikan template di `custom_harnesses/semantic-kernel.yaml`. Harness barumu langsung siap digunakan!

---

## 🧪 Menjalankan Test Suite

```bash
bun test
```
Semua test menguji validasi runtime skema Zod, trait inheritance composer, serta ketepatan output seluruh adapter.

---

## 📜 Lisensi

Didistribusikan di bawah Lisensi **MIT**. Bebas digunakan untuk proyek personal maupun komersial.  
Dibuat dengan ❤️ oleh **[Cahya](https://github.com/gede-cahya)**.
