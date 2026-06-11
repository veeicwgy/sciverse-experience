/*
 * Sciverse · Experience Page (主入口)
 * Layout: Sidebar (260/64) + Main (search · skills bubble · result list · ecosystem · data capability)
 * Style: Editorial Lab — paper #FAFAF7, hairline #ECECE7, brand #5B5BF7, Fraunces+Inter+JetBrainsMono
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ArrowUp,
  ChevronUp,
  Loader2,
  AlertOctagon,
  FileText,
  Globe,
  ExternalLink,
  Sparkles,
  Zap,
  Activity,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Atom,
  Boxes,
  SlidersHorizontal,
  Calendar,
  BookOpen,
  TrendingUp,
  Database,
  Languages,
  ArrowUpDown,
  Download,
  BarChart3,
  ChevronDown,
  Info,
  Copy,
  BookOpenCheck,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import IntegrationBubble from "@/components/experience/IntegrationBubble";
import SearchErrorState, {
  type SearchErrorKind,
} from "@/components/experience/SearchErrorState";
import ContentSnippet from "@/components/experience/ContentSnippet";
import HowItWorksSection from "@/components/experience/HowItWorksSection";
import { cn } from "@/lib/utils";
import { COOKBOOKS } from "@/data/cookbooks";
import { useSessionHistory, findSession, findVersion } from "@/hooks/useSessionHistory";
import { GitBranch, Plus, Check } from "lucide-react";

/**
 * CountUp · IntersectionObserver 首次入视口才跳动。
 * 支持 "25M+" / "570K+" / "50K+" / "10M+" 以及中文数量单位 "万" 。
 */
function CountUp({ value, duration = 1400, delay = 0 }: { value: string; duration?: number; delay?: number }) {
  // 拆解原字符串为：前缀数字 + 单位后缀（保留 + 等符号）
  const parsed = useMemo(() => {
    const m = value.match(/^([\d,.]+)(.*)$/);
    if (!m) return { target: 0, suffix: value };
    const numStr = m[1].replace(/,/g, "");
    const suffixRaw = m[2] || "";
    let target = parseFloat(numStr);
    let suffix = suffixRaw;
    if (/M/i.test(suffixRaw)) {
      // 25M+ -> 动画到 25，单位 M+
      target = parseFloat(numStr);
      suffix = suffixRaw;
    } else if (/K/i.test(suffixRaw)) {
      target = parseFloat(numStr);
      suffix = suffixRaw;
    } else if (/万/.test(suffixRaw)) {
      target = parseFloat(numStr);
      suffix = suffixRaw;
    }
    return { target, suffix };
  }, [value]);

  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || startedRef.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            setTimeout(() => {
              const start = performance.now();
              const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
              const tick = (now: number) => {
                const p = Math.min(1, (now - start) / duration);
                setDisplay(parsed.target * easeOut(p));
                if (p < 1) requestAnimationFrame(tick);
                else setDisplay(parsed.target);
              };
              requestAnimationFrame(tick);
            }, delay);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [duration, delay, parsed.target]);

  // 格式化：整数保留原始小数位（最多 1 位）
  const formatted = useMemo(() => {
    if (parsed.target >= 100) return Math.round(display).toString();
    if (Number.isInteger(parsed.target)) return Math.round(display).toString();
    return display.toFixed(1);
  }, [display, parsed.target]);

  return (
    <span ref={ref}>
      {formatted}
      {parsed.suffix}
    </span>
  );
}

type Result = {
  id: string;
  source_type: "PDF" | "Web" | "Patent" | "Book";
  domain: string;
  title: string;
  year: number;
  venue: string;
  page?: number;
  score: number; // 0-1
  abstract: string;
  doi?: string;
  /** v18: 含 doc_id 表示可调用 content 接口拉取原文片段 */
  doc_id?: string;
  /** v18: 估算字数（仅展示提示） */
  approxLength?: number;
};

// ─── Meta-Search 结果类型（条件筛选模式专用，仅元数据） ───
type MetaSearchResult = {
  id: string;
  title: string;
  authors: string; // "Author A, Author B et al."
  year: number;
  venue: string;
  type: string; // paper, preprint, patent...
  citations: number;
  doi?: string;
  language?: string;
  availability: "oa" | "content"; // OA = 开放获取可直接阅读, content = 仅元数据需调用 content 接口
  doc_id: string;
};

type FacetItem = { label: string; value: number };
type MetaFacets = {
  byYear: FacetItem[];
  byType: FacetItem[];
  byLanguage: FacetItem[];
  byAccess: FacetItem[];
  byVenue: FacetItem[];
  byCitation: FacetItem[];
};

