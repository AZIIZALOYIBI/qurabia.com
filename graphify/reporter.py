"""
Reporter: generates graphify-out/GRAPH_REPORT.md
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from .graph import Graph


def generate_report(graph: Graph, out_dir: Path, target_root: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    report_path = out_dir / "GRAPH_REPORT.md"

    stats = graph.stats()
    god_nodes = graph.god_nodes(top_k=15)
    communities = _group_communities(graph)

    # حساب مقاييس إضافية
    total_nodes = stats['nodes']
    total_edges = stats['edges']
    avg_degree = (total_edges * 2) / total_nodes if total_nodes > 0 else 0
    density = (total_edges / (total_nodes * (total_nodes - 1) / 2)) if total_nodes > 1 else 0

    # تحليل توزيع الدرجات
    degrees = [graph.in_degree(node) + graph.out_degree(node) for node in graph.nodes.keys()]
    max_degree = max(degrees) if degrees else 0
    min_degree = min(degrees) if degrees else 0

    # تحليل المجتمعات
    community_sizes = [len(members) for members in communities.values()]
    avg_community_size = sum(community_sizes) / len(community_sizes) if community_sizes else 0
    largest_community_size = max(community_sizes) if community_sizes else 0

    lines: List[str] = [
        f"# Knowledge Graph Report — `{target_root}`",
        "",
        f"> **تم التوليد**: {_get_timestamp()}",
        f"> **منصة QURABIA** — نظام تحليل الكود المعرفي",
        "",
        "## 📊 نظرة عامة",
        "",
        f"| المقياس | القيمة | الوصف |",
        f"|---------|--------|-------|",
        f"| إجمالي العُقد | **{stats['nodes']:,}** | عدد الملفات والوحدات في المشروع |",
        f"| إجمالي الحواف | **{stats['edges']:,}** | عدد الاتصالات والتبعيات |",
        f"| اللغات المستخدمة | **{stats['languages']}** | عدد لغات البرمجة |",
        f"| المجتمعات | **{len(communities)}** | مجموعات الملفات المترابطة |",
        f"| متوسط الدرجة | **{avg_degree:.2f}** | متوسط عدد الاتصالات لكل عقدة |",
        f"| كثافة الشبكة | **{density:.4f}** | نسبة الاتصالات الفعلية من الممكنة |",
        f"| أعلى درجة | **{max_degree}** | أكثر عقدة ارتباطاً |",
        f"| أقل درجة | **{min_degree}** | أقل عقدة ارتباطاً |",
        "",
        "### 📈 مؤشرات الجودة",
        "",
        _render_quality_indicators(total_nodes, total_edges, avg_degree, density, len(communities)),
        "",
        "---",
        "",
        "## 🔝 God Nodes (الأكثر ارتباطاً)",
        "",
        "> هذه هي الملفات الأكثر ارتباطاً. تمثل المحاور المعمارية الرئيسية.",
        "> **تأثير التغييرات**: التعديلات على هذه الملفات لها تأثير واسع على المشروع.",
        "",
        "| الترتيب | العقدة | داخل | خارج | الإجمالي | النوع | التأثير |",
        "|---------|--------|------|------|---------|-------|---------|",
    ]

    for rank, (node_path, degree) in enumerate(god_nodes, 1):
        info = graph.nodes.get(node_path)
        if info is None:
            continue
        in_deg = graph.in_degree(node_path)
        out_deg = graph.out_degree(node_path)
        impact = "🔴 عالي جداً" if degree > 20 else "🟠 عالي" if degree > 10 else "🟡 متوسط"
        lines.append(
            f"| {rank} | `{node_path}` | {in_deg} "
            f"| {out_deg} | **{degree}** | {info.kind} | {impact} |"
        )

    lines += [
        "",
        "---",
        "",
        "## 🏘️ هيكل المجتمعات",
        "",
        "> مجموعات الملفات التي تشترك في تبعيات متبادلة قوية.",
        "> كل مجتمع عادة ما يمثل ميزة أو طبقة معمارية.",
        "",
        f"**إجمالي المجتمعات**: {len(communities)} | ",
        f"**متوسط الحجم**: {avg_community_size:.1f} ملف | ",
        f"**أكبر مجتمع**: {largest_community_size} ملف",
        "",
    ]

    for cid, members in sorted(communities.items(), key=lambda x: -len(x[1])):
        community_label = _community_label(members, graph)
        coverage_pct = (len(members) / total_nodes * 100) if total_nodes > 0 else 0
        lines.append(f"### Community {cid}: {community_label}")
        lines.append(f"**الحجم**: {len(members)} عقدة ({coverage_pct:.1f}% من المشروع)")
        lines.append("")
        for m in sorted(members)[:20]:
            info = graph.nodes.get(m)
            kind_tag = f" `[{info.kind}]`" if info else ""
            in_deg = graph.in_degree(m)
            out_deg = graph.out_degree(m)
            lines.append(f"- `{m}`{kind_tag} — ⬇️ {in_deg} | ⬆️ {out_deg}")
        if len(members) > 20:
            lines.append(f"- _…و {len(members) - 20} ملف آخر_")
        lines.append("")

    lines += [
        "---",
        "",
        "## 📚 توزيع اللغات",
        "",
        "| اللغة | الملفات | الأسطر | النسبة |",
        "|-------|---------|--------|---------|",
    ]
    lang_stats: Dict[str, Dict[str, int]] = {}
    for info in graph.nodes.values():
        ls = lang_stats.setdefault(info.language, {"files": 0, "lines": 0})
        ls["files"] += 1
        ls["lines"] += info.line_count

    total_lines = sum(data['lines'] for data in lang_stats.values())
    for lang, data in sorted(lang_stats.items(), key=lambda x: -x[1]['lines']):
        pct = (data['lines'] / total_lines * 100) if total_lines > 0 else 0
        lines.append(f"| {lang} | {data['files']} | {data['lines']:,} | {pct:.1f}% |")

    lines += [
        "",
        f"**إجمالي الأسطر**: {total_lines:,}",
        "",
        "---",
        "",
        "## 💡 رؤى تحليلية",
        "",
        _render_insights(graph, god_nodes, communities, lang_stats, avg_degree, density),
        "",
        "---",
        "",
        "## 📖 كيفية قراءة هذا التقرير",
        "",
        "- **God Nodes** هي الملفات المستوردة من قبل العديد من الملفات الأخرى — التغييرات هنا لها تأثير واسع.",
        "- **المجتمعات** هي مجموعات من الملفات التي تتجمع معاً؛ كل مجتمع غالباً ما يمثل ميزة أو طبقة.",
        "- **كثافة الشبكة** العالية تشير إلى ترابط قوي، بينما الكثافة المنخفضة تشير إلى فصل أفضل للوحدات.",
        "- استخدم `python3 -m graphify query \"<السؤال>\"` لتتبع الاتصالات بين المكونات.",
        "- استخدم `python3 -m graphify explain \"<الرمز أو الملف>\"` للحصول على تفصيل مفصل لأي عقدة.",
        "",
    ]

    report_path.write_text("\n".join(lines), encoding="utf-8")


def _get_timestamp() -> str:
    """إرجاع طابع زمني منسق"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _render_quality_indicators(nodes: int, edges: int, avg_degree: float, density: float, communities: int) -> str:
    """يولد مؤشرات جودة الكود"""
    indicators = []

    # تقييم التعقيد
    if avg_degree > 15:
        indicators.append("🔴 **التعقيد**: عالي جداً — قد يكون من الصعب صيانة المشروع")
    elif avg_degree > 10:
        indicators.append("🟠 **التعقيد**: متوسط إلى عالي — انتبه للتبعيات المتشابكة")
    elif avg_degree > 5:
        indicators.append("🟡 **التعقيد**: متوسط — توازن معقول")
    else:
        indicators.append("🟢 **التعقيد**: منخفض — بنية نظيفة ومنفصلة")

    # تقييم الكثافة
    if density > 0.3:
        indicators.append("🔴 **الكثافة**: عالية جداً — ترابط مفرط قد يعيق إعادة الاستخدام")
    elif density > 0.15:
        indicators.append("🟠 **الكثافة**: متوسطة إلى عالية — نظر في فصل بعض الوحدات")
    elif density > 0.05:
        indicators.append("🟢 **الكثافة**: جيدة — توازن صحي بين الترابط والفصل")
    else:
        indicators.append("🟡 **الكثافة**: منخفضة — ملفات مستقلة نسبياً")

    # تقييم المجتمعات
    modularity = communities / nodes if nodes > 0 else 0
    if modularity > 0.2:
        indicators.append("🟢 **النمطية**: ممتازة — بنية معمارية واضحة")
    elif modularity > 0.1:
        indicators.append("🟡 **النمطية**: جيدة — تنظيم منطقي للمكونات")
    else:
        indicators.append("🟠 **النمطية**: منخفضة — قد تحتاج لتحسين التنظيم")

    return "\n".join(f"- {ind}" for ind in indicators)


