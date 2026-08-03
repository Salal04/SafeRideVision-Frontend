// ---------------------------------------------------------------------------
// RESULTS / SAMPLE OUTPUTS DATA
// ---------------------------------------------------------------------------
// Edit this file to add, remove, or reorder sample clips shown on the Home
// page "See It In Action" section. The list is variable length \u2014 add as
// many or as few entries as you want, nothing is hardcoded to 3 or 4.
//
// Field guide:
//   id            (required) unique slug, used as the React key
//   name          (required) short title shown above the pair of videos
//   description   (optional) 1-2 sentence blurb \u2014 leave out entirely (or
//                 delete the line) and it simply won't render
//   original      (required) path/URL to the raw input clip
//   output        (required) path/URL to the processed/annotated clip
//   poster        (optional) thumbnail shown before the video plays
//
// Where to put the actual video files:
//   Drop your .mp4 files in `public/results/` (already created for you).
//   Anything in `public/` is served as-is from the site root, so a file at
//   public/results/junctionA-original.mp4 is referenced below simply as
//   '/results/junctionA-original.mp4'. No import needed, and there's no
//   bundler size limit like there is for files under src/assets/.
//
//   If you'd rather host the videos elsewhere (S3, a CDN, your backend),
//   just paste the full https:// URL in `original` / `output` instead.
// ---------------------------------------------------------------------------

const results = [
  {
    id: 'sample-1',
    name: 'Daily Traffic',
    description: 'Two bikes turning in quick succession; Bike Turn Detection By Drawing Polygon Manually',
    original: '/results/sample-1-original.mp4',
    output: '/results/sample-1-output.mp4',
  },
  {
    id: 'sample-1-1',
    name: 'Daily Traffic',
    description: 'Two bikes turning in quick succession; Bike Turn Detection With Trajectory and Orientation Model',
    original: '/results/sample-1-original.mp4',
    output: '/results/sample-1-output2.mp4',
  },
  {
    id: 'sample-2',
    name: 'Daily Traffic',
    description: 'Capturing Rider Turing with Signals on',
    original: '/results/sample-2-original.mp4',
    output: '/results/sample-2-output.mp4',
  },
    {
    id: 'sample-3',
    name: 'Daily Traffic',
    description: 'Capturing Rider Turing with Signals on',
    original: '/results/sample-3-original.mp4',
    output: '/results/sample-3-ouput.mp4',
  },
    {
    id: 'sample-3',
    name: 'Daily Traffic',
    description: 'Capturing Rider Turing with Signals on',
    original: '/results/sample-4-original.mp4',
    output: '/results/sample-4-ouput.mp4',
  },
]

export default results