// 模拟 meta-search 大量命中的结果
const PRESET_META_LARGE: { total: number; facets: MetaFacets; results: MetaSearchResult[] } = {
  total: 128432,
  facets: {
    byYear: [
      { label: "2026", value: 8420 },
      { label: "2025", value: 31200 },
      { label: "2024", value: 28900 },
      { label: "2023", value: 22100 },
      { label: "2022", value: 16800 },
      { label: "2021", value: 12400 },
      { label: "≤2020", value: 8612 },
    ],
    byType: [
      { label: "期刊论文", value: 72400 },
      { label: "预印本", value: 28600 },
      { label: "会议论文", value: 15200 },
      { label: "专利", value: 8100 },
      { label: "学位论文", value: 4132 },
    ],
    byLanguage: [
      { label: "English", value: 89200 },
      { label: "中文", value: 24600 },
      { label: "Deutsch", value: 6800 },
      { label: "Français", value: 4200 },
      { label: "其他", value: 3632 },
    ],
    byAccess: [
      { label: "OA 可读", value: 78400 },
      { label: "仅元数据", value: 50032 },
    ],
    byVenue: [
      { label: "Nature", value: 4200 },
      { label: "Science", value: 3100 },
      { label: "Cell", value: 2800 },
      { label: "PNAS", value: 2400 },
      { label: "arXiv", value: 18600 },
      { label: "其他", value: 97332 },
    ],
    byCitation: [
      { label: "≥ 1,000 次", value: 2100 },
      { label: "≥ 500 次", value: 5600 },
      { label: "≥ 100 次", value: 18900 },
      { label: "≥ 50 次", value: 28400 },
      { label: "≥ 10 次", value: 62300 },
    ],
  },
  results: [
    { id: "m1", title: "CRISPR-Cas9 Delivery via Lipid Nanoparticles for In Vivo Genome Editing", authors: "Zhang L, Chen W et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 342, doi: "10.1038/s41587-025-02431-1", language: "en" , availability: "content", doc_id: "W4000001234" },
    { id: "m2", title: "Base Editing Efficiency in Human Hematopoietic Stem Cells", authors: "Liu D, Wang X et al.", year: 2025, venue: "Cell Stem Cell", type: "paper", citations: 218, doi: "10.1016/j.stem.2025.01.003", language: "en" , availability: "content", doc_id: "W4000002468" },
    { id: "m3", title: "Prime Editing 3.0: Improved Pegylated Guide RNA Architecture", authors: "Anzalone AV, Koblan LW et al.", year: 2024, venue: "Science", type: "paper", citations: 567, doi: "10.1126/science.adp1234", language: "en" , availability: "oa", doc_id: "W4000003702" },
    { id: "m4", title: "CRISPR 基因编辑在遗传性血液病中的临床试验进展", authors: "赵明, 李华 等", year: 2024, venue: "中华医学杂志", type: "paper", citations: 89, doi: "10.3760/cma.j.cn112137-20240315", language: "zh" , availability: "oa", doc_id: "W4000004936" },
    { id: "m5", title: "Epigenome Editing with dCas9-KRAB Fusion Proteins", authors: "Thakore PI, Black JB et al.", year: 2024, venue: "Nature Methods", type: "paper", citations: 412, doi: "10.1038/s41592-024-02198-4", language: "en" , availability: "content", doc_id: "W4000006170" },
    { id: "m6", title: "Anti-CRISPR Proteins as Regulators of Gene Drive Systems", authors: "Marino ND, Pinilla-Redondo R et al.", year: 2024, venue: "Cell", type: "paper", citations: 156, doi: "10.1016/j.cell.2024.03.018", language: "en" , availability: "content", doc_id: "W4000007404" },
    { id: "m7", title: "RNA-guided Transposases for Programmable Large-scale Insertions", authors: "Strecker J, Ladber A et al.", year: 2025, venue: "Nature", type: "paper", citations: 289, doi: "10.1038/s41586-025-08123-5", language: "en" , availability: "oa", doc_id: "W4000008638" },
    { id: "m8", title: "Method for Multiplex Base Editing in Plant Genomes", authors: "Monsanto Biotech Inc.", year: 2024, venue: "US Patent", type: "patent", citations: 12, doi: "US20240123456A1", language: "en" , availability: "oa", doc_id: "W4000009872" },
    { id: "m9", title: "CRISPR Screening Identifies Novel Tumor Suppressor Genes in Pancreatic Cancer", authors: "Hart T, Moffat J et al.", year: 2025, venue: "Cancer Discovery", type: "paper", citations: 178, doi: "10.1158/2159-8290.CD-25-0042", language: "en" , availability: "content", doc_id: "W4000011106" },
    { id: "m10", title: "In Utero CRISPR Therapy Corrects Metabolic Disease in Fetal Mice", authors: "Rossidis AC, Stratigis JD et al.", year: 2024, venue: "Science Translational Medicine", type: "paper", citations: 234, doi: "10.1126/scitranslmed.adn5678", language: "en" , availability: "oa", doc_id: "W4000012340" },
    { id: "m11", title: "Compact Cas12f Variants for AAV-Deliverable Genome Editing", authors: "Kim DY, Lee JM et al.", year: 2025, venue: "Molecular Cell", type: "paper", citations: 145, doi: "10.1016/j.molcel.2025.02.009", language: "en" , availability: "oa", doc_id: "W4000013574" },
    { id: "m12", title: "CRISPR-based Diagnostics for Rapid Pathogen Detection", authors: "Gootenberg JS, Abudayyeh OO et al.", year: 2024, venue: "Nature Biomedical Engineering", type: "paper", citations: 398, doi: "10.1038/s41551-024-01234-5", language: "en" , availability: "oa", doc_id: "W4000014808" },
    { id: "m13", title: "Mitochondrial Base Editing via DdCBE in Human Cells", authors: "Mok BY, de Moraes MH et al.", year: 2024, venue: "Cell", type: "paper", citations: 267, doi: "10.1016/j.cell.2024.06.041", language: "en" , availability: "oa", doc_id: "W4000016042" },
    { id: "m14", title: "基于 CRISPR 的新型抗病毒策略研究进展", authors: "王强, 张丽 等", year: 2025, venue: "生物工程学报", type: "paper", citations: 34, language: "zh" , availability: "oa", doc_id: "W4000017276" },
    { id: "m15", title: "Genome-wide Off-target Analysis of High-fidelity Cas9 Variants", authors: "Tsai SQ, Zheng Z et al.", year: 2025, venue: "Nature Communications", type: "paper", citations: 123, doi: "10.1038/s41467-025-56789-0", language: "en" , availability: "oa", doc_id: "W4000018510" },
    { id: "m16", title: "CRISPR Activation Screens Reveal Enhancers of Neuronal Differentiation", authors: "Kampmann M, Horlbeck MA et al.", year: 2024, venue: "Neuron", type: "paper", citations: 201, doi: "10.1016/j.neuron.2024.04.012", language: "en" , availability: "content", doc_id: "W4000019744" },
    { id: "m17", title: "Engineered Cas13 for Transcriptome Editing in Mammalian Cells", authors: "Cox DBT, Gootenberg JS et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 312, doi: "10.1038/s41587-025-02567-8", language: "en" , availability: "oa", doc_id: "W4000020978" },
    { id: "m18", title: "Split-intein Mediated Dual-AAV Delivery of Large Cas9 Variants", authors: "Villiger L, Grisch-Chan HM et al.", year: 2024, venue: "Nature Medicine", type: "paper", citations: 189, doi: "10.1038/s41591-024-03012-4", language: "en" , availability: "oa", doc_id: "W4000022212" },
    { id: "m19", title: "CRISPR Interference Reveals Essential Genes in Mycobacterium tuberculosis", authors: "Rock JM, Hopkins FF et al.", year: 2024, venue: "PNAS", type: "paper", citations: 156, doi: "10.1073/pnas.2401234121", language: "en" , availability: "content", doc_id: "W4000023446" },
    { id: "m20", title: "Precision Gene Correction for Sickle Cell Disease Using Adenine Base Editors", authors: "Newby GA, Yen JS et al.", year: 2025, venue: "Nature", type: "paper", citations: 445, doi: "10.1038/s41586-025-08456-2", language: "en" , availability: "content", doc_id: "W4000024680" },
    { id: "m21", title: "Programmable RNA Editing with ADAR-recruiting Guide RNAs", authors: "Qu L, Yi Z et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 198, doi: "10.1038/s41587-025-02601-3", language: "en" , availability: "oa", doc_id: "W4000025914" },
    { id: "m22", title: "High-throughput CRISPR Screens in Primary Human T Cells", authors: "Shifrut E, Carnevale J et al.", year: 2024, venue: "Cell", type: "paper", citations: 276, doi: "10.1016/j.cell.2024.07.032", language: "en" , availability: "oa", doc_id: "W4000027148" },
    { id: "m23", title: "Retron-mediated Genome Editing without Double-strand Breaks", authors: "Sharon E, Chen SAA et al.", year: 2025, venue: "Science", type: "paper", citations: 134, doi: "10.1126/science.ado4321", language: "en" , availability: "oa", doc_id: "W4000028382" },
    { id: "m24", title: "CRISPR-Cas12a 在植物基因组多位点编辑中的应用", authors: "陈磊, 吴刚 等", year: 2024, venue: "植物学报", type: "paper", citations: 67, doi: "10.11983/CBB24010", language: "zh" , availability: "oa", doc_id: "W4000029616" },
    { id: "m25", title: "Evolved Cas9 Variants with Broadened PAM Compatibility", authors: "Walton RT, Christie KA et al.", year: 2024, venue: "Nature Biotechnology", type: "paper", citations: 389, doi: "10.1038/s41587-024-02199-0", language: "en" , availability: "content", doc_id: "W4000030850" },
    { id: "m26", title: "Spatiotemporal Control of CRISPR with Optogenetic Systems", authors: "Nihongaki Y, Kawano F et al.", year: 2025, venue: "Nature Methods", type: "paper", citations: 167, doi: "10.1038/s41592-025-02345-6", language: "en" , availability: "content", doc_id: "W4000032084" },
    { id: "m27", title: "Nanoparticle Delivery of Ribonucleoprotein for Liver Gene Editing", authors: "Wei T, Cheng Q et al.", year: 2024, venue: "ACS Nano", type: "paper", citations: 203, doi: "10.1021/acsnano.4c01234", language: "en" , availability: "content", doc_id: "W4000033318" },
    { id: "m28", title: "CRISPR-based Gene Drives for Malaria Vector Control", authors: "Hammond A, Galizi R et al.", year: 2024, venue: "Nature", type: "paper", citations: 312, doi: "10.1038/s41586-024-07890-3", language: "en" , availability: "content", doc_id: "W4000034552" },
    { id: "m29", title: "Allele-specific CRISPR Therapy for Dominant Genetic Disorders", authors: "Christie KA, Courtney DG et al.", year: 2025, venue: "Nature Medicine", type: "paper", citations: 178, doi: "10.1038/s41591-025-03456-7", language: "en" , availability: "oa", doc_id: "W4000035786" },
    { id: "m30", title: "Multiplexed Perturbation Sequencing with CRISPR-Cas13", authors: "Replogle JM, Saunders RA et al.", year: 2024, venue: "Cell", type: "paper", citations: 234, doi: "10.1016/j.cell.2024.01.045", language: "en" , availability: "oa", doc_id: "W4000037020" },
    { id: "m31", title: "Chromatin Remodeling via CRISPR-mediated Histone Modifications", authors: "Hilton IB, D'Ippolito AM et al.", year: 2025, venue: "Nature Genetics", type: "paper", citations: 156, doi: "10.1038/s41588-025-01789-4", language: "en" , availability: "oa", doc_id: "W4000038254" },
    { id: "m32", title: "Verfahren zur CRISPR-basierten Gentherapie bei Mukoviszidose", authors: "Schwank G, Koo BK et al.", year: 2024, venue: "Deutsches Ärzteblatt", type: "paper", citations: 45, language: "de" , availability: "oa", doc_id: "W4000039488" },
    { id: "m33", title: "Single-cell CRISPR Screens Reveal Programs of T Cell Exhaustion", authors: "Dong MB, Wang G et al.", year: 2025, venue: "Nature Immunology", type: "paper", citations: 289, doi: "10.1038/s41590-025-01890-2", language: "en" , availability: "content", doc_id: "W4000040722" },
    { id: "m34", title: "Transposon-encoded CRISPR-Cas Systems for DNA Integration", authors: "Klompe SE, Vo PLH et al.", year: 2024, venue: "Nature", type: "paper", citations: 345, doi: "10.1038/s41586-024-07234-5", language: "en" , availability: "oa", doc_id: "W4000041956" },
    { id: "m35", title: "CRISPR 技术在水稻抗病育种中的最新进展", authors: "李明, 赵伟 等", year: 2025, venue: "中国农业科学", type: "paper", citations: 56, doi: "10.3864/j.issn.0578-1752.2025.03", language: "zh" , availability: "content", doc_id: "W4000043190" },
    { id: "m36", title: "Genome Editing of Regulatory Elements Reveals Enhancer Redundancy", authors: "Osterwalder M, Barozzi I et al.", year: 2024, venue: "Nature", type: "paper", citations: 198, doi: "10.1038/s41586-024-08012-6", language: "en" , availability: "content", doc_id: "W4000044424" },
    { id: "m37", title: "CRISPR-Cas9 Ribonucleoprotein Delivery via Cell-penetrating Peptides", authors: "Ramakrishna S, Kwaku Dad AB et al.", year: 2025, venue: "Genome Research", type: "paper", citations: 134, doi: "10.1101/gr.279012.124", language: "en" , availability: "oa", doc_id: "W4000045658" },
    { id: "m38", title: "Therapeutic In Vivo Base Editing for Progeria", authors: "Koblan LW, Erdos MR et al.", year: 2024, venue: "Nature", type: "paper", citations: 456, doi: "10.1038/s41586-024-07567-8", language: "en" , availability: "oa", doc_id: "W4000046892" },
    { id: "m39", title: "CRISPR-mediated Epigenetic Memory in Mammalian Cells", authors: "Nuñez JK, Chen J et al.", year: 2025, venue: "Cell", type: "paper", citations: 267, doi: "10.1016/j.cell.2025.02.018", language: "en" , availability: "oa", doc_id: "W4000048126" },
    { id: "m40", title: "Miniature CRISPR-Cas Systems from Uncultivated Microbes", authors: "Xu X, Chemparathy A et al.", year: 2024, venue: "Molecular Cell", type: "paper", citations: 189, doi: "10.1016/j.molcel.2024.05.023", language: "en" , availability: "oa", doc_id: "W4000049360" },
    { id: "m41", title: "CRISPR Screens Identify Metabolic Vulnerabilities in AML", authors: "Tzelepis K, Koike-Yusa H et al.", year: 2025, venue: "Nature Medicine", type: "paper", citations: 212, doi: "10.1038/s41591-025-03567-8", language: "en" , availability: "content", doc_id: "W4000050594" },
    { id: "m42", title: "Precision Deletion of Genomic Segments via Dual-guide CRISPR", authors: "Canver MC, Smith EC et al.", year: 2024, venue: "Nature Methods", type: "paper", citations: 145, doi: "10.1038/s41592-024-02345-7", language: "en" , availability: "oa", doc_id: "W4000051828" },
    { id: "m43", title: "基因编辑猪器官异种移植的免疫学挑战", authors: "杨光, 刘阳 等", year: 2025, venue: "中华器官移植杂志", type: "paper", citations: 78, language: "zh" , availability: "oa", doc_id: "W4000053062" },
    { id: "m44", title: "CRISPR-Cas9 Knockout Library Screens in Cancer Cell Lines", authors: "Behan FM, Iorio F et al.", year: 2024, venue: "Nature", type: "paper", citations: 567, doi: "10.1038/s41586-024-07890-1", language: "en" , availability: "oa", doc_id: "W4000054296" },
    { id: "m45", title: "RNA-targeting CRISPR Effectors for Transcriptome Engineering", authors: "Abudayyeh OO, Gootenberg JS et al.", year: 2025, venue: "Science", type: "paper", citations: 345, doi: "10.1126/science.adq5678", language: "en" , availability: "oa", doc_id: "W4000055530" },
    { id: "m46", title: "Engineered Zinc-finger Nucleases vs CRISPR: A Comparative Study", authors: "Urnov FD, Rebar EJ et al.", year: 2024, venue: "Nature Reviews Genetics", type: "paper", citations: 234, doi: "10.1038/s41576-024-00712-3", language: "en" , availability: "content", doc_id: "W4000056764" },
    { id: "m47", title: "CRISPR-mediated Correction of Duchenne Muscular Dystrophy", authors: "Amoasii L, Hildyard JCW et al.", year: 2025, venue: "Science", type: "paper", citations: 289, doi: "10.1126/science.adr1234", language: "en" , availability: "oa", doc_id: "W4000057998" },
    { id: "m48", title: "Phage-assisted Continuous Evolution of Cas9 Variants", authors: "Miller SM, Wang T et al.", year: 2024, venue: "Nature Biotechnology", type: "paper", citations: 178, doi: "10.1038/s41587-024-02345-6", language: "en" , availability: "content", doc_id: "W4000059232" },
    { id: "m49", title: "CRISPR-based Recording of Cellular Events in Mammalian Tissues", authors: "Kalhor R, Mali P et al.", year: 2025, venue: "Cell", type: "paper", citations: 156, doi: "10.1016/j.cell.2025.04.032", language: "en" , availability: "content", doc_id: "W4000060466" },
    { id: "m50", title: "Efficient Mitochondrial Genome Editing with mitoTALENs", authors: "Gammage PA, Moraes CT et al.", year: 2024, venue: "Nature Medicine", type: "paper", citations: 234, doi: "10.1038/s41591-024-03234-5", language: "en" , availability: "content", doc_id: "W4000061700" },
    { id: "m51", title: "Harnessing Type III CRISPR for Large DNA Insertions", authors: "Vo PLH, Ronda C et al.", year: 2025, venue: "Nature", type: "paper", citations: 167, doi: "10.1038/s41586-025-08567-3", language: "en" , availability: "content", doc_id: "W4000062934" },
    { id: "m52", title: "CRISPR-Cas12b Enables Efficient Plant Genome Engineering", authors: "Ming M, Ren Q et al.", year: 2024, venue: "Nature Plants", type: "paper", citations: 123, doi: "10.1038/s41477-024-01678-9", language: "en" , availability: "oa", doc_id: "W4000064168" },
    { id: "m53", title: "Édition génomique par CRISPR dans les cellules souches humaines", authors: "Charlesworth CT, Deshpande PS et al.", year: 2024, venue: "Médecine/Sciences", type: "paper", citations: 34, language: "fr" , availability: "content", doc_id: "W4000065402" },
    { id: "m54", title: "CRISPR-based Synthetic Gene Circuits for Cell Therapy", authors: "Gao XJ, Chong LS et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 198, doi: "10.1038/s41587-025-02678-9", language: "en" , availability: "content", doc_id: "W4000066636" },
    { id: "m55", title: "Deep Learning Predicts CRISPR Off-target Effects", authors: "Lin J, Wong KC et al.", year: 2024, venue: "Nature Machine Intelligence", type: "paper", citations: 267, doi: "10.1038/s42256-024-00812-4", language: "en" , availability: "content", doc_id: "W4000067870" },
    { id: "m56", title: "CRISPR Interference Dissects Transcriptional Regulation in Bacteria", authors: "Peters JM, Colavin A et al.", year: 2025, venue: "PNAS", type: "paper", citations: 89, doi: "10.1073/pnas.2501234122", language: "en" , availability: "content", doc_id: "W4000069104" },
    { id: "m57", title: "Lipid Nanoparticle Formulations for mRNA-encoded Cas9 Delivery", authors: "Qiu M, Glass Z et al.", year: 2024, venue: "Advanced Materials", type: "paper", citations: 178, doi: "10.1002/adma.202401234", language: "en" , availability: "oa", doc_id: "W4000070338" },
    { id: "m58", title: "CRISPR 基因编辑伦理与监管框架国际比较", authors: "张晓华, 陈伟 等", year: 2025, venue: "科学通报", type: "paper", citations: 45, doi: "10.1360/TB-2025-0123", language: "zh" , availability: "oa", doc_id: "W4000071572" },
    { id: "m59", title: "Genome-wide Association of CRISPR Essentiality Scores", authors: "Dempster JM, Rossen J et al.", year: 2024, venue: "Nature Genetics", type: "paper", citations: 234, doi: "10.1038/s41588-024-01789-5", language: "en" , availability: "oa", doc_id: "W4000072806" },
    { id: "m60", title: "Cas9-triggered Strand Invasion for Homology-directed Repair", authors: "Richardson CD, Ray GJ et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 156, doi: "10.1038/s41587-025-02789-0", language: "en" , availability: "oa", doc_id: "W4000074040" },
    { id: "m61", title: "CRISPR-Cas13d for Efficient RNA Knockdown in Neurons", authors: "Konermann S, Lotfy P et al.", year: 2024, venue: "Cell", type: "paper", citations: 289, doi: "10.1016/j.cell.2024.08.045", language: "en" , availability: "oa", doc_id: "W4000075274" },
    { id: "m62", title: "Base Editing Corrects Alpha-1 Antitrypsin Deficiency in Mice", authors: "Villiger L, Rothgangl T et al.", year: 2025, venue: "Nature Medicine", type: "paper", citations: 198, doi: "10.1038/s41591-025-03678-9", language: "en" , availability: "content", doc_id: "W4000076508" },
    { id: "m63", title: "Directed Evolution of CRISPR-Cas12a for Enhanced Activity", authors: "Kleinstiver BP, Sousa AA et al.", year: 2024, venue: "Nature Biotechnology", type: "paper", citations: 312, doi: "10.1038/s41587-024-02456-7", language: "en" , availability: "oa", doc_id: "W4000077742" },
    { id: "m64", title: "CRISPR Screens Identify Drug Resistance Mechanisms in Melanoma", authors: "Shalem O, Sanjana NE et al.", year: 2025, venue: "Science", type: "paper", citations: 234, doi: "10.1126/science.ads5678", language: "en" , availability: "content", doc_id: "W4000078976" },
    { id: "m65", title: "Tissue-specific Promoters for Targeted In Vivo Gene Editing", authors: "Yao X, Wang X et al.", year: 2024, venue: "Nature Biomedical Engineering", type: "paper", citations: 145, doi: "10.1038/s41551-024-02345-6", language: "en" , availability: "content", doc_id: "W4000080210" },
    { id: "m66", title: "CRISPRi 在人类诱导多能干细胞分化中的应用", authors: "周磊, 王芳 等", year: 2025, venue: "细胞研究", type: "paper", citations: 67, language: "zh" , availability: "content", doc_id: "W4000081444" },
    { id: "m67", title: "Programmable C-to-G Base Editing in Genomic DNA", authors: "Kurt IC, Zhou R et al.", year: 2024, venue: "Nature", type: "paper", citations: 345, doi: "10.1038/s41586-024-08123-7", language: "en" , availability: "oa", doc_id: "W4000082678" },
    { id: "m68", title: "CRISPR-mediated Gene Tagging for Live-cell Imaging", authors: "Neguembor MV, Sebastian-Perez R et al.", year: 2025, venue: "Nature Methods", type: "paper", citations: 89, doi: "10.1038/s41592-025-02456-7", language: "en" , availability: "oa", doc_id: "W4000083912" },
    { id: "m69", title: "Extracellular Vesicle Delivery of CRISPR Components", authors: "Gee P, Lung MSY et al.", year: 2024, venue: "Nature Cell Biology", type: "paper", citations: 178, doi: "10.1038/s41556-024-01456-8", language: "en" , availability: "oa", doc_id: "W4000085146" },
    { id: "m70", title: "CRISPR-Cas9 Gene Therapy for Hereditary Transthyretin Amyloidosis", authors: "Gillmore JD, Gane E et al.", year: 2025, venue: "NEJM", type: "paper", citations: 567, doi: "10.1056/NEJMoa2501234", language: "en" , availability: "content", doc_id: "W4000086380" },
    { id: "m71", title: "Structural Basis of PAM Recognition by Cas9 Orthologs", authors: "Nishimasu H, Shi X et al.", year: 2024, venue: "Cell", type: "paper", citations: 234, doi: "10.1016/j.cell.2024.09.056", language: "en" , availability: "oa", doc_id: "W4000087614" },
    { id: "m72", title: "CRISPR-based Biosensors for Environmental Monitoring", authors: "Broughton JP, Deng X et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 145, doi: "10.1038/s41587-025-02890-1", language: "en" , availability: "oa", doc_id: "W4000088848" },
    { id: "m73", title: "Genome Editing in Non-human Primates for Disease Modeling", authors: "Niu Y, Shen B et al.", year: 2024, venue: "Cell", type: "paper", citations: 198, doi: "10.1016/j.cell.2024.10.067", language: "en" , availability: "oa", doc_id: "W4000090082" },
    { id: "m74", title: "CRISPR-Cas9 による日本脳炎ウイルス耐性マウスの作出", authors: "Tanaka K, Yamamoto S et al.", year: 2025, venue: "日本ウイルス学雑誌", type: "paper", citations: 23, language: "ja" , availability: "oa", doc_id: "W4000091316" },
    { id: "m75", title: "Precision Oncology via CRISPR-edited CAR-T Cells", authors: "Stadtmauer EA, Fraietta JA et al.", year: 2024, venue: "Science", type: "paper", citations: 456, doi: "10.1126/science.adt5678", language: "en" , availability: "content", doc_id: "W4000092550" },
    { id: "m76", title: "CRISPR Activation of Endogenous Genes for Regenerative Medicine", authors: "Black JB, Adler AF et al.", year: 2025, venue: "Cell Stem Cell", type: "paper", citations: 167, doi: "10.1016/j.stem.2025.03.012", language: "en" , availability: "content", doc_id: "W4000093784" },
    { id: "m77", title: "Efficient Prime Editing in Post-mitotic Neurons", authors: "Böck D, Rothgangl T et al.", year: 2024, venue: "Nature Neuroscience", type: "paper", citations: 134, doi: "10.1038/s41593-024-01678-9", language: "en" , availability: "oa", doc_id: "W4000095018" },
    { id: "m78", title: "CRISPR-mediated Multiplexed Pathway Engineering in Yeast", authors: "Lian J, HamediRad M et al.", year: 2025, venue: "Nature Communications", type: "paper", citations: 89, doi: "10.1038/s41467-025-67890-1", language: "en" , availability: "oa", doc_id: "W4000096252" },
    { id: "m79", title: "Anti-CRISPR Discovery via Metagenomic Mining", authors: "Pawluk A, Davidson AR et al.", year: 2024, venue: "Nature Microbiology", type: "paper", citations: 178, doi: "10.1038/s41564-024-01678-9", language: "en" , availability: "oa", doc_id: "W4000097486" },
    { id: "m80", title: "CRISPR-based Epigenetic Editing for Chronic Pain Treatment", authors: "Moreno AM, Alemán F et al.", year: 2025, venue: "Science Translational Medicine", type: "paper", citations: 123, doi: "10.1126/scitranslmed.adu1234", language: "en" , availability: "content", doc_id: "W4000098720" },
    { id: "m81", title: "Whole-genome CRISPR Screening in Human Organoids", authors: "Ringel T, Frey N et al.", year: 2024, venue: "Nature Cell Biology", type: "paper", citations: 234, doi: "10.1038/s41556-024-01567-9", language: "en" , availability: "content", doc_id: "W4000099954" },
    { id: "m82", title: "Cas9-nickase Paired with Reverse Transcriptase for Safe Editing", authors: "Anzalone AV, Randolph PB et al.", year: 2025, venue: "Nature", type: "paper", citations: 345, doi: "10.1038/s41586-025-08678-4", language: "en" , availability: "oa", doc_id: "W4000101188" },
    { id: "m83", title: "CRISPR Gene Editing in Coral for Climate Resilience", authors: "Cleves PA, Strader ME et al.", year: 2024, venue: "PNAS", type: "paper", citations: 67, doi: "10.1073/pnas.2401567121", language: "en" , availability: "content", doc_id: "W4000102422" },
    { id: "m84", title: "Delivery of CRISPR via Engineered Virus-like Particles", authors: "Banskota S, Raguram A et al.", year: 2025, venue: "Cell", type: "paper", citations: 289, doi: "10.1016/j.cell.2025.05.043", language: "en" , availability: "oa", doc_id: "W4000103656" },
    { id: "m85", title: "CRISPR 技术在大豆品质改良中的研究进展", authors: "孙涛, 马晓明 等", year: 2024, venue: "作物学报", type: "paper", citations: 34, language: "zh" , availability: "oa", doc_id: "W4000104890" },
    { id: "m86", title: "Twin Prime Editing for Large Genomic Insertions", authors: "Anzalone AV, Gao XD et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 234, doi: "10.1038/s41587-025-02901-2", language: "en" , availability: "content", doc_id: "W4000106124" },
    { id: "m87", title: "CRISPR-Cas9 for Functional Genomics in Zebrafish Development", authors: "Varshney GK, Pei W et al.", year: 2024, venue: "Genome Research", type: "paper", citations: 112, doi: "10.1101/gr.279234.124", language: "en" , availability: "content", doc_id: "W4000107358" },
    { id: "m88", title: "Engineered tRNA-based Suppressors for Nonsense Mutation Correction", authors: "Wang J, Zhang Y et al.", year: 2025, venue: "Nature", type: "paper", citations: 178, doi: "10.1038/s41586-025-08789-5", language: "en" , availability: "content", doc_id: "W4000108592" },
    { id: "m89", title: "CRISPR-mediated Chromosomal Rearrangements in Human Cells", authors: "Maddalo D, Manchado E et al.", year: 2024, venue: "Nature", type: "paper", citations: 156, doi: "10.1038/s41586-024-08234-8", language: "en" , availability: "oa", doc_id: "W4000109826" },
    { id: "m90", title: "Efficient Adenine Base Editing in Mitochondrial DNA", authors: "Cho SI, Lee S et al.", year: 2025, venue: "Cell", type: "paper", citations: 198, doi: "10.1016/j.cell.2025.06.054", language: "en" , availability: "oa", doc_id: "W4000111060" },
    { id: "m91", title: "CRISPR-Cas System Classification and Evolution", authors: "Makarova KS, Wolf YI et al.", year: 2024, venue: "Nature Reviews Microbiology", type: "paper", citations: 567, doi: "10.1038/s41579-024-01045-6", language: "en" , availability: "oa", doc_id: "W4000112294" },
    { id: "m92", title: "Genome Editing for Inherited Retinal Dystrophies", authors: "Maeder ML, Stefanidakis M et al.", year: 2025, venue: "Nature Medicine", type: "paper", citations: 234, doi: "10.1038/s41591-025-03789-0", language: "en" , availability: "content", doc_id: "W4000113528" },
    { id: "m93", title: "CRISPR-based Allele-specific Silencing of Huntingtin", authors: "Monteys AM, Ebanks SA et al.", year: 2024, venue: "Science", type: "paper", citations: 289, doi: "10.1126/science.adv6789", language: "en" , availability: "content", doc_id: "W4000114762" },
    { id: "m94", title: "Multiplexed Prime Editing for Complex Trait Engineering", authors: "Yarnall MTN, Ioannidi EI et al.", year: 2025, venue: "Nature Biotechnology", type: "paper", citations: 167, doi: "10.1038/s41587-025-03012-3", language: "en" , availability: "oa", doc_id: "W4000115996" },
    { id: "m95", title: "CRISPR-Cas9 を用いたイネの耐塩性向上", authors: "Suzuki T, Nakamura H et al.", year: 2024, venue: "育種学研究", type: "paper", citations: 45, language: "ja" , availability: "content", doc_id: "W4000117230" },
    { id: "m96", title: "In Vivo Prime Editing of the CFTR Locus in Airway Cells", authors: "Geurts MH, de Poel E et al.", year: 2025, venue: "Nature", type: "paper", citations: 312, doi: "10.1038/s41586-025-08890-6", language: "en" , availability: "oa", doc_id: "W4000118464" },
    { id: "m97", title: "CRISPR Screens Uncover Synthetic Lethal Interactions in BRCA-mutant Cancers", authors: "Zimmermann M, Murina O et al.", year: 2024, venue: "Nature", type: "paper", citations: 234, doi: "10.1038/s41586-024-08345-9", language: "en" , availability: "oa", doc_id: "W4000119698" },
    { id: "m98", title: "Programmable DNA Methylation Editing with CRISPR-dCas9-DNMT3A", authors: "Liu XS, Wu H et al.", year: 2025, venue: "Cell", type: "paper", citations: 178, doi: "10.1016/j.cell.2025.07.065", language: "en" , availability: "oa", doc_id: "W4000120932" },
    { id: "m99", title: "CRISPR-Cas12a Diagnostics with Attomolar Sensitivity", authors: "Chen JS, Ma E et al.", year: 2024, venue: "Science", type: "paper", citations: 456, doi: "10.1126/science.adw1234", language: "en" , availability: "oa", doc_id: "W4000122166" },
    { id: "m100", title: "Genome Editing Safety: Long-term Follow-up of Edited Human Cells", authors: "Leibowitz ML, Papathanasiou S et al.", year: 2025, venue: "Nature Medicine", type: "paper", citations: 289, doi: "10.1038/s41591-025-03890-1", language: "en" , availability: "content", doc_id: "W4000123400" },
  ],
};

// 模拟精准命中（少量结果）
const PRESET_META_SMALL: { total: number; facets: MetaFacets; results: MetaSearchResult[] } = {
  total: 3,
  facets: {
    byYear: [{ label: "2025", value: 2 }, { label: "2024", value: 1 }],
    byType: [{ label: "期刊论文", value: 2 }, { label: "预印本", value: 1 }],
    byLanguage: [{ label: "English", value: 3 }],
    byAccess: [{ label: "OA 可读", value: 2 }, { label: "仅元数据", value: 1 }],
    byVenue: [{ label: "Science", value: 1 }, { label: "Nature", value: 1 }, { label: "Molecular Cell", value: 1 }],
    byCitation: [{ label: "≥ 100 次", value: 3 }],
  },
  results: [
    { id: "ms1", title: "Prime Editing 3.0: Improved Pegylated Guide RNA Architecture", authors: "Anzalone AV, Koblan LW et al.", year: 2024, venue: "Science", type: "paper", citations: 567, doi: "10.1126/science.adp1234", language: "en", availability: "oa", doc_id: "W4312876543" },
    { id: "ms2", title: "Precision Gene Correction for Sickle Cell Disease Using Adenine Base Editors", authors: "Newby GA, Yen JS et al.", year: 2025, venue: "Nature", type: "paper", citations: 445, doi: "10.1038/s41586-025-08456-2", language: "en", availability: "oa", doc_id: "W4398765432" },
    { id: "ms3", title: "Compact Cas12f Variants for AAV-Deliverable Genome Editing", authors: "Kim DY, Lee JM et al.", year: 2025, venue: "Molecular Cell", type: "preprint", citations: 145, doi: "10.1016/j.molcel.2025.02.009", language: "en", availability: "content", doc_id: "W4356789012" },
  ],
};

const SAMPLES = [
  "CRISPR 基因编辑",
  "蛋白质折叠预测",
  "COVID-19 长期效应",
  "逆合成路径规划",
  "阿尔茨海默症靶点",
  "锂电池固态电解质",
];

const PRESET_RESULTS: Record<string, Result[]> = {
  default: [
    {
      id: "r1",
      source_type: "PDF",
      domain: "生命科学",
      title: "Long-term Pulmonary Sequelae of COVID-19: a 24-month Follow-up Cohort",
      year: 2024,
      venue: "Nature Medicine",
      page: 4,
      score: 0.93,
      abstract:
        "在 12 个月随访时，23% 患者的 DLCO 较健康对照下降，提示病毒感染后存在持续性肺损伤。研究在 24 个月仍观察到弥散功能未完全恢复的亚群，且与急性期严重程度独立相关。",
      doi: "10.1038/s41591-024-02873-2",
      doc_id: "nat-med-2024-02873-2",
      approxLength: 4280,
    },
    {
      id: "r2",
      source_type: "PDF",
      domain: "结构生物学",
      title:
        "AlphaFold-Multimer Improves Heterodimer Prediction for Membrane-Bound Receptors",
      year: 2023,
      venue: "Cell",
      page: 11,
      score: 0.88,
      abstract:
        "通过引入界面残基的注意力先验，AlphaFold-Multimer 在 GPCR-G 蛋白复合物上的中位 DockQ 提升 0.21；对未公开测试集的盲评显示该方法在跨膜受体上的稳健性显著优于早期版本。",
      doi: "10.1016/j.cell.2023.08.022",
      doc_id: "cell-2023-08-022",
      approxLength: 5120,
    },
    {
      id: "r3",
      source_type: "Web",
      domain: "化学合成",
      title:
        "Retrosynthetic Planning with Templated Transformer and Reaction-Aware Reranking",
      year: 2024,
      venue: "JACS Au",
      score: 0.81,
      abstract:
        "提出一种结合 SMILES 模板与 reaction-aware 重排序的逆合成模型，在 USPTO-50K 上 top-10 命中率达到 92.4%；并在 1976-2024 专利反应中验证了对长链复杂分子的可扩展性。",
      doc_id: "jacs-au-2024-retro-tpl",
      approxLength: 3640,
    },
    {
      id: "r4",
      source_type: "PDF",
      domain: "神经退行性疾病",
      title:
        "Tau-targeting Bifunctional Degraders Restore Synaptic Function in Murine Models",
      year: 2025,
      venue: "Science Translational Medicine",
      page: 7,
      score: 0.74,
      abstract:
        "针对磷酸化 Tau 设计的 PROTAC 双功能降解剂在 P301S 模型中显著降低 pS396 水平，并在 8 周给药后恢复海马 LTP；剂量-效应曲线提示存在治疗窗口的可调性。",
      doc_id: "stm-2025-tau-protac",
      approxLength: 4760,
    },
  ],
};

function highlightKeywords(text: string, q: string) {
  if (!q.trim()) return text;
  try {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(re);
    return parts.map((p, i) =>
      re.test(p) ? (
        <mark
          key={i}
          className="bg-transparent text-[var(--brand)] font-medium"
          style={{
            backgroundImage:
              "linear-gradient(transparent 62%, rgba(91,91,247,0.18) 62%)",
          }}>
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  } catch {
    return text;
  }
}

function RelevanceDots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn("dot", i < filled && "on")} />
      ))}
      <span className="ml-1 font-mono text-[11px] text-[var(--ink-3)]">
        {score.toFixed(2)}
      </span>
    </div>
  );
}

function ResultCard({ r, q }: { r: Result; q: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="card-paper p-5 ed-in" data-doc-id={r.doc_id}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="method-badge method-post">{r.source_type}</span>
          <span className="code-chip">{r.domain}</span>
        </div>
        <RelevanceDots score={r.score} />
      </div>

      <h3 className="mt-3 font-display text-[20px] leading-[1.32] text-[var(--ink)]">
        {highlightKeywords(r.title, q)}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--ink-2)]">
        <span className="font-mono text-[12px]">{r.year}</span>
        <span className="text-[var(--hairline-strong)]">·</span>
        <span className="italic">{r.venue}</span>
        {r.page && (
          <>
            <span className="text-[var(--hairline-strong)]">·</span>
            <span>第 {r.page} 页</span>
          </>
        )}
        {r.doi && (
          <>
            <span className="text-[var(--hairline-strong)]">·</span>
            <a className="link-edit" href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
              doi:{r.doi}
            </a>
          </>
        )}
      </div>

      {/* v20: 摘要 grid-rows 平滑过渡 + 可访问按钮（Tab 聚焦 / Enter・Space 触发 / 可见焦点环） */}
      <div
        className={cn(
          "mt-3 grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[4.5lh]",
        )}>
        <div className="relative overflow-hidden">
          <div
            className={cn(
              "text-[14px] leading-[1.78] text-[var(--ink)]",
              !expanded && "line-clamp-3",
            )}>
            <span className="text-[var(--ink-3)] mr-1.5">“</span>
            {highlightKeywords(r.abstract, q)}
            <span className="text-[var(--ink-3)] ml-1">”</span>
            {expanded && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-expanded="true"
                aria-controls={`abs-${r.id}`}
                className="ml-1.5 inline-flex items-center rounded text-[12px] text-[var(--ink-3)] hover:text-[var(--brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--paper)]"
                aria-label="收起摘要">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {!expanded && (
            <button
              type="button"
              id={`abs-${r.id}`}
              onClick={() => setExpanded(true)}
              aria-expanded="false"
              aria-label="展开摘要"
              className="absolute right-0 bottom-0 px-1.5 leading-none rounded text-[14px] text-[var(--ink-3)] hover:text-[var(--brand)] bg-[var(--paper)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--paper)]">
              ···
            </button>
          )}
        </div>
      </div>
      {/* v19: 原文片段（content 接口）— 默认折叠，点击展开按需分段拉取；传入 query 高亮 */}
      {r.doc_id && (
        <ContentSnippet docId={r.doc_id} approxLength={r.approxLength} query={q} />
      )}
    </article>
  );
}

// v9: 提交瞬间的粒子扩散反馈（8 颗紫蓝粒子 + 1 圈脉冲环）
// 以 key 重新 mount 重启动画，800ms 后 DOM 仍在但动画结束，opacity 为 0
function BurstFx() {
  const dots = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 28 + Math.random() * 14; // 28-42px
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    return { tx, ty, delay: i * 12 };
  });
  return (
    <span aria-hidden className="sv-burst">
      <span className="sv-burst-ring" />
      {dots.map((d, i) => (
        <span
          key={i}
          className="sv-burst-dot"
          style={{
            ['--tx' as any]: `${d.tx}px`,
            ['--ty' as any]: `${d.ty}px`,
            animationDelay: `${d.delay}ms`,
          }}
        />
      ))}
    </span>
  );
}