def _render_insights(graph: Graph, god_nodes: list, communities: dict, lang_stats: dict, avg_degree: float, density: float) -> str:
    """يولد رؤى تحليلية احترافية"""
    insights = []

    # تحليل God Nodes
    if god_nodes:
        top_god = god_nodes[0]
        insights.append(f"- **الملف الأكثر تأثيراً**: `{top_god[0]}` بـ {top_god[1]} اتصال — أي تغيير هنا يؤثر على جزء كبير من المشروع.")

    # تحليل اللغات
    if lang_stats:
        dominant_lang = max(lang_stats.items(), key=lambda x: x[1]['lines'])
        total_lines = sum(data['lines'] for data in lang_stats.values())
        pct = (dominant_lang[1]['lines'] / total_lines * 100) if total_lines > 0 else 0
        insights.append(f"- **اللغة السائدة**: {dominant_lang[0]} ({pct:.1f}% من الكود) — {dominant_lang[1]['files']} ملف، {dominant_lang[1]['lines']:,} سطر.")

    # تحليل المجتمعات
    if communities:
        largest_community = max(communities.items(), key=lambda x: len(x[1]))
        community_label = _community_label(largest_community[1], graph)
        insights.append(f"- **أكبر مجتمع**: {community_label} ({len(largest_community[1])} ملف) — يمثل على الأرجح المكون الأساسي للمشروع.")

    # تحليل الهيكل
    if avg_degree > 10:
        insights.append("- **التوصية**: نظراً لارتفاع متوسط الدرجة، يُنصح بمراجعة التبعيات وتقليل الترابط حيثما أمكن.")

    if density > 0.2:
        insights.append("- **تحذير**: الكثافة العالية تشير إلى ترابط مفرط. فكّر في إعادة هيكلة بعض الوحدات لتحسين الفصل.")

    return "\n".join(insights) if insights else "- لا توجد رؤى إضافية في الوقت الحالي."


def _group_communities(graph: Graph) -> Dict[int, List[str]]:
    groups: Dict[int, List[str]] = {}
    for path, info in graph.nodes.items():
        groups.setdefault(info.community, []).append(path)
    return groups


def _community_label(members: List[str], graph: Graph) -> str:
    """Infer a short human label for a community from its dominant path segments."""
    from collections import Counter

    parts: List[str] = []
    for m in members:
        segs = Path(m).parts
        if len(segs) >= 2:
            parts.append(segs[1])  # second segment, e.g. 'components', 'tests', 'core'
        elif segs:
            parts.append(segs[0])

    if not parts:
        return "misc"
    most_common, _ = Counter(parts).most_common(1)[0]
    return most_common
