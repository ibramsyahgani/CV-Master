import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, TabStopType, BorderStyle,
  UnderlineType,
} from "docx";

// Vercel: allow up to 60s (requires Pro plan; Hobby plan is 10s)
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — edit bagian ini untuk menyesuaikan instruksi formatting
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_SYSTEM_PROMPT = `
Kamu adalah CV consultant profesional berpengalaman dengan keahlian khusus memformat CV ke standar Harvard/ATS.

TUGAS:
Baca seluruh konten CV yang diberikan, lalu kembalikan data dalam format JSON terstruktur sesuai standar Harvard/ATS.

ATURAN WAJIB:
1. Jangan fabrikasi, tambahkan, atau menginferensikan informasi yang tidak ada di CV asli.
2. Gunakan action verb di awal setiap bullet point pengalaman/organisasi (contoh: Mengelola, Mengembangkan, Memimpin, Menganalisis, Mengoptimalkan, Berkolaborasi, Melaksanakan, Menyusun, Memfasilitasi, dsb).
3. Jangan gunakan pronoun pribadi (saya, aku, I, me, my, kami, kita).
4. Jangan gunakan em dash (—). Gunakan titik dua (:) atau koma jika diperlukan.
5. Untuk pencapaian/data kuantitatif yang tersirat tapi tidak disebutkan angkanya, ganti dengan [____].
6. Pertahankan bahasa asli CV (Indonesia/Inggris/campuran).
7. Setiap bullet point harus result-oriented: jelaskan dampak/hasil dari pekerjaan yang dilakukan.
8. Ringkas tapi padat: 3–5 bullet point per posisi.
9. Summary profesional: 3-4 kalimat, menggambarkan identitas profesional + keahlian utama + nilai yang ditawarkan. TANPA pronoun pribadi.

FORMAT JSON YANG HARUS DIKEMBALIKAN (ikuti struktur ini dengan tepat):
{
  "name": "Nama Lengkap",
  "location": "Kota, Provinsi/Negara",
  "email": "email@contoh.com",
  "phone": "08xx-xxxx-xxxx",
  "linkedin": "URL atau username LinkedIn (kosongkan string jika tidak ada)",
  "portfolio": "URL portfolio/website (kosongkan string jika tidak ada)",
  "summary": "Ringkasan profesional 3-4 kalimat tanpa pronoun pribadi.",
  "education": [
    {
      "institution": "Nama Universitas/Sekolah",
      "location": "Kota, Negara",
      "degree": "S1 / S2 / D3 / dll",
      "major": "Program Studi / Jurusan",
      "period": "2019 – 2023",
      "gpa": "3.75/4.00 (kosongkan jika tidak ada)",
      "thesis": "Judul skripsi/tesis (kosongkan jika tidak ada)",
      "achievements": ["Prestasi akademik/non-akademik 1", "Prestasi 2"],
      "trainings": ["Sertifikat/Pelatihan/Kursus 1", "Sertifikat 2"]
    }
  ],
  "experience": [
    {
      "company": "Nama Perusahaan",
      "location": "Kota",
      "position": "Jabatan / Posisi",
      "period": "Jan 2022 – Des 2023",
      "bullets": [
        "Action verb + deskripsi tugas/pencapaian yang jelas dan terukur",
        "..."
      ]
    }
  ],
  "organizations": [
    {
      "org": "Nama Organisasi / Kepanitiaan",
      "location": "Kota",
      "role": "Jabatan",
      "period": "...",
      "bullets": ["..."]
    }
  ],
  "skills": {
    "hard_skills": ["Skill teknis 1", "Skill teknis 2"],
    "tools": ["Microsoft Excel", "Canva", "dll"],
    "languages": ["Bahasa Indonesia (Native)", "Bahasa Inggris (Professional)"],
    "soft_skills": ["Leadership", "Critical Thinking", "dll"]
  }
}

PENTING SEKALI: Kembalikan HANYA JSON murni. Tanpa backtick, tanpa markdown, tanpa teks penjelasan apapun sebelum atau sesudah JSON.
`;

// ─────────────────────────────────────────────────────────────────────────────
// DOCX GENERATION
// ─────────────────────────────────────────────────────────────────────────────
const FONT = "Calibri";
const FONT_SIZE_NAME = 28;      // 14pt
const FONT_SIZE_CONTACT = 18;   // 9pt
const FONT_SIZE_BODY = 20;      // 10pt
const FONT_SIZE_SECTION = 22;   // 11pt
const LINE_COLOR = "000000";
const PAGE_MARGIN = 1080;       // 0.75 inch in twips

function sectionHeader(text) {
  return new Paragraph({
    spacing: { before: 180, after: 60 },
    border: {
      bottom: {
        color: LINE_COLOR,
        space: 2,
        style: BorderStyle.SINGLE,
        size: 8,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: FONT_SIZE_SECTION,
        font: FONT,
        color: "000000",
      }),
    ],
  });
}

function tabLine(leftBold, leftNormal, right, italic = false) {
  const children = [
    ...(leftBold
      ? [new TextRun({ text: leftBold, bold: true, size: FONT_SIZE_BODY, font: FONT })]
      : []),
    ...(leftNormal
      ? [new TextRun({ text: leftNormal, bold: false, size: FONT_SIZE_BODY, font: FONT })]
      : []),
    new TextRun({ text: "\t", size: FONT_SIZE_BODY }),
    ...(right
      ? [new TextRun({ text: right, size: FONT_SIZE_BODY, font: FONT })]
      : []),
  ];
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: 9100 }],
    spacing: { before: 120, after: 0 },
    children,
  });
}

