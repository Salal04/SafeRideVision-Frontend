// ---------------------------------------------------------------------------
// TEAM / AUTHORS DATA
// ---------------------------------------------------------------------------
// Edit this file to add, remove, or update team members. Every field except
// `id`, `name`, and `designation` is OPTIONAL — if you leave a field out
// (or delete it), that section simply will not render on the card or the
// detail view. Nothing shows an empty box.
//
// Field guide:
//   id            (required) unique slug, used for the URL-safe card key
//   name          (required) full name
//   designation   (required) role on the project, e.g. "Team Lead", "ML Engineer"
//   photo         (optional) path/URL to a photo — put images in src/assets/
//                 and import them, or use a public/ path. Leave out for a
//                 generated initial-avatar instead.
//   education     (optional) array of { degree, institute, year }
//   experience    (optional) array of { role, org, duration } — past work,
//                 internships, or prior projects. Leave out entirely if none.
//   contribution  (optional) string OR array of strings — what they built on
//                 THIS project specifically.
//   skills        (optional) array of short strings, e.g. ['PyTorch', 'YOLO']
//   bio           (optional) 1-3 sentence personal blurb
//   links         (optional) { github, linkedin, email, portfolio }
// ---------------------------------------------------------------------------

const team = [
  {
    id: 'Umbreen Kausar',
    name: 'Umbreen Kausar',
    designation: 'AI Researcher',
    education: [
      { degree: 'BS Computer Science', institute: 'Virtual University, Pakistan', year: '2020 – 2024' },
      { degree: 'MPhill In AI', institute: 'PUCIT-Lahore', year: '2024 – 2026' },
    ],
    experience: [
      { role: 'ML Intern', org: 'Devsinc', duration: 'Summer 2025' },
    ],
    contribution:
      'Designed the overall detection-to-verdict pipeline architecture, trained the YOLO bike detector, and led integration of the tracking and orientation stages.',
    skills: ['PyTorch', 'YOLO', 'DeepSORT', 'System Design'],
    bio: 'Focused on real-time computer vision and its application to road safety.',
    links: {
      github: 'https://github.com/',
      linkedin: 'https://linkedin.com/',
      email: 'ayesha@example.com',
    },
  },
  {
    id: 'Salal',
    name: 'Muhammad Salal',
    designation: 'AI Engineer/ Developer',
    education: [
      { degree: 'BS Software Engineering', institute: 'PUCIT', year: '2022 – 2026' },
    ],
    contribution:
      'Built and trained the mirror-detection and indicator-detection models, and handled the frame-level annotation pipeline.',
    skills: ['OpenCV', 'Object Detection', 'Data Annotation'],
    links: {
      github: 'https://github.com/',
    },
  },
  {
    id: 'Farooq',
    name: 'DR Farooq',
    designation: 'Assistant Professor / Supervisor',
    education: [
      { degree: 'BS Artificial Intelligence', institute: 'Habib University, Karachi', year: '2022 – 2026' },
    ],
    experience: [
      { role: 'Research Assistant', org: 'University AI Lab', duration: '2024 – 2025' },
    ],
    contribution:
      'Designed and trained the ResNet + LSTM blink-verdict model, and built the per-bike indicator history buffer.',
    skills: ['ResNet', 'LSTM', 'Sequence Modeling'],
    links: {
      linkedin: 'https://linkedin.com/',
    },
  },
]

export default team