// v7/v8: 科学学术蒙层组件 — 低透明度 SVG，纯装饰，不可交互
// active=true 时（搜索框 focus）渐晕呼吸、DNA 飘移、苯环微转、分子脉动同步启动
function ScienceBackdrop({ active = false }: { active?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 0 }}>
      {/* 柔和紫蓝渐晕 ×2 ，以及右下深调冷调增加站位质感 */}
      <div
        className={cn(
          "absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full opacity-[0.55] transition-opacity duration-500",
          active && "sv-aura-active",
        )}
        style={{
          background:
            "radial-gradient(closest-side, rgba(91,91,247,0.16), rgba(91,91,247,0) 70%)",
          filter: "blur(8px)",
          ['--sv-aura-base' as any]: 0.55,
          ['--sv-aura-peak' as any]: 0.85,
        }}
      />
      <div
        className={cn(
          "absolute top-[180px] -right-40 w-[560px] h-[560px] rounded-full opacity-[0.5] transition-opacity duration-500",
          active && "sv-aura-active",
        )}
        style={{
          background:
            "radial-gradient(closest-side, rgba(122,108,255,0.14), rgba(122,108,255,0) 70%)",
          filter: "blur(10px)",
          animationDelay: "-1.5s",
          ['--sv-aura-base' as any]: 0.5,
          ['--sv-aura-peak' as any]: 0.78,
        }}
      />
      <div
        className="absolute bottom-[-200px] left-[28%] w-[700px] h-[700px] rounded-full opacity-[0.4]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(36,42,86,0.10), rgba(36,42,86,0) 70%)",
          filter: "blur(14px)",
        }}
      />

      {/* 贴纸 SVG：苯环 + 分子 + 双螺旋 + 化学式 — 极淡 stroke #5B5BF7 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 2000"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sv-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#5B5BF7" strokeWidth="0.4" opacity="0.06" />
          </pattern>
          <radialGradient id="sv-grid-mask" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="sv-grid-mask-id">
            <rect width="100%" height="100%" fill="url(#sv-grid-mask)" />
          </mask>
        </defs>

        {/* 极淡网格，带径向遮罩 */}
        <rect width="100%" height="100%" fill="url(#sv-grid)" mask="url(#sv-grid-mask-id)" />

        {/* 右上：苯环 + 取代基×2（focus 时极慢自转） */}
        <g
          transform="translate(1140, 90)"
          stroke="#5B5BF7"
          strokeWidth="1"
          fill="none"
          opacity={active ? 0.28 : 0.18}
          style={{ transition: "opacity 600ms ease" }}
          className={active ? "sv-ring-active" : undefined}>
          <polygon points="0,0 52,0 78,45 52,90 0,90 -26,45" />
          <polygon points="110,30 162,30 188,75 162,120 110,120 84,75" />
          <line x1="52" y1="45" x2="110" y2="75" />
          <line x1="-26" y1="45" x2="-60" y2="30" />
          <line x1="188" y1="75" x2="222" y2="60" />
          <text x="-78" y="24" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#5B5BF7" opacity="0.7">CH₃</text>
          <text x="230" y="66" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#5B5BF7" opacity="0.7">OH</text>
        </g>

        {/* 左中：DNA 双螺旋（focus 时上下飘移 + 提色） */}
        <g
          transform="translate(40, 480)"
          stroke={active ? "#5B5BF7" : "#5B5BF7"}
          strokeWidth="1"
          fill="none"
          opacity={active ? 0.28 : 0.16}
          style={{ transition: "opacity 600ms ease" }}
          className={active ? "sv-helix-active" : undefined}>
          {Array.from({ length: 14 }).map((_, i) => {
            const y = i * 26;
            const off = Math.sin(i * 0.55) * 26;
            return (
              <g key={i}>
                <line x1={20 + off} y1={y} x2={80 - off} y2={y} />
                <circle cx={20 + off} cy={y} r="2" fill="#5B5BF7" opacity="0.6" />
                <circle cx={80 - off} cy={y} r="2" fill="#5B5BF7" opacity="0.6" />
              </g>
            );
          })}
          <path
            d={`M ${20 + Math.sin(0) * 26},0 ${Array.from({ length: 14 })
              .map((_, i) => `L ${20 + Math.sin(i * 0.55) * 26},${i * 26}`)
              .join(" ")}`}
            stroke="#5B5BF7"
            strokeWidth="0.8"
          />
          <path
            d={`M ${80 - Math.sin(0) * 26},0 ${Array.from({ length: 14 })
              .map((_, i) => `L ${80 - Math.sin(i * 0.55) * 26},${i * 26}`)
              .join(" ")}`}
            stroke="#5B5BF7"
            strokeWidth="0.8"
          />
        </g>

        {/* 右中：蛋白表面 · 带状折叠抽象 */}
        <g transform="translate(1080, 760)" stroke="#5B5BF7" strokeWidth="1" fill="none" opacity="0.13">
          <path d="M 0 0 C 60 -40, 140 40, 200 0 S 320 60, 380 20" />
          <path d="M 0 30 C 60 -10, 140 70, 200 30 S 320 90, 380 50" />
          <path d="M 0 60 C 60 20, 140 100, 200 60 S 320 120, 380 80" />
          <path d="M 0 90 C 60 50, 140 130, 200 90 S 320 150, 380 110" />
        </g>

        {/* 左下：化学公式×3 + Greek letters */}
        <g fontFamily="'JetBrains Mono', monospace" opacity="0.16" fill="#242A56">
          <text x="60" y="1180" fontSize="13">E = mc²</text>
          <text x="60" y="1208" fontSize="12">ΔG = ΔH − TΔS</text>
          <text x="60" y="1236" fontSize="12">ψ(x,t) = A e^(i(kx−ωt))</text>
          <text x="60" y="1264" fontSize="12">k_cat / K_M</text>
        </g>

        {/* 中部偏右：分子 ball-and-stick 节点（focus 时脉动） */}
        <g
          transform="translate(900, 1160)"
          stroke="#5B5BF7"
          strokeWidth="1"
          opacity={active ? 0.30 : 0.18}
          fill="#5B5BF7"
          style={{ transition: "opacity 600ms ease" }}
          className={active ? "sv-mol-active" : undefined}>
          <line x1="0" y1="0" x2="60" y2="30" fill="none" />
          <line x1="60" y1="30" x2="120" y2="-10" fill="none" />
          <line x1="60" y1="30" x2="50" y2="100" fill="none" />
          <line x1="120" y1="-10" x2="190" y2="20" fill="none" />
          <line x1="50" y1="100" x2="-10" y2="140" fill="none" />
          <circle cx="0" cy="0" r="4" />
          <circle cx="60" cy="30" r="5" />
          <circle cx="120" cy="-10" r="4" />
          <circle cx="50" cy="100" r="4" />
          <circle cx="190" cy="20" r="3" />
          <circle cx="-10" cy="140" r="3" />
        </g>

        {/* 下部：序列片段 ATCG · 贴纸低调 */}
        <g fontFamily="'JetBrains Mono', monospace" opacity="0.10" fill="#5B5BF7" fontSize="11">
          <text x="380" y="1620" letterSpacing="3">ATCGGAATTCAGCTAGCTAGGCTAATCGATCGTAGCTAGCAATCG</text>
          <text x="380" y="1644" letterSpacing="3">CGTAATCGATCGGCTAGCTAGCATCGGAATTCAGCTAGCTAGCTA</text>
          <text x="380" y="1668" letterSpacing="3">TGCATGCATCGTAGCTAGCATCGCTAGCTAATCGATCGCTAGCTA</text>
        </g>
      </svg>

      {/* 上方极淡白鬼蒙层，使背景元素在主区隔离不干扰阅读 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(250,250,247,0.0) 0%, rgba(250,250,247,0.55) 38%, rgba(250,250,247,0.30) 100%)",
        }}
      />
    </div>
  );
}

function HeroHeader() {
  return (
    <header className="relative pt-16 pb-10">
      <p className="text-[12px] font-mono tracking-[0.2em] uppercase text-[var(--ink-3)] mb-3">
        Scientific Data API for AI Agents
      </p>
      <h1 className="font-display text-[clamp(36px,4.6vw,52px)] leading-[1.06] tracking-[-0.02em] text-[var(--ink)] max-w-[840px]">
        让 Agent 真正读懂 <span className="text-[var(--brand)]">科学世界</span>
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-2)] max-w-[640px]">
        5 个 RESTful API，覆盖语义检索、结构化筛选、全文获取、资源发现与元数据目录。
        可直接接入 Cursor、Claude、Codex、MCP 等 Agent 工作流。
      </p>
      {/* 3 个关键数字 */}
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-[560px]">
        {[
          { num: "4.7亿", label: "学术文献元数据", sub: "meta-search" },
          { num: "2800万", label: "全文语义 Chunk", sub: "agentic-search" },
          { num: "5", label: "RESTful API", sub: "即刻可调" },
        ].map((d) => (
          <div key={d.label} className="group text-center py-4 px-3 rounded-xl border hairline bg-white/60 hover:bg-[var(--brand-soft)]/30 hover:border-[var(--brand)]/20 transition-all duration-300">
            <div className="font-display text-[24px] font-semibold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">
              {d.num}
            </div>
            <div className="mt-1 text-[12px] text-[var(--ink-2)]">{d.label}</div>
            <div className="mt-0.5 font-mono text-[10px] text-[var(--ink-3)]">{d.sub}</div>
          </div>
        ))}
      </div>
    </header>
  );
}

