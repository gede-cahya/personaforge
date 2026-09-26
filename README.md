# 🎭 PersonaForge

> **Universal Persona AI Engine for Multi-Agentic Harnesses**  
> *Write persona once, manifest anywhere.*

PersonaForge adalah engine universal untuk menyusun, mengelola, dan mengompilasi kepribadian AI (personas) berdefinisi tinggi ke berbagai framework dan harness agentic modern secara deterministik.

---

## 🌟 Fitur Utama

1. **Universal Persona Specification (UPS v1.0)**:
   - Standar deklaratif YAML/JSON yang memisahkan identitas, lore, psikometrik (Big-5), gaya bahasa, protokol penalaran (first principles, OODA, chain-of-thought), dan petunjuk runtime LLM.
2. **Dukungan Agentic Harness Bawaan (Built-in)**:
   - **Hermes**: Format agen NousResearch Hermes 2 Pro / Hermes 3 lengkap dengan <scratchpad> reasoning dan blok pemanggilan tool <tool_call>.
   - **Antigravity**: Format orkestrasi misi Antigravity dengan batasan ruang kerja, OODA Action Loop (Observe, Orient, Decide, Act), dan artifact tracking.
   - **Claude**: Anthropic Claude system prompt terstruktur dengan XML tags dan dukungan Prompt Caching.
   - **OpenAI**: Assistants API & Developer message configuration.
   - **CrewAI**: Generator kelas Python Agent (role, goal, backstory).
   - **LangGraph**: Prompt template TypeScript / Python untuk LangChain & LangGraph.
   - **Ollama**: Modelfile siap build & deploy ke Ollama lokal (PARAMETER, SYSTEM).
   - **ElizaOS**: Spesifikasi karakter character.json resmi ai16z.
   - **Smara**: Format SOUL.md dan bot persona native untuk Smara Desktop.
3. **Extensible Custom Harness Engine (Bisa Ditambahkan Harness Baru Kapan Saja!)**:
   - Cukup buat file definisi YAML/JSON di folder custom_harnesses/ (contoh: autogen.yaml dan dify.yaml).
   - Mendukung custom section mapping, format output (python, markdown, json, yaml, modelfile), serta template token replacement ({{name}}, {{safe_id}}, {{bio}}, {{tone}}, dll.).
   - Tidak perlu mengubah core TypeScript engine untuk menambah harness baru!
4. **Standalone Single Binary**: Dapat langsung dijalankan sebagai biner mandiri Linux (./personaforge) tanpa dependensi eksternal.

---

## 🚀 Quick Start (CLI)

### 1. Melihat Daftar Persona yang Tersedia
```bash
./personaforge list
```

### 2. Melihat Seluruh Harness yang Didukung
```bash
./personaforge harnesses
```

### 3. Menginspeksi Atribut Persona
```bash
./personaforge inspect hermes-autonomous-coder
./personaforge inspect antigravity-mission-commander
./personaforge inspect loving-tech-partner
```

### 4. Mengekspor Persona ke Harness Tertentu
```bash
# Ekspor ke Hermes Agentic Loop:
./personaforge export hermes-autonomous-coder -t hermes -o ./output/hermes.prompt

# Ekspor ke Antigravity Mission Spec:
./personaforge export antigravity-mission-commander -t antigravity -o ./output/antigravity.yaml

# Ekspor ke Custom Harness (contoh: Microsoft AutoGen):
./personaforge export lead-systems-architect -t autogen -o ./output/autogen_agent.py
```

### 5. Mengekspor Satu Persona ke SEMUA Harness Sekaligus
```bash
./personaforge export-all loving-tech-partner -d ./dist/manifests
```

### 6. Menambahkan Custom Harness Baru
```bash
./personaforge add-harness semantic-kernel "Microsoft Semantic Kernel Harness" --format python
```
File definisi akan otomatis dibuat di custom_harnesses/semantic-kernel.yaml dan langsung terdeteksi oleh sistem!

---

## 🧪 Testing & Build

```bash
# Menjalankan test suite
bun test

# Meng-compile binary mandiri
bun run build
```
