export default function NailMotif({ variant = 'shape', className = '' }) {
  const shapes = variant === 'length'
    ? ['M18 96V64a16 16 0 0 1 32 0v32Z', 'M58 96V44a16 16 0 0 1 32 0v52Z', 'M98 96V24a16 16 0 0 1 32 0v72Z']
    : ['M10 96V45Q10 19 26 8Q42 19 42 45V96Z', 'M54 96V43a16 22 0 0 1 32 0v53Z', 'M98 96V37q0-8 8-8h16q8 0 8 8v59Z']

  return <svg viewBox="0 0 140 110" className={className} aria-hidden="true" focusable="false">
    {shapes.map((d) => <path key={d} d={d} fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.5" />)}
    <path d="m72 5 2.5 7.5L82 15l-7.5 2.5L72 25l-2.5-7.5L62 15l7.5-2.5Z" fill="currentColor" />
  </svg>
}