// v7: 引导式打字机 placeholder 循环示例（动词开头，覆盖检索/对比/分析）
const TYPE_SAMPLES = [
  "检索 mRNA 疫苗递送系统的最新文献",
  "对比 CRISPR-Cas9 与 Cas12a 的脱靶效应",
  "分析 AlphaFold-Multimer 在跨膜受体上的预测精度",
  "总结 2024 年锂电池固态电解质的突破",
  "探索逆合成路径规划的指令微调策略",
];

function useTypewriter(samples: string[], enabled: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let sIdx = 0;
    let cIdx = 0;
    let mode: "type" | "hold" | "erase" = "type";
    const tick = () => {
      if (cancelled) return;
      const cur = samples[sIdx % samples.length];
      let delay = 55 + Math.random() * 25; // 较快的输入节奏
      if (mode === "type") {
        cIdx++;
        setText(cur.slice(0, cIdx));
        if (cIdx >= cur.length) {
          mode = "hold";
          delay = 1400;
        }
      } else if (mode === "hold") {
        mode = "erase";
        delay = 280;
      } else {
        cIdx -= 2;
        if (cIdx < 0) cIdx = 0;
        setText(cur.slice(0, cIdx));
        if (cIdx === 0) {
          mode = "type";
          sIdx++;
          delay = 320;
        } else {
          delay = 24;
        }
      }
      timer = window.setTimeout(tick, delay);
    };
    let timer = window.setTimeout(tick, 380);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [samples, enabled]);
  return text;
}

