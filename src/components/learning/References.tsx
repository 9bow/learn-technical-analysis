interface Source {
  title: string
  url: string
}

interface ReferencesProps {
  sources: Source[]
}

export default function References({ sources }: ReferencesProps) {
  return (
    <section>
      <h2>참고 자료</h2>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
