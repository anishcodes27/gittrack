/**
 * ═══════════════════════════════════════════════════════════════════
 * GitTrack Language Specialization Tag Engine
 * ═══════════════════════════════════════════════════════════════════
 *
 * Analyzes a user's language distribution and assigns a human-readable
 * developer specialization tag. This powers the "Strong Frontend Developer"
 * badge visible on the dashboard profile header.
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Tag definitions in priority order.
 * Each rule specifies:
 *   - languages: array of language names that qualify
 *   - minPercentage: combined % threshold to trigger the tag
 *   - tag: display label
 *   - detail: subtitle description
 *   - icon: emoji icon for visual display
 */
const TAG_RULES = [
  // Specialization: AI / ML
  {
    languages: ['Python', 'Jupyter Notebook', 'R'],
    minPercentage: 55,
    tag: 'AI & ML Engineer',
    detail: 'Deep expertise in data science, machine learning & scientific computing',
    icon: '🧠',
  },
  // Specialization: Systems Programming
  {
    languages: ['Rust', 'C', 'C++', 'Assembly'],
    minPercentage: 50,
    tag: 'Systems Engineer',
    detail: 'Low-level, high-performance systems and infrastructure development',
    icon: '⚙️',
  },
  // Specialization: Frontend
  {
    languages: ['JavaScript', 'TypeScript', 'CSS', 'HTML'],
    minPercentage: 60,
    tag: 'Strong Frontend Developer',
    detail: 'Specializes in UI/UX engineering, React, and modern web technologies',
    icon: '🎨',
  },
  // Specialization: Mobile
  {
    languages: ['Swift', 'Kotlin', 'Dart'],
    minPercentage: 55,
    tag: 'Mobile Engineer',
    detail: 'Native and cross-platform mobile application development',
    icon: '📱',
  },
  // Specialization: Backend / Cloud
  {
    languages: ['Go', 'Java', 'C#', 'Scala', 'Elixir'],
    minPercentage: 50,
    tag: 'Backend & Cloud Engineer',
    detail: 'Distributed systems, microservices, and cloud-native architecture',
    icon: '☁️',
  },
  // Specialization: DevOps / Infrastructure
  {
    languages: ['Shell', 'HCL', 'Dockerfile', 'YAML'],
    minPercentage: 45,
    tag: 'DevOps Engineer',
    detail: 'Infrastructure-as-code, CI/CD pipelines, and cloud operations',
    icon: '🛠️',
  },
  // Specialization: Web (Full Stack, less specific)
  {
    languages: ['JavaScript', 'TypeScript', 'Python', 'Ruby'],
    minPercentage: 60,
    tag: 'Full Stack Developer',
    detail: 'Proficient across the entire web development stack',
    icon: '🚀',
  },
];

/**
 * Assigns a specialization tag based on language distribution.
 *
 * @param {Array<{name: string, percentage: number}>} languages - Sorted by percentage desc
 * @returns {{ tag: string, detail: string, icon: string }}
 */
const assignSpecialtyTag = (languages) => {
  if (!languages || languages.length === 0) {
    return {
      tag: 'Polyglot Developer',
      detail: 'Contributes across multiple programming languages and ecosystems',
      icon: '🌐',
    };
  }

  // Build a quick lookup map: language name → percentage
  const langMap = {};
  for (const lang of languages) {
    langMap[lang.name] = (langMap[lang.name] || 0) + lang.percentage;
  }

  // Evaluate each rule
  for (const rule of TAG_RULES) {
    const combinedPercentage = rule.languages.reduce(
      (sum, langName) => sum + (langMap[langName] || 0),
      0
    );

    if (combinedPercentage >= rule.minPercentage) {
      console.log(
        `[TagEngine] Matched "${rule.tag}" with ${combinedPercentage.toFixed(1)}% in [${rule.languages.join(', ')}]`
      );
      return {
        tag: rule.tag,
        detail: rule.detail,
        icon: rule.icon,
        combinedPercentage: Math.round(combinedPercentage),
      };
    }
  }

  // Default: no clear specialization
  return {
    tag: 'Polyglot Developer',
    detail: 'Contributes across multiple programming languages and ecosystems',
    icon: '🌐',
    combinedPercentage: 0,
  };
};

module.exports = { assignSpecialtyTag, TAG_RULES };