/* CookbookGrid — 每页 6 个（2行x3列）+ 左右翻页 + 键盘快捷键 + 淡入动画 */
function CookbookGrid({ items }: { items: { slug: string; cover: string; title: string; desc: string; tags: string[] }[] }) {
  const PAGE_SIZE_CB = 6;
  const [cbPage, setCbPage] = useState(0);
  const totalPages = Math.ceil(items.length / PAGE_SIZE_CB);
  const visibleItems = items.slice(cbPage * PAGE_SIZE_CB, (cbPage + 1) * PAGE_SIZE_CB);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-cb-card]');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 70 + 50);
    });
  }, [cbPage]);
  /* 键盘左右箭头快捷键 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCbPage((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight') {
        setCbPage((p) => Math.min(totalPages - 1, p + 1));
      }
    };
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }, [totalPages]);
  return (
    <div className="mt-6" ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
      <div ref={gridRef} className="grid md:grid-cols-3 gap-4">
        {visibleItems.map((item, idx) => (
          <a
            key={item.slug}
            href={`/docs#cookbook/${item.slug}`}
            data-cb-card
            data-cb-idx={idx}
            style={{ opacity: 0, transform: 'translateY(16px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}
            className="group block rounded-xl border hairline bg-white overflow-hidden hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]">
            <div className="aspect-[3/2] overflow-hidden bg-neutral-50">
              <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
            </div>
            <div className="p-4 pb-5">
              <div className="flex items-center gap-2 mb-2">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10.5px] font-mono text-[var(--ink-3)] tracking-wide">{t}</span>
                ))}
              </div>
              <h3 className="font-display text-[15px] text-[var(--ink)] leading-snug group-hover:text-[var(--brand)] transition-colors duration-300">{item.title}</h3>
              <p className="mt-1.5 text-[12.5px] text-[var(--ink-2)] leading-relaxed line-clamp-2">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setCbPage((p) => Math.max(0, p - 1))}
            disabled={cbPage === 0}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="上一页">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCbPage(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === cbPage ? "w-5 bg-[var(--brand)]" : "w-1.5 bg-[var(--ink-3)]/30 hover:bg-[var(--ink-3)]/60"
                )}
                aria-label={`第 ${i + 1} 页`}
              />
            ))}
          </div>
          <button
            onClick={() => setCbPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={cbPage >= totalPages - 1}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="下一页">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* DataScaleGrid — 数据卡片进入视口时交错淡入 */
function DataScaleGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-scale-card]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const delay = Number(card.dataset.scaleIdx || 0) * 100;
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, delay);
            io.unobserve(card);
          }
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach((c) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(12px)';
      c.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      io.observe(c);
    });
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="mt-6 border-y hairline">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

// ─────────── 条件筛选字段配置（基于 Agentic Search 元信息过滤设计方案） ───────────
type FilterValue = { fieldKey: string; value: string };

// 面板分组定义
type FilterOption = { value: string; label: string; count?: string };
type FilterGroup = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "chip" | "chip-multi" | "range" | "text";
  options?: FilterOption[];
  placeholder?: string;
  tooltip?: string;
};

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "domain",
    label: "学科领域",
    icon: Atom,
    type: "chip",
    tooltip: "基于 OpenAlex Domain 分类体系",
    options: [
      { value: "", label: "全部" },
      { value: "Physical Sciences", label: "物理科学" },
      { value: "Life Sciences", label: "生命科学" },
      { value: "Social Sciences", label: "社会科学" },
      { value: "Health Sciences", label: "健康科学" },
    ],
  },
  {
    key: "metadata_type",
    label: "文献类型",
    icon: Database,
    type: "chip-multi",
    tooltip: "按文献来源类型过滤",
    options: [
      { value: "paper", label: "期刊论文", count: "3.6亿" },
      { value: "ebook", label: "图书", count: "1.06亿" },
      { value: "preprint", label: "预印本", count: "2,800万" },
      { value: "conference", label: "会议论文", count: "1,200万" },
      { value: "patent", label: "专利", count: "4,100万" },
      { value: "dissertation", label: "学位论文", count: "580万" },
    ],
  },
  {
    key: "year",
    label: "发表时间",
    icon: Calendar,
    type: "chip",
    tooltip: "按发表年份范围筛选",
    options: [
      { value: "", label: "不限" },
      { value: "1y", label: "近 1 年" },
      { value: "3y", label: "近 3 年" },
      { value: "5y", label: "近 5 年" },
      { value: "10y", label: "近 10 年" },
      { value: "custom", label: "自定义..." },
    ],
  },
  {
    key: "language",
    label: "语言",
    icon: Languages,
    type: "chip-multi",
    tooltip: "按文献语言过滤，可多选",
    options: [
      { value: "en", label: "English", count: "2.8亿" },
      { value: "zh", label: "中文", count: "8,600万" },
      { value: "de", label: "Deutsch", count: "1,200万" },
      { value: "fr", label: "Français", count: "980万" },
      { value: "ja", label: "日本語", count: "760万" },
      { value: "ko", label: "한국어", count: "420万" },
      { value: "es", label: "Español", count: "380万" },
      { value: "pt", label: "Português", count: "310万" },
    ],
  },
  {
    key: "citation_level",
    label: "引用水平",
    icon: TrendingUp,
    type: "chip",
    tooltip: "基于被引百分位或绝对引用数筛选",
    options: [
      { value: "", label: "不限" },
      { value: "top1", label: "Top 1%" },
      { value: "top10", label: "Top 10%" },
      { value: "gte100", label: "≥ 100 次" },
      { value: "gte10", label: "≥ 10 次" },
    ],
  },
  {
    key: "sort",
    label: "排序方式",
    icon: ArrowUpDown,
    type: "chip",
    tooltip: "控制结果排列顺序",
    options: [
      { value: "relevance", label: "相关性优先" },
      { value: "date_desc", label: "最新发表" },
      { value: "citations_desc", label: "引用量最高" },
      { value: "fwci_desc", label: "影响力最高" },
    ],
  },
];

// 向后兼容 pill 模式的旧类型
type FilterFieldType = "range" | "text" | "number" | "select";
type FilterField = {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  type: FilterFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
};
const FILTER_FIELDS: FilterField[] = FILTER_GROUPS.filter(g => g.options).map(g => ({
  key: g.key,
  label: g.label,
  desc: g.tooltip ?? "",
  icon: g.icon,
  type: g.type === "chip" || g.type === "chip-multi" ? "select" as const : g.type as FilterFieldType,
  placeholder: g.placeholder,
  options: g.options?.filter(o => o.value).map(o => ({ value: o.value, label: o.label })),
}));

// ─────────── 筛选 pill 内联编辑器 ───────────
function FilterValueEditor({
  field,
  value,
  onCommit,
  onCancel,
}: {
  field: FilterField;
  value: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (field.type === "select") {
      selectRef.current?.focus();
    } else {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }
  }, [field.type]);

  if (field.type === "select") {
    return (
      <div className="px-1.5 inline-flex items-center bg-white">
        <select
          ref={selectRef}
          value={value || field.options?.[0]?.value || ""}
          onChange={(e) => onCommit(e.target.value)}
          onBlur={() => onCancel()}
          className="bg-transparent outline-none text-[13px] text-[var(--ink)] cursor-pointer pr-1">
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit(draft);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={() => onCommit(draft)}
      placeholder={field.placeholder}
      type={field.type === "number" ? "number" : "text"}
      className="px-2 w-[120px] bg-white outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
    />
  );
}

