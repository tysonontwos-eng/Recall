/**
 * Color-coded word diff display for Full Recall results.
 * @param {{ word: string, status: "correct"|"wrong"|"missing" }[]} diff
 */
export default function WordDiff({ diff }) {
  if (!diff || diff.length === 0) return null

  return (
    <div className="word-diff">
      {diff.map((entry, i) => (
        <span key={i} className={`word-diff__word word-diff__word--${entry.status}`}>
          {entry.word}{" "}
        </span>
      ))}
    </div>
  )
}