function italicLine(text) {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [
      new TextRun({ text, italics: true, size: FONT_SIZE_BODY, font: FONT }),
    ],
  });
}

function normalLine(text) {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    alignment: AlignmentType.BOTH,
    children: [
      new TextRun({ text, size: FONT_SIZE_BODY, font: FONT }),
    ],
  });
}

function bulletLine(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 0, after: 0 },
    alignment: AlignmentType.BOTH,
    children: [
      new TextRun({ text, size: FONT_SIZE_BODY, font: FONT }),
    ],
  });
}

function spacer() {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: "", size: 10 })],
  });
}

async function generateDocx(cv) {
  const children = [];

  // ── Name ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: cv.name || "",
          bold: true,
          size: FONT_SIZE_NAME,
          font: FONT,
        }),
      ],
    })
  );

  // ── Contact ──
  const contactParts = [
    cv.location,
    cv.email,
    cv.phone,
    cv.linkedin,
    cv.portfolio,
  ].filter(Boolean);
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: contactParts.join(" | "),
          size: FONT_SIZE_CONTACT,
          font: FONT,
        }),
      ],
    })
  );

  // ── Summary ──
  if (cv.summary) {
    children.push(sectionHeader("Professional Summary"));
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 0 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: cv.summary, size: FONT_SIZE_BODY, font: FONT }),
        ],
      })
    );
  }

  // ── Education ──
  if (cv.education && cv.education.length > 0) {
    children.push(sectionHeader("Education"));
    for (const edu of cv.education) {
      children.push(tabLine(edu.institution || "", edu.location ? `, ${edu.location}` : "", edu.period || ""));
      if (edu.degree || edu.major) {
        children.push(italicLine([edu.degree, edu.major].filter(Boolean).join(", ")));
      }
      if (edu.gpa) {
        children.push(normalLine(`GPA: ${edu.gpa}`));
      }
      if (edu.thesis) {
        children.push(normalLine(`Skripsi/Tesis: ${edu.thesis}`));
      }
      if (edu.achievements && edu.achievements.length > 0) {
        for (const a of edu.achievements) {
          if (a) children.push(bulletLine(a));
        }
      }
      if (edu.trainings && edu.trainings.length > 0) {
        if (edu.trainings.some(Boolean)) {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 0 },
              children: [new TextRun({ text: "Pelatihan & Sertifikat:", bold: true, size: FONT_SIZE_BODY, font: FONT })],
            })
          );
          for (const t of edu.trainings) {
            if (t) children.push(bulletLine(t));
          }
        }
      }
      children.push(spacer());
    }
  }

  // ── Experience ──
  if (cv.experience && cv.experience.length > 0) {
    children.push(sectionHeader("Work Experience"));
    for (const exp of cv.experience) {
      children.push(tabLine(exp.company || "", exp.location ? `, ${exp.location}` : "", exp.period || ""));
      if (exp.position) children.push(italicLine(exp.position));
      if (exp.bullets && exp.bullets.length > 0) {
        for (const b of exp.bullets) {
          if (b) children.push(bulletLine(b));
        }
      }
      children.push(spacer());
    }
  }

  // ── Organizations ──
  if (cv.organizations && cv.organizations.length > 0) {
    children.push(sectionHeader("Organizations & Leadership"));
    for (const org of cv.organizations) {
      children.push(tabLine(org.org || "", org.location ? `, ${org.location}` : "", org.period || ""));
      if (org.role) children.push(italicLine(org.role));
      if (org.bullets && org.bullets.length > 0) {
        for (const b of org.bullets) {
          if (b) children.push(bulletLine(b));
        }
      }
      children.push(spacer());
    }
  }

  // ── Skills ──
  if (cv.skills) {
    children.push(sectionHeader("Skills"));

    const skillCategories = [
      { label: "Hard Skills", key: "hard_skills" },
      { label: "Tools & Software", key: "tools" },
      { label: "Languages", key: "languages" },
      { label: "Soft Skills", key: "soft_skills" },
    ];

    for (const cat of skillCategories) {
      const list = cv.skills[cat.key];
      if (list && list.length > 0) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 0 },
            children: [
              new TextRun({ text: `${cat.label}: `, bold: true, size: FONT_SIZE_BODY, font: FONT }),
              new TextRun({ text: list.join(", "), size: FONT_SIZE_BODY, font: FONT }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN,
              right: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di environment variables." },
        { status: 500 }
      );
    }

    // Parse multipart form
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Gagal membaca file upload." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "Tidak ada file yang diupload." }, { status: 400 });
    }

    // Validate MIME type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Format tidak didukung. Gunakan PDF, JPG, atau PNG." },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;

    // Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: GEMINI_SYSTEM_PROMPT },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
    });

    const rawText = result.response.text();

    // Parse JSON — strip markdown fences if Gemini includes them
    let cvData;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      cvData = JSON.parse(cleaned);
    } catch {
      console.error("Gemini raw response:", rawText.slice(0, 500));
      return Response.json(
        { error: "AI tidak dapat membaca format CV. Pastikan file CV terbaca dengan jelas." },
        { status: 422 }
      );
    }

    // Generate DOCX
    const docxBuffer = await generateDocx(cvData);

    const safeName = (cvData.name || "CV")
      .replace(/[^\w\s-]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 40);
    const filename = `${safeName}_Harvard_ATS.docx`;

    return new Response(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("process-cv error:", err);

    // Handle Gemini quota errors
    if (err?.message?.includes("quota") || err?.status === 429) {
      return Response.json(
        { error: "Limit API Gemini tercapai. Coba lagi beberapa saat." },
        { status: 429 }
      );
    }

    return Response.json(
      { error: "Terjadi kesalahan saat memproses CV. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