export default function Experience() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [meta, setMeta] = useState<{ count: number; ms: number } | null>(null);
  // meta-search 结果（条件筛选模式专用）
  const [metaResults, setMetaResults] = useState<MetaSearchResult[] | null>(null);
  const [metaFacets, setMetaFacets] = useState<MetaFacets | null>(null);
  const [metaTotal, setMetaTotal] = useState<number>(0);
  const [showFacets, setShowFacets] = useState(false);
  const [page, setPage] = useState(1);
  const [focused, setFocused] = useState(false);
  const [burstId, setBurstId] = useState(0); // 递增 key 触发重新 mount 以重启粒子动画
  // v18: 失败兜底状态 — kind 区分场景，首次失败后 3s 自动重试一次
  const [errorKind, setErrorKind] = useState<SearchErrorKind | null>(null);
  const [retrying, setRetrying] = useState(false);
  // v19: 强制失败演示场景—下一次 runSearch 必中，用于 「失败示例」 chip 与 ?demo=fail&kind= 一键复现
  const forceFailRef = useRef<SearchErrorKind | null>(null);
  const autoRetriedRef = useRef(false);
  const PAGE_SIZE = 20;
  const composing = useRef(false);

  // v17: 会话+版本历史模型 — 当前会话 id / 当前版本 id
  const { sessions, createSession, appendVersion } = useSessionHistory();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  // 改词重搜的默认行为：true=追加到本会话，false=另起新会话
  const [appendMode, setAppendMode] = useState(true);
  // 仅在输入为空、未提交过查询、且未 focus 时运行打字机
  const typedPlaceholder = useTypewriter(
    TYPE_SAMPLES,
    query.length === 0 && !loading && !focused,
  );

  // URL ?q= / ?s= / ?v=
  // 优先级：s+v 复现历史版本；q 兜底直接检索（也会创建会话）；都没有则空白主页
  useEffect(() => {
    const u = new URL(window.location.href);
    const s = u.searchParams.get("s");
    const v = u.searchParams.get("v");
    const q = u.searchParams.get("q");
    // v19: ?demo=fail&kind=server|network|maintenance — 开发/走查一键复现失败兜底
    const demo = u.searchParams.get("demo");
    if (demo === "fail") {
      const k = (u.searchParams.get("kind") || "server") as SearchErrorKind;
      forceFailRef.current = (["server", "network", "maintenance"] as SearchErrorKind[]).includes(k) ? k : "server";
      autoRetriedRef.current = false;
      const sample = q || "马德里 Sciverse 检索示例";
      setQuery(sample);
      submit(sample);
      return;
    }
    if (s && v) {
      const all = JSON.parse(localStorage.getItem("sciverse:sessions:v1") || "[]");
      const sess = findSession(all, s);
      const ver = findVersion(sess, v);
      if (sess && ver) {
        setCurrentSessionId(sess.id);
        setCurrentVersionId(ver.id);
        setQuery(ver.query);
        // 复现该版本检索（无上下文，独立检索）
        runSearch(ver.query);
        return;
      }
    }
    if (q) {
      setQuery(q);
      submit(q);
    }
    const onPop = () => {
      const nu = new URL(window.location.href);
      const ns = nu.searchParams.get("s");
      const nv = nu.searchParams.get("v");
      const nq = nu.searchParams.get("q") || "";
      if (ns && nv) {
        const all = JSON.parse(localStorage.getItem("sciverse:sessions:v1") || "[]");
        const sess = findSession(all, ns);
        const ver = findVersion(sess, nv);
        if (sess && ver) {
          setCurrentSessionId(sess.id);
          setCurrentVersionId(ver.id);
          setQuery(ver.query);
          runSearch(ver.query);
          return;
        }
      }
      setQuery(nq);
      if (nq) submit(nq);
      else {
        setResults(null);
        setMeta(null);
        setCommitted("");
        setCurrentSessionId(null);
        setCurrentVersionId(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────── 双态搜索：自由检索 / 条件筛选 ───────────
  const [searchMode, setSearchModeRaw] = useState<"free" | "filter">("free");
  const setSearchMode = (mode: "free" | "filter") => {
    setSearchModeRaw(mode);
    // 切换模式时清空另一模式的结果
    if (mode === "free") {
      setMetaResults(null);
      setMetaFacets(null);
      setMetaTotal(0);
    } else {
      setResults(null);
      setMeta(null);
    }
  };
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const filterAreaRef = useRef<HTMLDivElement>(null);

  const canSubmit =
    !loading &&
    (searchMode === "free" ? query.trim().length > 0 : filters.length > 0);

  // 内部：仅执行检索动作（不写历史、不改 URL）— 用于复现历史版本
  // v18: 加入失败概率与自动重试一次；opts.silent=true 不重置 burst
  const runSearch = async (
    value: string,
    opts: { silent?: boolean; isRetry?: boolean } = {},
  ) => {
    if (!value.trim()) return;
    if (!opts.silent) setBurstId((n) => n + 1);
    setLoading(true);
    setCommitted(value);
    setPage(1);
    setErrorKind(null);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 520 + Math.random() * 280));
    // 模拟失败：首次提交 ~12% 失败概率；手动重试调低至 4%。
    const failChance = opts.isRetry ? 0.04 : 0.12;
    if (Math.random() < failChance) {
      setLoading(false);
      setResults(null);
      setMeta(null);
      // 随机分配场景
      const pool: SearchErrorKind[] = ["server", "network", "maintenance"];
      const kind = pool[Math.floor(Math.random() * pool.length)];
      setErrorKind(kind);
      // 首次失败后自动重试一次（仅一次）
      if (!autoRetriedRef.current && !opts.isRetry) {
        autoRetriedRef.current = true;
        setRetrying(true);
        window.setTimeout(() => {
          runSearch(value, { silent: true, isRetry: true }).finally(() =>
            setRetrying(false),
          );
        }, 3000);
      }
      return;
    }
    // v19: 如果设了强制失败，本次一定走失败分支（仅生效一次，重试后释放）
    const forced = forceFailRef.current;
    if (forced && !opts.isRetry) {
      forceFailRef.current = null;
      setLoading(false);
      setResults(null);
      setMeta(null);
      setErrorKind(forced);
      if (!autoRetriedRef.current) {
        autoRetriedRef.current = true;
        setRetrying(true);
        window.setTimeout(() => {
          runSearch(value, { silent: true, isRetry: true }).finally(() =>
            setRetrying(false),
          );
        }, 3000);
      }
      return;
    }
    const elapsed = Math.round(performance.now() - start) + 1200;
    setResults(PRESET_RESULTS.default);
    setMeta({ count: PRESET_RESULTS.default.length, ms: elapsed });
    setLoading(false);
    // 成功则释放自动重试锁，以便下一次提交后可重新启用
    autoRetriedRef.current = false;
  };

  // 用户主动提交：写入历史（追加到本会话 / 另起新会话）+ 同步 URL
  const submit = async (q?: string) => {
    const value = (q ?? query).trim();
    if (!value) return;
    // 决定写入策略
    let nextSessionId = currentSessionId;
    let nextVersionId: string | null = null;
    if (currentSessionId && appendMode) {
      const r = appendVersion(currentSessionId, value);
      nextSessionId = r.sessionId;
      nextVersionId = r.versionId;
    } else {
      const r = createSession(value);
      nextSessionId = r.sessionId;
      nextVersionId = r.versionId;
    }
    setCurrentSessionId(nextSessionId);
    setCurrentVersionId(nextVersionId);
    // sync URL
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.set("s", nextSessionId!);
    url.searchParams.set("v", nextVersionId!);
    window.history.pushState({}, "", url.toString());
    // 跑独立检索
    await runSearch(value);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !composing.current && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const clear = () => {
    setQuery("");
    setFilters([]);
    inputRef.current?.focus();
  };

  // 关闭下拉：点击区域外
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!filterAreaRef.current) return;
      if (!filterAreaRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
        setEditingFieldKey(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const upsertFilter = (fieldKey: string, value: string) => {
    setFilters((prev) => {
      const idx = prev.findIndex((f) => f.fieldKey === fieldKey);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { fieldKey, value };
        return next;
      }
      return [...prev, { fieldKey, value }];
    });
  };

  const removeFilter = (fieldKey: string) => {
    setFilters((prev) => prev.filter((f) => f.fieldKey !== fieldKey));
  };

  const buildFilterQuery = () => {
    if (!filters.length) return "";
    return filters
      .filter((f) => f.value.trim())
      .map((f) => {
        const group = FILTER_GROUPS.find((g) => g.key === f.fieldKey);
        const label = group?.label ?? f.fieldKey;
        // 对于多选值，展示对应的 label
        if (group && (group.type === "chip" || group.type === "chip-multi") && group.options) {
          const vals = f.value.split(",");
          const labels = vals.map((v) => group.options!.find((o) => o.value === v)?.label ?? v).join(",");
          return `${label}:${labels}`;
        }
        return `${label}:${f.value}`;
      })
      .join(" ");
  };

  const submitFilters = async () => {
    const q = buildFilterQuery();
    if (!q) return;
    setQuery(q);
    setCommitted(q);
    setLoading(true);
    setBurstId((n) => n + 1);
    setPage(1);
    setErrorKind(null);
    // 清空自由检索结果
    setResults(null);
    setMeta(null);
    // 模拟 meta-search 接口调用
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
    // 根据筛选条件复杂度模拟大/小结果集
    const isNarrow = filters.some((f) => f.fieldKey === "citation_level" && f.value.includes("top1"));
    const preset = isNarrow ? PRESET_META_SMALL : PRESET_META_LARGE;
    setMetaResults(preset.results);
    setMetaFacets(preset.facets);
    setMetaTotal(preset.total);
    setLoading(false);
    // 写入会话历史
    let nextSessionId = currentSessionId;
    let nextVersionId: string | null = null;
    if (currentSessionId && appendMode) {
      const r = appendVersion(currentSessionId, q);
      nextSessionId = r.sessionId;
      nextVersionId = r.versionId;
    } else {
      const r = createSession(q);
      nextSessionId = r.sessionId;
      nextVersionId = r.versionId;
    }
    setCurrentSessionId(nextSessionId);
    setCurrentVersionId(nextVersionId);
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.set("s", nextSessionId!);
    url.searchParams.set("v", nextVersionId!);
    window.history.pushState({}, "", url.toString());
  };

  // ─── 分布卡片点击联动筛选 ───
  // facet label → filter value 映射表
  const FACET_TYPE_MAP: Record<string, string> = {
    "期刊论文": "paper", "预印本": "preprint", "会议论文": "conference",
    "专利": "patent", "学位论文": "dissertation", "图书": "ebook",
  };
  const FACET_LANG_MAP: Record<string, string> = {
    "English": "en", "中文": "zh", "Deutsch": "de", "Français": "fr",
    "日本語": "ja", "한국어": "ko", "Español": "es", "Português": "pt",
  };
  const FACET_CITATION_MAP: Record<string, string> = {
    "≥ 1,000 次": "gte100", "≥ 500 次": "gte100", "≥ 100 次": "gte100",
    "≥ 50 次": "gte10", "≥ 10 次": "gte10",
  };
  const handleFacetClick = (facetKey: string, label: string) => {
    // 映射 facet 维度到 FILTER_GROUPS 中对应的 fieldKey 和 value
    let fieldKey: string | null = null;
    let filterValue: string | null = null;
    let isMulti = false;
    if (facetKey === "byYear") {
      // 年份：如 "2025" → year=1y, "2024" → year=3y, 精确年份暂用 custom
      fieldKey = "year";
      const y = parseInt(label);
      const currentYear = new Date().getFullYear();
      if (!isNaN(y)) {
        const diff = currentYear - y;
        if (diff <= 1) filterValue = "1y";
        else if (diff <= 3) filterValue = "3y";
        else if (diff <= 5) filterValue = "5y";
        else filterValue = "10y";
      } else {
        filterValue = "10y"; // "≤2020" fallback
      }
    } else if (facetKey === "byType") {
      fieldKey = "metadata_type";
      filterValue = FACET_TYPE_MAP[label] ?? null;
      isMulti = true;
    } else if (facetKey === "byLanguage") {
      if (label === "其他") return; // 无法映射
      fieldKey = "language";
      filterValue = FACET_LANG_MAP[label] ?? null;
      isMulti = true;
    } else if (facetKey === "byCitation") {
      fieldKey = "citation_level";
      filterValue = FACET_CITATION_MAP[label] ?? null;
    } else if (facetKey === "byAccess" || facetKey === "byVenue") {
      // 开放获取和期刊/会议暂无对应 FILTER_GROUPS 字段，仅 toast 提示
      toast.info(`已记录筛选意图：${label}，该维度将在后续版本支持精确筛选`);
      return;
    }
    if (!fieldKey || !filterValue) return;
    // 更新 filters 状态
    if (isMulti) {
      const current = filters.find((f) => f.fieldKey === fieldKey);
      const existing = current?.value ? current.value.split(",") : [];
      if (!existing.includes(filterValue)) {
        upsertFilter(fieldKey, [...existing, filterValue].join(","));
      }
    } else {
      upsertFilter(fieldKey, filterValue);
    }
    // 显示 toast 反馈
    const group = FILTER_GROUPS.find((g) => g.key === fieldKey);
    toast.success(`已添加筛选：${group?.label ?? fieldKey} → ${label}，正在重新查询...`);
    // 延迟自动重新提交
    setTimeout(() => {
      submitFilters();
    }, 100);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar active="experience" />

      <main className="flex-1 min-w-0 relative">
        {/* v10: 背景蒙层保持静态装饰，不再跟随输入框 focus 动，避免干扰输入 */}
        <ScienceBackdrop active={false} />
        <div className="relative flex-1 min-w-0 max-w-[960px] mx-auto px-8 lg:px-12 py-2">
          <HeroHeader />

          {/* SEARCH */}
          <section className="relative">
            <div
              className={cn(
                "card-paper sv-search-shell px-5 pt-4 pb-3 flex flex-col",
                focused && "is-focused",
              )}>
              {/* 顶部：自由检索 textarea / 条件筛选 pill 区 */}
              {searchMode === "free" ? (
                <textarea
                  ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 220) + "px";
                  }}
                  onKeyDown={onKey as unknown as React.KeyboardEventHandler<HTMLTextAreaElement>}
                  onCompositionStart={() => (composing.current = true)}
                  onCompositionEnd={() => (composing.current = false)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  disabled={loading}
                  rows={2}
                  placeholder={focused ? "输入科学问题或关键词..." : (typedPlaceholder ? `${typedPlaceholder} ▊` : "")}
                  className="w-full bg-transparent outline-none text-[15.5px] leading-[1.7] placeholder:text-[var(--ink-3)] disabled:opacity-60 resize-none min-h-[88px] max-h-[220px]"
                />
              ) : (
                /* ─── 条件筛选面板：分组 chip 布局（参考截图样式） ─── */
                <div ref={filterAreaRef} className="py-1 space-y-4 max-h-[420px] overflow-y-auto">
                  {FILTER_GROUPS.map((group) => {
                    const current = filters.find((f) => f.fieldKey === group.key);
                    const selectedValues = current?.value ? current.value.split(",") : [];
                    return (
                      <div key={group.key}>
                        {/* 组标题 */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <group.icon className="h-3.5 w-3.5 text-[var(--ink-2)]" />
                          <span className="text-[13px] font-medium text-[var(--ink)]">{group.label}</span>
                          {group.tooltip && (
                            <span className="text-[11px] text-[var(--ink-3)] ml-1">({group.tooltip})</span>
                          )}
                        </div>
                        {/* chip 行 */}
                        <div className="flex flex-wrap gap-2">
                          {group.options?.map((opt) => {
                            const isSelected = group.type === "chip-multi"
                              ? selectedValues.includes(opt.value)
                              : (current?.value ?? "") === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  if (group.type === "chip-multi") {
                                    // 多选逻辑
                                    let next: string[];
                                    if (isSelected) {
                                      next = selectedValues.filter((v) => v !== opt.value);
                                    } else {
                                      next = [...selectedValues, opt.value];
                                    }
                                    if (next.length === 0) {
                                      removeFilter(group.key);
                                    } else {
                                      upsertFilter(group.key, next.join(","));
                                    }
                                  } else {
                                    // 单选逻辑
                                    if (opt.value === "" || (current?.value === opt.value)) {
                                      removeFilter(group.key);
                                    } else {
                                      upsertFilter(group.key, opt.value);
                                    }
                                  }
                                }}
                                className={cn(
                                  "inline-flex flex-col items-center px-3 py-1.5 rounded-lg text-[12.5px] border transition-all duration-150",
                                  isSelected
                                    ? "border-[var(--brand)] bg-[var(--brand)]/[0.06] text-[var(--brand)] font-medium shadow-sm"
                                    : "border-[var(--hairline)] bg-white text-[var(--ink-2)] hover:border-[var(--ink-3)] hover:text-[var(--ink)]",
                                )}>
                                <span>{opt.label}</span>
                                {opt.count && (
                                  <span className={cn(
                                    "text-[10.5px] mt-0.5",
                                    isSelected ? "text-[var(--brand)]/70" : "text-[var(--ink-3)]",
                                  )}>{opt.count}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 分隔线 */}
              <div className="-mx-5 mt-2 border-t border-[var(--hairline)]" />

              {/* 底部控件区：左 toggle · 右 清空 + 提交 */}
              <div className="flex items-center justify-between pt-2">
                {/* 左：模式 toggle —— Notion-like segmented 控件 */}
                <div
                  role="tablist"
                  aria-label="检索模式"
                  className="relative inline-flex items-center p-[3px] rounded-full bg-[#EFEEE8] border border-[var(--hairline)]">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-[3px] bottom-[3px] w-[50%] rounded-full bg-white shadow-[0_1px_2px_rgba(20,20,20,0.06)] ring-1 ring-black/[0.04] transition-transform duration-300 ease-out",
                      searchMode === "free" ? "translate-x-0" : "translate-x-[calc(100%-2px)]",
                    )}
                  />
                  <button
                    role="tab"
                    aria-selected={searchMode === "free"}
                    onClick={() => setSearchMode("free")}
                    className={cn(
                      "relative z-10 px-3.5 h-7 rounded-full text-[12.5px] inline-flex items-center gap-1.5 transition-colors duration-200",
                      searchMode === "free"
                        ? "text-[var(--ink)] font-medium"
                        : "text-[var(--ink-3)] hover:text-[var(--ink-2)]",
                    )}>
                    <Sparkles className="h-3 w-3" strokeWidth={1.8} />
                    自由检索
                  </button>
                  <button
                    role="tab"
                    aria-selected={searchMode === "filter"}
                    onClick={() => setSearchMode("filter")}
                    className={cn(
                      "relative z-10 px-3.5 h-7 rounded-full text-[12.5px] inline-flex items-center gap-1.5 transition-colors duration-200",
                      searchMode === "filter"
                        ? "text-[var(--ink)] font-medium"
                        : "text-[var(--ink-3)] hover:text-[var(--ink-2)]",
                    )}>
                    <SlidersHorizontal className="h-3 w-3" strokeWidth={1.8} />
                    条件筛选
                  </button>
                </div>

                {/* 右：清空 + 提交 */}
                <div className="flex items-center gap-1.5">
                  {(searchMode === "free" ? !!query : filters.length > 0) && (
                    <button
                      onClick={clear}
                      aria-label="清空"
                      className="h-9 px-3 inline-flex items-center justify-center rounded-full text-[13px] text-[var(--ink-3)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] transition-colors">
                      清空
                    </button>
                  )}
                  <div className="relative">
                    {burstId > 0 && <BurstFx key={burstId} />}
                    <button
                      onClick={() => (searchMode === "free" ? submit() : submitFilters())}
                      disabled={!canSubmit}
                      aria-label="发送"
                      className={cn(
                        "relative h-9 w-9 inline-flex items-center justify-center rounded-full transition-all",
                        canSubmit && !loading
                          ? "bg-[var(--ink)] text-white hover:bg-black shadow-sm"
                          : "bg-[#ececec] text-[var(--ink-3)]",
                      )}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* sample tags — v20: 仅在未提交检索时呈现，避免与结果页资讯重复 */}
            {!meta && !committed && !errorKind && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)] mr-1">
                  试试
                </span>
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      submit(s);
                    }}
                    className="text-[12.5px] px-3 py-1.5 rounded-full border hairline bg-white text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                    {s}
                  </button>
                ))}
                {/* v20: 失败示例 chip — 单击直接走通用失败兜底页 */}
                <span className="mx-1 h-3 w-px bg-[var(--hairline-strong)]" aria-hidden />
                <button
                  type="button"
                  onClick={() => {
                    forceFailRef.current = "unknown";
                    autoRetriedRef.current = false;
                    const sample = query.trim() || "马德里 Sciverse 检索示例";
                    setQuery(sample);
                    submit(sample);
                  }}
                  className="inline-flex items-center gap-1 text-[12.5px] px-3 py-1.5 rounded-full border border-dashed border-[#D2BFB7] text-[#9F4A33] bg-[#FBF4F1] hover:bg-[#F8E9E2] transition-colors">
                  <AlertOctagon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  失败示例
                </button>
              </div>
            )}
          </section>

          {/* v17: 结果页改词重搜模式切换（追加/另起） */}
          {meta && committed && currentSessionId && (
            <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--ink-3)]">
              <span>修改关键词后</span>
              <div className="inline-flex items-center rounded-full border hairline bg-white p-0.5">
                <button
                  onClick={() => setAppendMode(true)}
                  className={cn(
                    "px-2.5 py-1 rounded-full inline-flex items-center gap-1 transition-colors",
                    appendMode
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}>
                  <GitBranch className="h-3 w-3" />
                  追加到本会话
                </button>
                <button
                  onClick={() => setAppendMode(false)}
                  className={cn(
                    "px-2.5 py-1 rounded-full inline-flex items-center gap-1 transition-colors",
                    !appendMode
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}>
                  <Plus className="h-3 w-3" />
                  另起新会话
                </button>
              </div>
              {(() => {
                const sess = findSession(sessions, currentSessionId);
                if (!sess) return null;
                const vIdx = sess.versions.findIndex((x) => x.id === currentVersionId);
                return (
                  <span className="ml-1">
                    当前 v{vIdx >= 0 ? vIdx + 1 : sess.versions.length} / 共 {sess.versions.length} 个版本
                  </span>
                );
              })()}
            </div>
          )}

          {/* v18: 失败兜底页 — 仅在提交后失败且无 results 时出现 */}
          {errorKind && !meta && (
            <SearchErrorState
              query={committed || query}
              retrying={retrying || loading}
              onRetry={() => {
                if (loading || retrying) return;
                autoRetriedRef.current = true; // 手动重试不再触发自动重试
                runSearch(committed || query, { isRetry: true });
              }}
              onEdit={() => {
                setErrorKind(null);
                inputRef.current?.focus();
              }}
            />
          )}

          {/* META-SEARCH RESULTS — 条件筛选模式结果 */}
          {metaFacets && metaResults && committed && searchMode === "filter" && (
            <section className="mt-6 ed-in">
              {/* 统计摘要头 */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-[32px] font-bold text-[var(--ink)] tracking-tight">
                    {metaTotal.toLocaleString()}
                  </span>
                  <span className="text-[14px] text-[var(--ink-2)]">命中文献</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e8f5e9] text-[11px] font-mono text-[#2e7d32] ml-1">meta-search</span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => toast.info("导出前 100 条样例与分布统计概览，非全量数据")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border hairline text-[12px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    导出样例
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[var(--ink)] text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    导出前 100 条样例与分布统计概览，非全量数据
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--ink)]" />
                  </div>
                </div>
              </div>
              <p className="mt-1 text-[12px] text-[var(--ink-3)]">
                耗时 0.84s，预览 100 条元数据不含原文；doc_id 调用 content 获取正文
              </p>

              {/* 分布统计折叠触发器 */}
              <button
                onClick={() => setShowFacets(!showFacets)}
                className="mt-4 w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#f7f7f4] hover:bg-[#f1f0eb] transition-colors">
                <span className="inline-flex items-center gap-2 text-[13px] text-[var(--ink)]">
                  <BarChart3 className="h-4 w-4 text-[var(--brand)]" />
                  {showFacets ? "收起分布统计" : "查看分布统计"}
                  <span className="text-[var(--ink-3)] text-[12px]">6 个维度</span>
                  {showFacets && <span className="text-[var(--brand)]/70 text-[11px] ml-1">点击条目可追加筛选</span>}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-[var(--ink-2)] transition-transform", showFacets && "rotate-180")} />
              </button>

              {/* 6 维度分布卡片 3×2 网格 */}
              {showFacets && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 年份分布 */}
                  <div className="rounded-lg bg-[#f9f9f6] border hairline p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] mb-3">
                      <Calendar className="h-4 w-4 text-[var(--ink-2)]" />
                      年份分布
                    </div>
                    <div className="space-y-2">
                      {metaFacets.byYear.map((f) => {
                        const maxVal = Math.max(...metaFacets.byYear.map((x) => x.value));
                        const pct = maxVal > 0 ? (f.value / maxVal) * 100 : 0;
                        return (
                          <div key={f.label} onClick={() => handleFacetClick("byYear", f.label)} className="flex items-center gap-2 text-[12px] cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-[var(--brand)]/[0.06] transition-colors" title={`点击筛选：${f.label}`}>
                            <span className="w-12 text-[var(--ink-2)] font-mono text-[11px]">{f.label}</span>
                            <div className="flex-1 h-[6px] bg-[var(--hairline)]/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--brand)]/40 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-12 text-right font-mono text-[11px] text-[var(--ink-3)]">
                              {f.value >= 10000 ? `${(f.value / 1000).toFixed(0)}k` : f.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* 文献类型 */}
                  <div className="rounded-lg bg-[#f9f9f6] border hairline p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] mb-3">
                      <FileText className="h-4 w-4 text-[var(--ink-2)]" />
                      文献类型
                    </div>
                    <div className="space-y-2">
                      {metaFacets.byType.map((f) => {
                        const maxVal = Math.max(...metaFacets.byType.map((x) => x.value));
                        const pct = maxVal > 0 ? (f.value / maxVal) * 100 : 0;
                        return (
                          <div key={f.label} onClick={() => handleFacetClick("byType", f.label)} className="flex items-center gap-2 text-[12px] cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-[var(--brand)]/[0.06] transition-colors" title={`点击筛选：${f.label}`}>
                            <span className="w-14 text-[var(--ink-2)]">{f.label}</span>
                            <div className="flex-1 h-[6px] bg-[var(--hairline)]/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--brand)]/40 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-12 text-right font-mono text-[11px] text-[var(--ink-3)]">
                              {f.value >= 10000 ? `${(f.value / 1000).toFixed(1)}k` : f.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* 语言分布 */}
                  <div className="rounded-lg bg-[#f9f9f6] border hairline p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] mb-3">
                      <Languages className="h-4 w-4 text-[var(--ink-2)]" />
                      语言分布
                    </div>
                    <div className="space-y-2">
                      {metaFacets.byLanguage.map((f) => {
                        const maxVal = Math.max(...metaFacets.byLanguage.map((x) => x.value));
                        const pct = maxVal > 0 ? (f.value / maxVal) * 100 : 0;
                        return (
                          <div key={f.label} onClick={() => handleFacetClick("byLanguage", f.label)} className="flex items-center gap-2 text-[12px] cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-[var(--brand)]/[0.06] transition-colors" title={`点击筛选：${f.label}`}>
                            <span className="w-16 text-[var(--ink-2)]">{f.label}</span>
                            <div className="flex-1 h-[6px] bg-[var(--hairline)]/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--brand)]/40 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-12 text-right font-mono text-[11px] text-[var(--ink-3)]">
                              {f.value >= 10000 ? `${(f.value / 1000).toFixed(1)}k` : f.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* 开放获取 */}
                  <div className="rounded-lg bg-[#f9f9f6] border hairline p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] mb-3">
                      <Globe className="h-4 w-4 text-[var(--ink-2)]" />
                      开放获取
                    </div>
                    <div className="space-y-2">
                      {metaFacets.byAccess.map((f) => {
                        const maxVal = Math.max(...metaFacets.byAccess.map((x) => x.value));
                        const pct = maxVal > 0 ? (f.value / maxVal) * 100 : 0;
                        return (
                          <div key={f.label} onClick={() => handleFacetClick("byAccess", f.label)} className="flex items-center gap-2 text-[12px] cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-[#4caf50]/[0.06] transition-colors" title={`点击筛选：${f.label}`}>
                            <span className="w-16 text-[var(--ink-2)]">{f.label}</span>
                            <div className="flex-1 h-[6px] bg-[var(--hairline)]/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[#4caf50]/40 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-14 text-right font-mono text-[11px] text-[var(--ink-3)]">
                              {f.value >= 1000000 ? `${(f.value / 1000000).toFixed(1)}M` : f.value >= 10000 ? `${(f.value / 1000).toFixed(1)}k` : f.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* 期刊 / 会议 */}
                  <div className="rounded-lg bg-[#f9f9f6] border hairline p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] mb-3">
                      <BookOpen className="h-4 w-4 text-[var(--ink-2)]" />
                      期刊 / 会议
                    </div>
                    <div className="space-y-2">
                      {metaFacets.byVenue.map((f) => {
                        const maxVal = Math.max(...metaFacets.byVenue.map((x) => x.value));
                        const pct = maxVal > 0 ? (f.value / maxVal) * 100 : 0;
                        return (
                          <div key={f.label} onClick={() => handleFacetClick("byVenue", f.label)} className="flex items-center gap-2 text-[12px] cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-[var(--brand)]/[0.06] transition-colors" title={`点击筛选：${f.label}`}>
                            <span className="w-20 text-[var(--ink-2)] truncate">{f.label}</span>
                            <div className="flex-1 h-[6px] bg-[var(--hairline)]/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--brand)]/40 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-12 text-right font-mono text-[11px] text-[var(--ink-3)]">
                              {f.value >= 10000 ? `${(f.value / 1000).toFixed(1)}k` : f.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* 引用次数 */}
                  <div className="rounded-lg bg-[#f9f9f6] border hairline p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] mb-3">
                      <TrendingUp className="h-4 w-4 text-[var(--ink-2)]" />
                      引用次数
                    </div>
                    <div className="space-y-2">
                      {metaFacets.byCitation.map((f) => {
                        const maxVal = Math.max(...metaFacets.byCitation.map((x) => x.value));
                        const pct = maxVal > 0 ? (f.value / maxVal) * 100 : 0;
                        return (
                          <div key={f.label} onClick={() => handleFacetClick("byCitation", f.label)} className="flex items-center gap-2 text-[12px] cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-[#f44336]/[0.06] transition-colors" title={`点击筛选：${f.label}`}>
                            <span className="w-20 text-[var(--ink-2)]">{f.label}</span>
                            <div className="flex-1 h-[6px] bg-[var(--hairline)]/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[#f44336]/30 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-14 text-right font-mono text-[11px] text-[var(--ink-3)]">
                              {f.value >= 1000000 ? `${(f.value / 1000000).toFixed(1)}M` : f.value >= 10000 ? `${(f.value / 1000).toFixed(1)}k` : f.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 元数据样例标题行 */}
              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-[14px] font-medium text-[var(--ink)]">元数据样例</h3>
                <span className="text-[12px] text-[var(--ink-3)]">共 {Math.min(metaResults.length, 100)} 条 · 每页 {PAGE_SIZE} 条</span>
              </div>

              {/* 表格（对齐设计师稿：标题 | 引用 | 可用性 | doc_id） */}
              <div className="mt-3">
                {/* 表头 */}
                <div className="flex items-center px-4 py-2.5 text-[12px] font-medium text-[var(--ink-2)] border-b hairline">
                  <span className="flex-1">标题</span>
                  <span className="w-[60px] text-center">引用</span>
                  <span className="w-[80px] text-center">可用性</span>
                  <span className="w-[60px] text-center">doc_id</span>
                </div>
                {/* 行 */}
                {metaResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                  <div key={r.id} className="flex items-center px-4 py-3 border-b hairline last:border-0 hover:bg-[#fafaf7] transition-colors">
                    {/* 标题列 */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[13px] font-medium text-[var(--ink)] leading-snug line-clamp-1">{r.title}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink-3)] line-clamp-1">
                        {r.authors} · {r.year} · {r.venue}{r.doi ? ` · doi:${r.doi}` : ""}
                      </p>
                    </div>
                    {/* 引用列 */}
                    <span className="w-[60px] text-center font-mono text-[13px] text-[var(--ink)]">{r.citations}</span>
                    {/* 可用性列 */}
                    <span className="w-[80px] flex justify-center">
                      {r.availability === "oa" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[11px] font-medium text-[#2e7d32]">OA</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[11px] text-[var(--ink-2)]">
                          <Database className="h-3 w-3" />
                          content
                        </span>
                      )}
                    </span>
                    {/* doc_id 复制列 */}
                    <span className="w-[60px] flex justify-center">
                      <button
                        onClick={() => { navigator.clipboard.writeText(r.doc_id); toast.success(`已复制 ${r.doc_id}`); }}
                        className="h-7 w-7 inline-flex items-center justify-center rounded border hairline text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
                        title={r.doc_id}>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {metaResults.length > PAGE_SIZE && (
                <div className="mt-4 pt-3 border-t hairline flex items-center justify-between">
                  <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                    第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, metaResults.length)} 条 · 共 {Math.min(metaResults.length, 100)} 条
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-40 transition-colors"
                      aria-label="上一页">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 font-mono text-[12.5px] text-[var(--ink)]">
                      {page} <span className="text-[var(--ink-3)]">/ {Math.ceil(Math.min(metaResults.length, 100) / PAGE_SIZE)}</span>
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(Math.min(metaResults.length, 100) / PAGE_SIZE), p + 1))}
                      disabled={page >= Math.ceil(Math.min(metaResults.length, 100) / PAGE_SIZE)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-40 transition-colors"
                      aria-label="下一页">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* STATUS + RESULTS — 自由检索模式 */}
          {meta && results && committed && searchMode === "free" && (
            <section className="mt-6">
              <IntegrationBubble />
              <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px] text-[var(--ink-2)]">
                <span>
                  搜索结果{" "}
                  <span className="text-[var(--ink)]">「{committed}」</span>
                </span>
                <span className="text-[var(--hairline-strong)]">·</span>
                <span>
                  共{" "}
                  <span className="font-display text-[14px] text-[var(--ink)]">
                    {meta.count}
                  </span>{" "}
                  条结果
                </span>
                <span className="text-[var(--hairline-strong)]">·</span>
                <span className="font-mono">
                  耗时 {meta.ms.toLocaleString()} ms
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)]">
                  <Sparkles className="h-3 w-3 text-[var(--brand)]" />
                  LLM 已清洗 HTML / Markdown 残片
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {results!.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                  <ResultCard key={r.id} r={r} q={committed} />
                ))}
              </div>
              {results!.length > PAGE_SIZE && (
                <div className="mt-6 pt-4 border-t hairline flex items-center justify-between">
                  <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                    第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results!.length)} 条 · 共 {results!.length} 条
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      aria-label="上一页">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 font-mono text-[12.5px] text-[var(--ink)]">
                      {page} <span className="text-[var(--ink-3)]">/ {Math.ceil(results!.length / PAGE_SIZE)}</span>
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(results!.length / PAGE_SIZE), p + 1))}
                      disabled={page >= Math.ceil(results!.length / PAGE_SIZE)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      aria-label="下一页">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ═══ HOW IT WORKS — 3 步上手 (Lovable 风格左右布局自动轮播) ═══ */}
          <HowItWorksSection inputRef={inputRef} />

          {/* ═══ API CAPABILITIES — 核心接口能力 ═══ */}
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-block h-px w-8 bg-[var(--brand)]/50" />
              <h2 className="font-display text-[22px] text-[var(--ink)]">核心接口</h2>
              <span className="text-[12px] text-[var(--ink-3)] ml-2">点击"试一试"即可在上方体验</span>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {/* agentic-search */}
              <div className="group p-6 rounded-2xl border hairline bg-white hover:border-[var(--brand)]/30 hover:shadow-[0_4px_20px_rgba(91,91,247,0.06)] transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Sparkles className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <span className="font-mono text-[13px] font-medium text-[var(--ink)]">agentic-search</span>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                  自然语言语义检索，返回可引用 chunk（含 doc_id、标题、摘要、相关度分数），覆盖 2800 万篇全文。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#f4f3ee] text-[var(--ink-3)]">2800万全文</span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#f4f3ee] text-[var(--ink-3)]">语义匹配</span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#f4f3ee] text-[var(--ink-3)]">返回 chunk</span>
                </div>
                <button
                  onClick={() => {
                    setSearchMode("free");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setTimeout(() => inputRef.current?.focus(), 400);
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-medium border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all duration-200">
                  <Sparkles className="h-3 w-3" /> 试一试
                </button>
              </div>
              {/* meta-search */}
              <div className="group p-6 rounded-2xl border hairline bg-white hover:border-[var(--brand)]/30 hover:shadow-[0_4px_20px_rgba(91,91,247,0.06)] transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <span className="font-mono text-[13px] font-medium text-[var(--ink)]">meta-search</span>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                  结构化元数据检索，支持按作者、年份、期刊、学科、引用量筛选与排序，覆盖 4.7 亿条记录。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#f4f3ee] text-[var(--ink-3)]">4.7亿元数据</span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#f4f3ee] text-[var(--ink-3)]">字段级筛选</span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#f4f3ee] text-[var(--ink-3)]">分面统计</span>
                </div>
                <button
                  onClick={() => {
                    setSearchMode("filter");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-medium border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all duration-200">
                  <SlidersHorizontal className="h-3 w-3" /> 试一试
                </button>
              </div>
            </div>
          </section>

          {/* ═══ WORKFLOW SCENARIOS — 场景工作流 ═══ */}
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-block h-px w-8 bg-[var(--brand)]/50" />
              <h2 className="font-display text-[22px] text-[var(--ink)]">场景工作流</h2>
              <span className="text-[12px] text-[var(--ink-3)] ml-2">多接口组合 · 可复制代码 · 一键接入</span>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  title: "文献综述 Agent",
                  desc: "agentic-search 检索 → content 获取全文 → LLM 生成综述摘要",
                  apis: ["agentic-search", "content"],
                  code: `import requests\n\n# Step 1: 语义检索\nhits = requests.post(\n  "https://api.sciverse.space/agentic-search",\n  json={"query": "CRISPR 基因编辑最新进展", "top_k": 10}\n).json()["hits"]\n\n# Step 2: 获取全文\nfor h in hits[:3]:\n  content = requests.get(\n    f"https://api.sciverse.space/content/{h['doc_id']}"\n  ).json()\n  print(content["title"], len(content["text"]))`,
                },
                {
                  title: "学科趋势分析",
                  desc: "meta-search 按年份+学科筛选 → 统计分布 → 可视化趋势",
                  apis: ["meta-search"],
                  code: `import requests\n\n# 按年份筛选生命科学领域\nresult = requests.post(\n  "https://api.sciverse.space/meta-search",\n  json={\n    "filters": {"domain": "生命科学", "year_range": "2020-2026"},\n    "facets": ["year", "type"],\n    "limit": 0  # 只要统计\n  }\n).json()\nprint(f"命中 {result['total']} 篇")\nprint(result["facets"])`,
                },
                {
                  title: "智能引文推荐",
                  desc: "agentic-search 找相关论文 → meta-search 验证引用量 → 排序推荐",
                  apis: ["agentic-search", "meta-search"],
                  code: `import requests\n\n# Step 1: 找语义相关论文\nhits = requests.post(\n  "https://api.sciverse.space/agentic-search",\n  json={"query": "蛋白质折叠预测方法", "top_k": 20}\n).json()["hits"]\n\n# Step 2: 用 meta-search 获取引用量\ndoc_ids = [h["doc_id"] for h in hits]\nmeta = requests.post(\n  "https://api.sciverse.space/meta-search",\n  json={"doc_ids": doc_ids, "sort": "citations_desc"}\n).json()\nprint(meta["results"][:5])`,
                },
              ].map((wf) => (
                <div
                  key={wf.title}
                  className="group flex flex-col p-5 rounded-2xl border hairline bg-white hover:border-[var(--brand)]/30 hover:shadow-[0_4px_20px_rgba(91,91,247,0.06)] transition-all duration-300">
                  <h3 className="text-[15px] font-medium text-[var(--ink)]">{wf.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-2)] flex-1">{wf.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {wf.apis.map((api) => (
                      <span key={api} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--brand-soft)] text-[var(--brand)]">
                        {api}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 relative">
                    <pre className="p-3 rounded-lg bg-[#1e1e2e] text-[11px] leading-[1.6] text-[#cdd6f4] font-mono overflow-x-auto max-h-[180px]">
                      <code>{wf.code}</code>
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(wf.code);
                        toast.success("代码已复制");
                      }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-md grid place-items-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                      aria-label="复制代码">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <a
                    href="/docs#api"
                    className="mt-4 inline-flex items-center gap-1 text-[12px] text-[var(--brand)] hover:underline">
                    查看完整接入文档 →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* COOKBOOK SHOWCASE */}
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-display text-[26px] text-[var(--ink)]">
                场景案例<span className="italic"> Cookbook</span>
              </h2>
              <a
                href="/docs#cookbook"
                className="text-[12px] text-[var(--ink-3)] hover:text-[var(--brand)] transition-colors duration-300 flex items-center gap-2">
                <span className="inline-block h-px w-8 bg-[var(--ink-3)]/40" />
                查看全部 {COOKBOOKS.length} 个案例 →
              </a>
            </div>
            <CookbookGrid items={COOKBOOKS.map((c) => ({
                  slug: c.slug,
                  cover: c.coverImage || "",
                  title: c.title,
                  desc: c.subtitle,
                  tags: c.tags as string[],
                }))} />
          </section>

          {/* DATA SCALE */}
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-display text-[26px] text-[var(--ink)]">
                Sciverse 数据能力<span className="italic"> 全景</span>
              </h2>
              <div className="text-[12px] text-[var(--ink-3)] flex items-center gap-2">
                <span className="inline-block h-px w-8 bg-[var(--ink-3)]/40" />
                更新于 2026 年 5 月
              </div>
            </div>
            <DataScaleGrid>
              {[
                  { num: "341M+", unit: "篇", label: "学术文献", note: "1400 — 2026 · 跨越六个世纪", pct: 96, Icon: FileText },
                  { num: "105M+", unit: "册", label: "图书", note: "含古籍与手稿", pct: 78, Icon: Layers },
                  { num: "70M+", unit: "件", label: "全球专利", note: "与文献交叉引用", pct: 70, Icon: Atom },
                  { num: "102M+", unit: "篇", label: "AI-Ready 全文", note: "Agent 可直接消费", pct: 88, Icon: Boxes },
                ].map((d, i) => (
                  <div
                    key={d.label}
                    data-scale-card
                    data-scale-idx={i}
                    className={cn(
                      "group relative px-5 py-7 min-w-0 transition-colors hover:bg-[#f7f6f1]",
                      i !== 0 && "lg:border-l hairline",
                      (i === 1 || i === 3) && "border-l hairline lg:border-l",
                    )}>
                    <div className="flex items-center">
                      <d.Icon
                        className="h-[14px] w-[14px] text-[var(--ink-3)] transition-colors duration-300 group-hover:text-[var(--brand)]"
                        strokeWidth={1.4}
                      />
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5 min-w-0">
                      <span className="font-display font-semibold leading-none tracking-[-0.025em] text-[var(--ink)] text-[clamp(30px,3.2vw,44px)] truncate transition-colors duration-300 group-hover:text-[var(--brand)]">
                        <CountUp value={d.num} delay={i * 120} />
                      </span>
                      <span className="text-[12px] text-[var(--ink-2)] shrink-0">{d.unit}</span>
                    </div>
                    <div className="mt-3 text-[13px] text-[var(--ink)]">{d.label}</div>
                    <div className="mt-1 font-mono text-[10.5px] tracking-[0.02em] text-[var(--ink-3)] truncate">
                      {d.note}
                    </div>
                    <div className="mt-4 h-[2px] w-full bg-[var(--brand)]/12 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${d.pct}%`,
                          background:
                            "linear-gradient(90deg, rgba(91,91,247,0.85) 0%, rgba(91,91,247,0.55) 100%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </DataScaleGrid>

            <div className="mt-5 grid md:grid-cols-3 gap-px bg-[var(--brand)]/10 rounded-xl overflow-hidden border hairline">
              {[                { k: "原生", en: "Agent First", metric: "Agent", unit: "优先", v: "原生支持 Manus / Claude / Cursor", Icon: Zap },
                { k: "最新", en: "Freshest", metric: "T+1", unit: "同步", v: "每日新增百万级文献与专利入库", Icon: Activity },
                { k: "最全", en: "Broadest", metric: "516M+", unit: "知识记录", v: "814 种语言 · 1.3M+ 期刊与会议覆盖", Icon: Globe2 },
              ].map((it) => (
                <div key={it.k} className="bg-[var(--paper)] p-5 group transition-colors duration-300 hover:bg-[var(--brand-soft)]/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full border hairline grid place-items-center text-[var(--ink-2)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)] transition-all duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-[1.06]">
                        <it.Icon className="h-3.5 w-3.5 transition-[stroke-width] duration-500 ease-out group-hover:[stroke-width:2]" strokeWidth={1.6} />
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                        {it.en}
                      </span>
                    </div>
                    <span className="font-display italic text-[12px] text-[var(--ink-3)]">{it.k}</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1 transition-transform duration-500 ease-out group-hover:-translate-y-[2px]">
                    <span className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                      {it.metric}
                    </span>
                    <span className="text-[12px] text-[var(--ink-2)] transition-colors duration-300 group-hover:text-[var(--brand)]/70">{it.unit}</span>
                  </div>
                  <div className="mt-2 text-[12.5px] text-[var(--ink-2)] leading-relaxed">{it.v}</div>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-24 pb-10 pt-8 border-t hairline flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[var(--ink-3)]">
            <span className="font-mono">© 2026 Sciverse · OpenDataLab</span>
            <span>v0.1 · Editorial Lab</span>
            <a href="/docs" className="link-edit ml-auto">查看 API 文档</a>
            <a href="https://sciverse.space" className="link-edit" target="_blank" rel="noreferrer">
              访问主站
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
